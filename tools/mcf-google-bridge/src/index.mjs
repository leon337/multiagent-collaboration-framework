import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { invoke, OPERATIONS, BridgeError } from './bridge.mjs';

const registry=[
  ['google.status','Capacidades e prontidao sem revelar credenciais',{}],
  ['google.gemini.models','Lista modelos Gemini realmente retornados pela conta atual',{}],
  ['google.gemini.generate','Gera texto (desabilitado por padrao, requer opt-in)',{
    model:z.string().min(2).max(80),prompt:z.string().min(1).max(3000)
  }],
  ['google.drive.search','Pesquisa arquivos no Google Drive com escopo de metadata',{
    query:z.string().min(1).max(200),limit:z.number().int().min(1).max(25).optional()
  }],
  ['google.gmail.search','Pesquisa IDs de mensagens no Gmail em somente-leitura',{
    query:z.string().min(1).max(200),limit:z.number().int().min(1).max(25).optional()
  }],
  ['google.calendar.events','Lista os proximos eventos do Calendar em somente-leitura',{
    limit:z.number().int().min(1).max(25).optional()
  }],
  ['google.cloud.projects','Consulta os projetos GCP visiveis via ADC',{}]
];
if(registry.length!==OPERATIONS.length) throw Error('INCOMPLETE_REGISTRY');

export function createMcpServer() {
  const server=new McpServer({name:'mcf-google-bridge',version:'0.1.0'});
  for(const [name,description,shape] of registry) {
    server.registerTool(name,{
      description, inputSchema:z.object(shape), annotations:{readOnlyHint:name!=='google.gemini.generate'}
    }, async(args)=>{
      try {
        const result=await invoke(name,args);
        return {content:[{type:'text',text:JSON.stringify(result)}]};
      } catch(e) {
        return {isError:true,content:[{type:'text',text:JSON.stringify({
          code:e instanceof BridgeError?e.code:'INTERNAL_ERROR',
          status:e instanceof BridgeError?e.status:500
        })}]};
      }
    });
  }
  return server;
}
if(import.meta.url==='file://'+process.argv[1]) {
  void serveStdio(createMcpServer);
  console.error('MCF Google Bridge MCP stdio ativo');
}
