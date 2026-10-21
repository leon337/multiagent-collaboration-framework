const port = chrome.runtime.connect({ name: 'popup' });
const status = document.querySelector('#status'), consent = document.querySelector('#consent'), summary = document.querySelector('#summary');
async function send(command) {
  summary.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({ command });
    status.textContent = JSON.stringify(result, null, 2);
    summary.disabled = !consent.checked || !['CONNECTED','VALIDATED'].includes(result?.status);
  } catch { status.textContent = 'DESCONECTADO: host/worker indisponível'; }
}
document.querySelector('#connect').onclick = () => { if (consent.checked) send('connect'); else status.textContent = 'CONSENTIMENTO NECESSÁRIO'; };
summary.onclick = () => { if (consent.checked) send('summary'); };
document.querySelector('#stop').onclick = () => { consent.checked = false; send('stop'); };
consent.onchange = () => { if (!consent.checked) send('stop'); };
port.onDisconnect.addListener(() => { summary.disabled = true; status.textContent = 'DESCONECTADO'; });
