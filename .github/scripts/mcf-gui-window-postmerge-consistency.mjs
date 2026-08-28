import fs from 'node:fs';

const protocolPath = 'docs/protocols/MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md';
const unifiedPath = 'docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md';

const protocol = fs.readFileSync(protocolPath, 'utf8');
const unified = fs.readFileSync(unifiedPath, 'utf8');
const failures = [];

function requireTokens(label, text, tokens) {
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

function forbidTokens(label, text, tokens) {
  for (const token of tokens) {
    if (text.includes(token)) failures.push(`${label} stale token still present: ${token}`);
  }
}

requireTokens('protocol', protocol, [
  '**Classificação:** REGRA NORMATIVA',
  '**Estado:** MERGED — AWAITING_RELEASE_DECISION',
  '**Aplicação:** missões de sucessão cross-chat que usem GUI/superfície de janela autorizada',
  'PROTOCOL_RULE_OFFICIAL = YES_ON_MAIN_UNRELEASED',
  'MAIN_MUTATION = MERGED_VIA_PR_179',
  'MERGE = COMPLETED_UNDER_HUMAN_GATE',
  'TAG = NOT_AUTHORIZED',
  'RELEASE = NOT_AUTHORIZED',
  'VERSION_NUMBER = NOT_DECIDED',
]);
forbidTokens('protocol', protocol, [
  'REGRA NORMATIVA CANDIDATA',
  'HUMAN_AUTHORIZED_FOR_IMPLEMENTATION — NOT_RELEASED',
  '**Aplicação candidata:**',
  '## 10. Sequência candidata de execução',
  '## 12. Regressões obrigatórias candidatas',
  '## 13. Limites de governança desta candidata',
  'PROTOCOL_RULE_OFFICIAL = NO_UNTIL_MERGED_UNDER_FUTURE_GATE',
  'MAIN_MUTATION = NONE',
  'MERGE = NOT_AUTHORIZED_BY_FORMALIZATION_GATE',
]);

requireTokens('unified protocol', unified, [
  '## 17. Extensão — sucessão cross-chat com GUI/window control',
  'A extensão está integrada em `main`',
  'tag, release e número de versão permanecem sujeitos a gates separados',
]);
forbidTokens('unified protocol', unified, [
  '## 17. Extensão candidata — sucessão cross-chat com GUI/window control',
  'Na branch candidata, essa extensão formaliza',
  'A referência nesta branch não autoriza `main`, merge, tag, release ou número de versão.',
]);

if (failures.length) {
  console.error('MCF GUI/window post-merge consistency: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('MCF GUI/window post-merge consistency: PASS');
