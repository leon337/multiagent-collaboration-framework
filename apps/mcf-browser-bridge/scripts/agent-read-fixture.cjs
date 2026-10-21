#!/usr/bin/env node
'use strict';
// Node core only. stdout contains only a validated, untrusted synthetic summary.
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
(async () => {
  let socket;
  try {
    if (process.argv.length > 3) throw Error('ARGS');
    const dir = process.argv[2] || process.env.MCF_BRIDGE_AGENT_SOCKET_DIR;
    const { privateDirectory } = await import('../host/agent-broker.js');
    const { FrameParser, encode } = await import('../host/framing.js');
    const { exact, validSummary } = await import('../extension/agent-contract.js');
    privateDirectory(dir);
    const file = path.join(dir, 'mcf-agent-capability.json');
    const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    let cap;
    try {
      const st = fs.fstatSync(fd);
      if (!st.isFile() || st.uid !== process.getuid() || (st.mode & 0o777) !== 0o600 || st.size > 1024) throw Error('CAPABILITY');
      cap = JSON.parse(fs.readFileSync(fd, 'utf8'));
    } finally { fs.closeSync(fd); }
    if (!exact(cap, ['protocolVersion','token','expiresAt']) || cap.protocolVersion !== 1 || !/^[a-f0-9]{64}$/.test(cap.token) || !Number.isSafeInteger(cap.expiresAt) || cap.expiresAt <= Date.now() || cap.expiresAt > Date.now() + 60000) throw Error('CAPABILITY');
    const sp = path.join(dir, 'mcf-agent.sock'), st = fs.lstatSync(sp);
    if (!st.isSocket() || st.uid !== process.getuid() || (st.mode & 0o777) !== 0o600) throw Error('SOCKET');
    const actionId = randomUUID();
    const result = await new Promise((resolve, reject) => {
      socket = net.createConnection(sp);
      const timer = setTimeout(() => { socket.destroy(); reject(Error('TIMEOUT')); }, 5000);
      let received = false, summary;
      const parser = new FrameParser(r => {
        if (received) throw Error('MULTIPLE_RESULTS'); received = true;
        if (!exact(r, ['protocolVersion','actionId','status','summary']) || r.protocolVersion !== 1 || r.actionId !== actionId || r.status !== 'VALIDATED' || !validSummary(r.summary)) throw Error('DENIED');
        summary = r.summary;
      });
      socket.on('connect', () => socket.write(encode({ protocolVersion: 1, missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-03', actionId, action: 'read-summary', token: cap.token, expiresAt: Math.min(Date.now() + 4500, cap.expiresAt), timeoutMs: 4500 })));
      socket.on('data', chunk => { try { parser.push(chunk); } catch { reject(Error('DENIED')); socket.destroy(); } });
      socket.on('error', reject);
      socket.on('end', () => { try { parser.end(); } catch { reject(Error('TRUNCATED')); } if (!received) reject(Error('DENIED')); else resolve(summary); });
      socket.on('close', () => { clearTimeout(timer); reject(Error('CLOSED')); });
    });
    process.stdout.write(JSON.stringify(result) + '\n');
  } catch { socket?.destroy(); process.stderr.write('AGENT_READ_DENIED (no retry)\n'); process.exitCode = 1; }
})();
