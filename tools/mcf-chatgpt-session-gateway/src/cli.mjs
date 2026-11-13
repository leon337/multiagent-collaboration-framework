#!/usr/bin/env node
import { ChatGPTSessionGateway, GatewayError } from './gateway.mjs';

const args = process.argv.slice(2);
const command = args.shift() || 'discover';
function flag(name, fallback = undefined) {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
}
const instanceId = flag('instance', 'notebook');
const gateway = new ChatGPTSessionGateway({ instanceId });
async function main() {
  switch (command) {
    case 'discover': {
      const d = await gateway.discover();
      return {
        schema: d.schema, instance: d.instance,
        paneAgents: (d.current.paneAgents ?? []).map(a => ({
          agentId: a.agentId, pane: a.pane, state: a.state,
          handshakeVerified: a.handshakeVerified === true,
        })),
        sessionCount: (d.current.agentSessions ?? []).length,
        warningCount: (d.warnings ?? []).length,
      };
    }
    case 'sessions': return gateway.sessions();
    case 'open':
      return gateway.openAgentSession({
        agent: flag('agent'), mission: flag('mission', ''), objective: flag('objective', ''),
      });
    case 'dispatch':
      return gateway.dispatchPaneMission({
        agentId: flag('agent'), missionId: flag('mission-id'), objective: flag('objective'),
      });
    case 'result':
      return gateway.missionResult(flag('envelope-id'));
    case 'wait':
      return gateway.waitForResult(flag('envelope-id'), {
        timeoutMs: Number(flag('timeout-ms', 60000)),
      });
    default: throw new GatewayError('UNKNOWN_COMMAND');
  }
}
try {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
  if (result?.state === 'UNVERIFIED' || result?.state === 'TIMEOUT_UNVERIFIED') {
    process.exitCode = 2;
  }
} catch (error) {
  // Do not print fetch errors, private paths, descriptor contents, tokens or prompts.
  console.error(JSON.stringify({
    ok: false, code: error instanceof GatewayError ? error.code : 'UNEXPECTED_GATEWAY_ERROR',
    outcomeUnknown: error instanceof GatewayError ? error.uncertain : false,
  }));
  process.exitCode = 1;
}
