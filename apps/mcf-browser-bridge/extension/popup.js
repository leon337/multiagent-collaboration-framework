const port = chrome.runtime.connect({ name: 'popup' });
const status = document.querySelector('#status'), consent = document.querySelector('#consent'), summary = document.querySelector('#summary');
const agentConsent = document.querySelector('#agent-consent'), agentState = document.querySelector('#agent-state');
port.onMessage.addListener(m => {
  agentConsent.checked = m.agentReadAllowed === true;
  agentState.textContent = `agent read allowed: ${m.agentReadAllowed === true} · ${m.status}`;
  if (m.status === 'SESSION_RESET') { agentConsent.disabled = true; summary.disabled = true; }
  if (m.status === 'REVOKED') { agentConsent.disabled = true; summary.disabled = true; consent.checked = false; }
});
async function send(command) {
  summary.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({ command });
    status.textContent = JSON.stringify(result, null, 2);
    agentConsent.disabled = !['CONNECTED','VALIDATED'].includes(result?.status);
    if (result?.status === 'DENIED') { agentConsent.checked = false; agentState.textContent = 'agent read allowed: false · REVOKED'; }
    summary.disabled = !consent.checked || !['CONNECTED','VALIDATED'].includes(result?.status);
  } catch { status.textContent = 'DESCONECTADO: host/worker indisponível'; }
}
document.querySelector('#connect').onclick = () => { if (consent.checked) send('connect'); else status.textContent = 'CONSENTIMENTO NECESSÁRIO'; };
summary.onclick = () => { if (consent.checked) send('summary'); };
document.querySelector('#stop').onclick = () => { consent.checked = false; send('stop'); };
consent.onchange = () => { if (!consent.checked) send('stop'); };
port.onDisconnect.addListener(() => { summary.disabled = true; status.textContent = 'DESCONECTADO'; });

agentConsent.onchange = () => { if (agentConsent.checked && consent.checked) send('agent-allow'); else send('stop'); };
