import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const protocolPath = 'docs/protocols/MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md';
const unifiedPath = 'docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md';
const schemaPath = 'schemas/mcf-gui-window-succession-trace-v1.schema.json';
const validFixturePath = 'schemas/fixtures/mcf-gui-window-succession-trace.valid.json';
const invalidFixturePath = 'schemas/fixtures/mcf-gui-window-succession-trace.invalid.json';

const failures = [];
const pass = (message) => console.log(`PASS ${message}`);
const fail = (message) => failures.push(message);

function readRequired(file) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    fail(`missing required artifact: ${file}`);
    return null;
  }
  const value = fs.readFileSync(absolute, 'utf8');
  if (!value.trim()) {
    fail(`empty required artifact: ${file}`);
    return null;
  }
  pass(`artifact exists: ${file}`);
  return value;
}

function requireTokens(label, text, tokens) {
  if (text == null) return;
  for (const token of tokens) {
    if (!text.includes(token)) fail(`${label} missing token: ${token}`);
    else pass(`${label} token: ${token}`);
  }
}

function parseJson(file, text) {
  if (text == null) return null;
  try {
    const value = JSON.parse(text);
    pass(`valid JSON: ${file}`);
    return value;
  } catch (error) {
    fail(`invalid JSON ${file}: ${error.message}`);
    return null;
  }
}

function validateTrace(trace) {
  const errors = [];
  const requiredTop = [
    'trace_version',
    'mission_id',
    'classification',
    'predecessor',
    'successor',
    'handoff',
    'window_control',
    'input_evidence',
    'observability',
  ];
  for (const key of requiredTop) {
    if (!(key in trace)) errors.push(`missing ${key}`);
  }
  if (errors.length) return errors;

  if (trace.trace_version !== 'mcf_gui_window_succession_trace/v1') {
    errors.push('unexpected trace_version');
  }
  if (trace.classification !== 'MAINTAIN_WITH_GAP') {
    errors.push('classification must be MAINTAIN_WITH_GAP');
  }

  const p = trace.predecessor;
  const s = trace.successor;
  const h = trace.handoff;
  const w = trace.window_control;
  const i = trace.input_evidence;
  const o = trace.observability;

  if (!p.session_id || !p.window_surface_id) errors.push('predecessor identity incomplete');
  if (!s.session_id || !s.window_surface_id) errors.push('successor identity incomplete');
  if (p.session_id === s.session_id) errors.push('successor session must be distinct');
  if (p.window_surface_id === s.window_surface_id) errors.push('successor window surface must be distinct');
  if (p.surface_preserved_through_equivalence_and_handoff !== true) {
    errors.push('predecessor surface must be preserved through equivalence and handoff');
  }
  if (h.successor_equivalence !== 'PASS') errors.push('successor equivalence must PASS');
  if (h.explicit_handoff !== true) errors.push('handoff must be explicit');
  if (h.predecessor_close_governed_separately !== true) errors.push('predecessor close must be separately governed');
  if (w.open_new_window !== true) errors.push('OPEN_NEW_WINDOW must be explicit');
  if (w.open_new_chat !== true) errors.push('OPEN_NEW_CHAT must be explicit');
  if (w.visual_assertion_two_windows !== 'PASS') errors.push('two-window visual assertion must PASS');
  if (w.monitor_aware_placement !== 'PASS') errors.push('monitor-aware placement must PASS');
  if (!w.predecessor_monitor_id || !w.successor_monitor_id) errors.push('monitor identity required');
  if (!['X11_SYNTHETIC_EVENT', 'DEVICE_LEVEL_INPUT_EVENT', 'PHYSICAL_INPUT_EVENT'].includes(i.mechanism)) {
    errors.push('input mechanism must be truthful and enumerated');
  }
  if (i.claimed_equivalent_to_physical_input === true && i.mechanism === 'X11_SYNTHETIC_EVENT') {
    errors.push('X11 synthetic event cannot be claimed equivalent to physical input');
  }
  if (o.shortcut_execution_logged !== true) errors.push('shortcut execution must be logged');
  if (o.simultaneous_copresence_regression !== 'PASS') errors.push('simultaneous copresence regression must PASS');
  return errors;
}

const protocolText = readRequired(protocolPath);
const unifiedText = readRequired(unifiedPath);
const schemaText = readRequired(schemaPath);
const validText = readRequired(validFixturePath);
const invalidText = readRequired(invalidFixturePath);

requireTokens('protocol', protocolText, [
  'MAINTAIN_WITH_GAP',
  'SUCCESSOR_SESSION_CREATED != SUCCESSOR_WINDOW_CREATED',
  'OPEN_NEW_WINDOW',
  'OPEN_NEW_CHAT',
  'PREDECESSOR_SURFACE_PRESERVED',
  'SUCCESSION_EQUIVALENCE',
  'EXPLICIT_HANDOFF',
  'PREDECESSOR_CLOSE',
  'VISUAL_ASSERTION',
  'X11_SYNTHETIC_EVENT != DEVICE_LEVEL_INPUT_EVENT',
  'MONITOR_AWARE',
  'HUMANO NO CONTROLE',
]);

requireTokens('unified protocol', unifiedText, [protocolPath]);

const schema = parseJson(schemaPath, schemaText);
const validFixture = parseJson(validFixturePath, validText);
const invalidFixture = parseJson(invalidFixturePath, invalidText);

if (schema) {
  if (schema.$id !== 'https://mcf.local/schemas/mcf-gui-window-succession-trace-v1.schema.json') {
    fail('schema $id mismatch');
  } else pass('schema $id');
  if (schema.title !== 'MCF GUI Window Succession Trace v1') fail('schema title mismatch');
  else pass('schema title');
  const required = new Set(schema.required ?? []);
  for (const key of ['trace_version', 'mission_id', 'classification', 'predecessor', 'successor', 'handoff', 'window_control', 'input_evidence', 'observability']) {
    if (!required.has(key)) fail(`schema required missing: ${key}`);
    else pass(`schema requires ${key}`);
  }
}

if (validFixture) {
  const errors = validateTrace(validFixture);
  if (errors.length) fail(`valid fixture rejected: ${errors.join('; ')}`);
  else pass('valid fixture accepted');
}

if (invalidFixture) {
  const errors = validateTrace(invalidFixture);
  if (!errors.length) fail('invalid fixture unexpectedly accepted');
  else {
    pass(`invalid fixture rejected (${errors.length} findings)`);
    requireTokens('invalid fixture findings', errors.join('\n'), [
      'successor window surface must be distinct',
      'predecessor surface must be preserved through equivalence and handoff',
      'X11 synthetic event cannot be claimed equivalent to physical input',
    ]);
  }
}

if (failures.length) {
  console.error('\nMCF GUI/window qualification: FAIL');
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log('\nMCF GUI/window qualification: PASS');
