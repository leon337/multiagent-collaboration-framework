import { defineTool } from '/home/leo/Aplicativos/dsh/node_modules/@deepseek-ai/dsh-tools/lib/index.js';
import { invoke } from './drive-api.mjs';

export const name = 'mcf-google-drive-agent-tools';
export const inject = ['systemPrompt', 'tools'];

const toolNames = [
  'mcf_google_drive_status',
  'mcf_google_drive_search',
  'mcf_google_drive_create_folder',
  'mcf_google_drive_create_text_file',
  'mcf_google_drive_read_text_file',
  'mcf_google_drive_update_text_file',
  'mcf_google_drive_rename_file',
  'mcf_google_drive_delete_file'
];
const output = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }]
};
const result = value => JSON.stringify(value);

export function apply(ctx, cfg = {}) {
  const expectedEmail = typeof cfg.expectedEmail === 'string' ? cfg.expectedEmail.toLowerCase() : '';
  const persona = [
    'Você é o MCF Google Drive Agent, um agente operacional dedicado ao Google Drive.',
    'Antes de qualquer operação de leitura ou escrita, confirme a conta com mcf_google_drive_status.',
    expectedEmail ? 'A única conta autorizada é ' + expectedEmail + '. Se a conta não corresponder ou não estiver conectada, pare e informe o bloqueio.' : 'Se a conta esperada não estiver configurada, não execute operações.',
    'O OAuth usa o escopo drive, permitindo operar sobre arquivos e pastas que a conta autorizada pode acessar. Respeite permissões do Google e nunca ultrapasse o pedido explícito de LEANDRO.',
    'Nunca crie pastas ou arquivos sem pedido explícito de LEANDRO e sem nome/local definidos. Pesquise antes para evitar duplicatas.',
    'Ao criar na raiz, informe parentId como root; para itens dentro de uma pasta, use o ID retornado pela ferramenta de criação da pasta.',
    'Nunca exclua nem sobrescreva sem pedido explícito e confirmação do alvo. Não altere compartilhamento ou permissões sem autorização específica.',
    'Para projetos Git, mantenha GitHub ou um repositório local como fonte de verdade. Não crie um diretório .git ativo dentro da pasta sincronizada do Drive; use o Drive para documentos, exportações e cópias.',
    'Não solicite, imprima, copie ou registre tokens, client secrets ou códigos OAuth. Não use cookies do navegador.',
    'Responda em português do Brasil e informe IDs/links retornados pelo Google somente quando forem úteis.'
  ].join('\n');

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'mcf-google-drive-agent:policy',
    order: ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX'),
    text: persona,
    complete: true
  }), 'mcf-google-drive-agent.policy');

  const allowed = new Set(toolNames);
  ctx.tools.guard(exec => allowed.has(exec.name)
    ? undefined
    : 'MCF Google Drive Agent: ferramenta não autorizada neste preset.');

  ctx.tools.register(defineTool({
    name: 'mcf_google_drive_status',
    description: 'Verifica a conexão OAuth e confirma a identidade da conta Google autorizada.',
    parameters: {},
    output,
    async execute() {
      const response = await invoke('google_drive.status', {}, expectedEmail);
      return result(response.result);
    }
  }));
  ctx.tools.register(defineTool({
    name: 'mcf_google_drive_search',
    description: 'Pesquisa arquivos acessíveis ao aplicativo no Google Drive por nome.',
    parameters: {
      query: { type: 'string', required: true, description: 'Trecho do nome do arquivo ou pasta.' },
    },
    output,
    async execute(args) {
      const response = await invoke('google_drive.search', args, expectedEmail);
      return result(response.result);
    }
  }));
  ctx.tools.register(defineTool({
    name: 'mcf_google_drive_create_folder',
    description: 'Cria uma pasta no Meu Drive ou dentro de uma pasta acessível; não duplica nomes existentes no mesmo local.',
    parameters: {
      name: { type: 'string', required: true, description: 'Nome da nova pasta.' },
      parentId: { type: 'string', required: true, description: 'Use root para a raiz ou o ID de uma pasta retornada pelo conector.' }
    },
    output,
    async execute(args) {
      const response = await invoke('google_drive.create_folder', args, expectedEmail);
      return result(response.result);
    }
  }));
  ctx.tools.register(defineTool({
    name: 'mcf_google_drive_create_text_file',
    description: 'Cria um arquivo de texto UTF-8 sem sobrescrever arquivos existentes.',
    parameters: {
      name: { type: 'string', required: true, description: 'Nome do arquivo, por exemplo README.md.' },
      content: { type: 'string', required: true, description: 'Conteúdo de texto UTF-8, até 200 KB.' },
      parentId: { type: 'string', required: true, description: 'Use root para a raiz ou o ID de uma pasta retornada pelo conector.' }
    },
    output,
    async execute(args) {
      const response = await invoke('google_drive.create_text_file', args, expectedEmail);
      return result(response.result);
    }
  }));
  ctx.tools.register(defineTool({
    name: 'mcf_google_drive_read_text_file',
    description: 'Lê arquivos de texto UTF-8, exporta Google Docs como texto e Google Sheets como CSV; não lê binários.',
    parameters: {
      fileId: { type: 'string', required: true, description: 'ID do arquivo retornado por uma ferramenta do Drive.' }
    },
    output,
    async execute(args) {
      const response = await invoke('google_drive.read_text_file', args, expectedEmail);
      return result(response.result);
    }
  }));

  ctx.tools.register(defineTool({
    name: 'mcf_google_drive_update_text_file',
    description: 'Atualiza o conteúdo de arquivos de texto UTF-8 ou Google Docs existentes no Google Drive.',
    parameters: {
      fileId: { type: 'string', required: true, description: 'ID do arquivo existente.' },
      content: { type: 'string', required: true, description: 'Novo conteúdo UTF-8, até 200 KB.' }
    },
    output,
    async execute(args) {
      const response = await invoke('google_drive.update_text_file', args, expectedEmail);
      return result(response.result);
    }
  }));
  ctx.tools.register(defineTool({
    name: 'mcf_google_drive_rename_file',
    description: 'Renomeia um arquivo existente no Google Drive sem alterar seu conteúdo.',
    parameters: {
      fileId: { type: 'string', required: true, description: 'ID do arquivo existente.' },
      name: { type: 'string', required: true, description: 'Novo nome do arquivo.' }
    },
    output,
    async execute(args) {
      const response = await invoke('google_drive.update_text_file', args, expectedEmail);
      return result(response.result);
    }
  }));
  ctx.tools.register(defineTool({
    name: 'mcf_google_drive_delete_file',
    description: 'Exclui permanentemente um arquivo do Google Drive. Exija confirmação explícita de LEANDRO para o arquivo-alvo antes de executar.',
    parameters: {
      fileId: { type: 'string', required: true, description: 'ID exato do arquivo cuja exclusão foi autorizada.' }
    },
    output,
    async execute(args) {
      const response = await invoke('google_drive.delete_file', args, expectedEmail);
      return result(response.result);
    }
  }));
  ctx.logger.info('MCF Google Drive Agent tools mounted: ' + toolNames.length);
}

export default { name, inject, apply };
