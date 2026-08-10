import { ExternalActionAdapterError } from './external-action.contracts.js';

export function canonicalizeStagingRuntimeUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'MCF staging runtime URL must be a valid HTTPS URL',
      false,
    );
  }
  if (
    url.protocol !== 'https:' ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.port.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'MCF staging runtime URL must be public HTTPS without credentials, port, query or fragment',
      false,
    );
  }
  url.pathname = url.pathname.replace(/\/+$/u, '');
  return url.href.replace(/\/$/u, '');
}
