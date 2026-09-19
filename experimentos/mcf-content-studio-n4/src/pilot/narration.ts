export type CaptionCue={from:number;to:number;text:string};

export const runtimeAgenticoNarration={
  audioSrc:null as string|null,
  cues:[
    {from:0,to:90,text:'Vamos separar quem decide, organiza, persiste, executa, limita e governa.'},
    {from:90,to:240,text:'O modelo recebe contexto e produz uma decisão ou saída estruturada.'},
    {from:240,to:390,text:'Inteligência não concede automaticamente acesso a arquivos, rede ou credenciais.'},
    {from:390,to:540,text:'O agente organiza modelo, instruções, tools e política de trabalho.'},
    {from:540,to:720,text:'A sessão mantém continuidade entre turnos e eventos.'},
    {from:720,to:930,text:'Estado sustenta continuidade. Eventos dão evidência. Artefatos viram entrega.'},
    {from:930,to:1110,text:'O modelo pede. O runtime autorizado executa o comando.'},
    {from:1110,to:1260,text:'Capacidade não é permissão. O sandbox limita o alcance.'},
    {from:1260,to:1410,text:'A aplicação governa sessões, policy, aprovação e observabilidade.'},
    {from:1410,to:1590,text:'Quem executa o comando de verdade? Pense antes de revelar.'},
    {from:1590,to:1830,text:'Reconstruímos a arquitetura da entrada humana até o sandbox.'},
    {from:1830,to:2010,text:'Modelo decide. Agente organiza. Sessão persiste. Ambiente executa. Sandbox limita. Aplicação governa.'}
  ] satisfies CaptionCue[],
} as const;
