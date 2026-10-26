export function cloudSender(cfg, fetchImpl = fetch) {
  const version = String(cfg.version || '');
  if (!/^v\d{2,3}\.\d$/.test(version)) throw Error('wa_graph_version_required');
  if (!/^\d{8,30}$/.test(cfg.phoneNumberId || '')) throw Error('wa_phone_number_id_required');
  if (!cfg.accessToken) throw Error('wa_access_token_required');
  return async (to, body) => {
    if (!/^\d{8,15}$/.test(to) || !body || body.length > 4096) throw Error('wa_outbound_invalid');
    const url = 'https://graph.facebook.com/' + version + '/' + cfg.phoneNumberId + '/messages';
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + cfg.accessToken, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body } }),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw Error('wa_delivery_http_' + response.status);
    const payload = await response.json();
    if (!payload.messages?.[0]?.id) throw Error('wa_delivery_unconfirmed');
    return payload.messages[0].id;
  };
}
