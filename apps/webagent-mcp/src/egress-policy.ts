import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { OperationError } from './execution.js';

export interface EgressPolicy {
  assertAllowed(url: URL): Promise<void>;
}

export type HostResolver = (hostname: string) => Promise<string[]>;

const defaultResolver: HostResolver = async (hostname) => {
  const answers = await lookup(hostname, { all: true, verbatim: true });
  return answers.map((answer) => answer.address);
};

function stripIpv6Brackets(hostname: string): string {
  if (hostname.startsWith('[') && hostname.endsWith(']')) return hostname.slice(1, -1);
  return hostname;
}

function isBlockedIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts as [number, number, number, number];

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function ipv6ToBigInt(raw: string): bigint | null {
  let address = raw.toLowerCase().split('%')[0] ?? '';
  if (!address) return null;

  if (address.includes('.')) {
    const lastColon = address.lastIndexOf(':');
    const ipv4 = address.slice(lastColon + 1);
    if (isIP(ipv4) !== 4) return null;
    const octets = ipv4.split('.').map(Number);
    const high = ((octets[0] ?? 0) << 8) | (octets[1] ?? 0);
    const low = ((octets[2] ?? 0) << 8) | (octets[3] ?? 0);
    address = `${address.slice(0, lastColon)}:${high.toString(16)}:${low.toString(16)}`;
  }

  const pieces = address.split('::');
  if (pieces.length > 2) return null;
  const left = pieces[0] ? pieces[0].split(':') : [];
  const right = pieces.length === 2 && pieces[1] ? pieces[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (pieces.length === 1 && missing !== 0)) return null;

  const groups = [...left, ...Array.from({ length: missing }, () => '0'), ...right];
  if (groups.length !== 8) return null;

  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    value = (value << 16n) | BigInt(Number.parseInt(group, 16));
  }
  return value;
}

function matchesIpv6Prefix(value: bigint, base: bigint, prefixLength: number): boolean {
  if (prefixLength === 0) return true;
  const shift = BigInt(128 - prefixLength);
  return (value >> shift) === (base >> shift);
}

const IPV6_BASES = {
  uniqueLocal: ipv6ToBigInt('fc00::') ?? 0n,
  linkLocal: ipv6ToBigInt('fe80::') ?? 0n,
  multicast: ipv6ToBigInt('ff00::') ?? 0n,
  documentation: ipv6ToBigInt('2001:db8::') ?? 0n,
  ipv4Mapped: ipv6ToBigInt('::ffff:0:0') ?? 0n,
};

function isBlockedIpv6(address: string): boolean {
  const value = ipv6ToBigInt(address);
  if (value === null) return true;
  if (value === 0n || value === 1n) return true;
  if (matchesIpv6Prefix(value, IPV6_BASES.uniqueLocal, 7)) return true;
  if (matchesIpv6Prefix(value, IPV6_BASES.linkLocal, 10)) return true;
  if (matchesIpv6Prefix(value, IPV6_BASES.multicast, 8)) return true;
  if (matchesIpv6Prefix(value, IPV6_BASES.documentation, 32)) return true;

  if (matchesIpv6Prefix(value, IPV6_BASES.ipv4Mapped, 96)) {
    const ipv4 = Number(value & 0xffffffffn);
    const mapped = [
      (ipv4 >>> 24) & 255,
      (ipv4 >>> 16) & 255,
      (ipv4 >>> 8) & 255,
      ipv4 & 255,
    ].join('.');
    return isBlockedIpv4(mapped);
  }

  return false;
}

export function isBlockedIp(address: string): boolean {
  const normalized = stripIpv6Brackets(address);
  const family = isIP(normalized);
  if (family === 4) return isBlockedIpv4(normalized);
  if (family === 6) return isBlockedIpv6(normalized);
  return true;
}

function blockedHostname(hostname: string): boolean {
  const normalized = stripIpv6Brackets(hostname).toLowerCase().replace(/\.$/, '');
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    normalized === 'home.arpa' ||
    normalized.endsWith('.home.arpa')
  );
}

export class PublicEgressPolicy implements EgressPolicy {
  constructor(private readonly resolver: HostResolver = defaultResolver) {}

  async assertAllowed(url: URL): Promise<void> {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new OperationError('EGRESS_BLOCKED', 'egress allows only HTTP and HTTPS URLs');
    }
    if (url.username || url.password) {
      throw new OperationError('EGRESS_BLOCKED', 'embedded URL credentials are blocked');
    }

    const hostname = stripIpv6Brackets(url.hostname).toLowerCase().replace(/\.$/, '');
    if (!hostname || blockedHostname(hostname)) {
      throw new OperationError('EGRESS_BLOCKED', `blocked hostname: ${hostname || '<empty>'}`);
    }

    const directFamily = isIP(hostname);
    if (directFamily !== 0) {
      if (isBlockedIp(hostname)) {
        throw new OperationError('EGRESS_BLOCKED', `blocked non-public IP: ${hostname}`);
      }
      return;
    }

    let addresses: string[];
    try {
      addresses = await this.resolver(hostname);
    } catch {
      throw new OperationError('EGRESS_DNS_FAILED', `DNS resolution failed for ${hostname}`);
    }

    if (addresses.length === 0) {
      throw new OperationError('EGRESS_DNS_FAILED', `DNS resolution returned no addresses for ${hostname}`);
    }

    const blocked = addresses.find((address) => isBlockedIp(address));
    if (blocked) {
      throw new OperationError('EGRESS_BLOCKED', `hostname ${hostname} resolved to blocked address ${blocked}`);
    }
  }
}

export class AllowAllEgressPolicy implements EgressPolicy {
  async assertAllowed(_url: URL): Promise<void> {
    return;
  }
}
