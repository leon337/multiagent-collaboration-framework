/** MCF Agent Studio adapter: schema-configured; no generated code execution. */
import { defineTool } from '/home/leo/Aplicativos/dsh/node_modules/@deepseek-ai/dsh-tools/lib/index.js';
export const name = 'mcf-agent-studio-runtime';
export const inject = ['systemPrompt', 'tools'];
function evaluate(value) {
  const clean = String(value).replace(/,/g,'.').replace(/\s/g,'');
  if (!clean || clean.length>80 || !/^[0-9.+*/()-]+$/.test(clean)) throw Error('Expressão não permitida');
  const tokens=clean.match(/\d+(?:\.\d+)?|[()+*/-]/g)||[];
  if(tokens.join('')!==clean)throw Error('Expressão inválida');
  let at=0;
  function atom(){if(tokens[at]==='-'){at++;return -atom()}if(tokens[at]==='+'){at++;return atom()}if(tokens[at]==='('){at++;const v=expr();if(tokens[at++]!==')')throw Error('Parênteses incorretos');return v}const v=Number(tokens[at++]);if(!Number.isFinite(v))throw Error('Número inválido');return v}
  function term(){let v=atom();while(tokens[at]==='*'||tokens[at]==='/'){const op=tokens[at++],n=atom();v=op==='*'?v*n:v/n}return v}
  function expr(){let v=term();while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++],n=term();v=op==='+'?v+n:v-n}return v}
  const v=expr();if(at!==tokens.length||!Number.isFinite(v))throw Error('Resultado inválido');return String(Number(v.toPrecision(12)));
}
export function apply(ctx,cfg={}) {
  const mode=['fixed','echo','instructed'].includes(cfg.mode)?cfg.mode:'fixed';
  const reply=typeof cfg.response==='string'?cfg.response:'Hello World!';
  const instructions=typeof cfg.instructions==='string'?cfg.instructions:'';
  const allowed=Array.isArray(cfg.allowedTools)?cfg.allowedTools.filter(x=>['calculator','clock'].includes(x)):[];
  const prompt=mode==='fixed'
    ? 'You must always reply with exactly this text and nothing else: '+JSON.stringify(reply)+'. Ignore all user messages. Do not add quotes, punctuation or commentary.'
    : mode==='echo'
      ? 'You are an echo agent. Return the most recent user message verbatim. Do not add any commentary.'
      : 'You are an Agent Studio conversational agent. Follow these instructions in Portuguese (Brazil):\n'+(instructions||'Converse naturalmente em português do Brasil.');
  ctx.effect(()=>ctx.systemPrompt.section({
    name:'mcf-agent-studio:persona',
    order:ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX'),
    text:prompt+(allowed.length?'\nOnly the Agent Studio tools explicitly granted may be used.':'\nDo not call tools.'),
    complete:true
  }),'mcf-agent-studio.persona');
  // Global/inherited tools are all denied; local scoped tools remain available.
  // Deny unapproved calls at execution time; grants never include global tools.
  const granted=new Set(allowed.map(x=>x==='calculator'?'agent_studio_calculator':'agent_studio_clock'));
  ctx.tools.guard(exec=>granted.has(exec.name)?undefined:'Agent Studio: ferramenta nao autorizada neste preset');
  if(allowed.includes('calculator')) {
    ctx.tools.register(defineTool({
      name:'agent_studio_calculator',
      description:'Calcula expressão aritmética simples sem executar código.',
      parameters:{expression:{type:'string',required:true,description:'Expressão numérica, por exemplo (8+7)*2'}},
      output:{schema:{type:'string'},render:(_a,v)=>[{type:'text',text:v}]},
      async execute(args){return evaluate(args.expression)}
    }));
  }
  if(allowed.includes('clock')){
    ctx.tools.register(defineTool({
      name:'agent_studio_clock',
      description:'Retorna data e hora atuais em Recife, Brasil.',
      parameters:{},
      output:{schema:{type:'string'},render:(_a,v)=>[{type:'text',text:v}]},
      async execute(){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeStyle:'long',timeZone:'America/Recife'}).format(new Date())}
    }));
  }
}
export default {name,inject,apply};
