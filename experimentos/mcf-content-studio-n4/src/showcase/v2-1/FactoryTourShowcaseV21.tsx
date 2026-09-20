import {AbsoluteFill,Img,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import type {ShowcaseSync} from '../synced';
import syncData from '../factory-tour/sync.json';
import {Chip,Panel,reveal,v21,V21Canvas} from './shared';

const factoryTourSync=syncData as ShowcaseSync;
const source=(name:string)=>staticFile('factory-tour-v21/'+name);
const clipStart=(seconds:number,fps:number)=>Math.round(seconds*fps);
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

const Clip=({file,startSec=0,fit='cover'}:{file:string;startSec?:number;fit?:'cover'|'contain'})=>{
  const {fps}=useVideoConfig();
  const f=useCurrentFrame();
  const zoom=interpolate(f,[0,180],[1.02,1.08],clamp);
  return <OffthreadVideo src={source(file)} startFrom={clipStart(startSec,fps)} muted style={{width:'100%',height:'100%',objectFit:fit,transform:\`scale(\${zoom})\`,background:'#eef4ff'}}/>;
};

const Overlay=({kicker,title,subtitle,accent=v21.blue}:{kicker:string;title:string;subtitle?:string;accent?:string})=>{
  const f=useCurrentFrame(); const p=reveal(f,0,20);
  return <div style={{position:'absolute',left:46,right:46,top:56,zIndex:30,opacity:p,transform:\`translateY(\${(1-p)*16}px)\`}}>
    <div style={{display:'inline-flex',alignItems:'center',gap:12,padding:'9px 14px',borderRadius:999,background:'rgba(255,255,255,.88)',border:'1px solid rgba(190,210,246,.9)',backdropFilter:'blur(12px)',boxShadow:'0 12px 32px rgba(30,60,130,.08)'}}>
      <span style={{width:9,height:9,borderRadius:99,background:accent}}/><span style={{fontSize:15,letterSpacing:2.3,fontWeight:950,color:accent}}>{kicker}</span>
    </div>
    <div style={{marginTop:16,maxWidth:820,padding:'18px 22px',borderRadius:26,background:'rgba(255,255,255,.88)',border:'1px solid rgba(198,216,250,.9)',backdropFilter:'blur(14px)',boxShadow:'0 18px 50px rgba(34,72,150,.12)'}}>
      <div style={{fontSize:52,lineHeight:.98,fontWeight:950,letterSpacing:-1.8,color:v21.ink}}>{title}</div>
      {subtitle?<div style={{fontSize:20,lineHeight:1.35,color:v21.muted,marginTop:10,fontWeight:650}}>{subtitle}</div>:null}
    </div>
  </div>;
};

const FullClip=({file,startSec,label}:{file:string;startSec:number;label:string})=><V21Canvas>
  <div style={{position:'absolute',left:26,right:26,top:26,bottom:120,borderRadius:34,overflow:'hidden',border:'1px solid #c4d7ff',boxShadow:'0 30px 90px rgba(35,75,160,.18)',background:'#edf3ff'}}>
    <Clip file={file} startSec={startSec}/>
    <div style={{position:'absolute',left:18,bottom:18}}><Chip>{label}</Chip></div>
  </div>
</V21Canvas>;

const Mosaic=({files}:{files:Array<{file:string;startSec:number;label:string}>})=>{
  const f=useCurrentFrame(); const p=reveal(f,0,34);
  return <V21Canvas>
    <div style={{position:'absolute',left:26,right:26,top:26,bottom:120,display:'grid',gridTemplateColumns:'1.15fr .85fr',gridTemplateRows:'1fr 1fr',gap:12}}>
      {files.slice(0,4).map((item,i)=><div key={item.file} style={{overflow:'hidden',borderRadius:28,border:'1px solid #c5d7ff',boxShadow:'0 22px 58px rgba(35,75,160,.14)',background:'white',opacity:interpolate(p,[i*.1,Math.min(1,i*.1+.5)],[0,1],clamp),transform:\`translateY(\${(1-p)*10}px)\`}}>
        <Clip file={item.file} startSec={item.startSec}/>
        <div style={{position:'absolute',margin:14}}><Chip tone={i%2?'violet':'blue'}>{item.label}</Chip></div>
      </div>)}
    </div>
  </V21Canvas>;
};

const Split=({left,right}:{left:{file:string;startSec:number;label:string};right:{file:string;startSec:number;label:string}})=><V21Canvas>
  <div style={{position:'absolute',left:26,right:26,top:26,bottom:120,display:'grid',gridTemplateRows:'1.05fr .95fr',gap:12}}>
    {[left,right].map((item,i)=><div key={item.file} style={{overflow:'hidden',borderRadius:30,border:'1px solid #c5d7ff',boxShadow:'0 22px 58px rgba(35,75,160,.14)',position:'relative',background:'white'}}>
      <Clip file={item.file} startSec={item.startSec}/>
      <div style={{position:'absolute',left:16,bottom:16}}><Chip tone={i?'violet':'blue'}>{item.label}</Chip></div>
    </div>)}
  </div>
</V21Canvas>;

const Qa=()=> <V21Canvas>
  <div style={{position:'absolute',left:26,right:26,top:26,bottom:120,display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'1fr 1fr',gap:12}}>
    {[
      ['qa/01-engine-universal.png','ENGINE'],
      ['qa/04-ui-code-universal.png','UI + CODE'],
      ['qa/06-assets-audio-universal.png','AUDIO'],
      ['qa/07-integrations-universal.png','INTEGRATIONS']
    ].map(([file,label],i)=><div key={file} style={{position:'relative',overflow:'hidden',borderRadius:28,border:'1px solid #c8d8ff',background:'#fff',boxShadow:'0 18px 48px rgba(35,75,160,.11)'}}>
      <Img src={source(file)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      <div style={{position:'absolute',left:14,bottom:14}}><Chip tone={i%2?'violet':'blue'}>{label}</Chip></div>
    </div>)}
  </div>
</V21Canvas>;

const ClosingWall=()=>{
  const files=[
    ['01-engine.mp4',10.2,'ENGINE'],['02-motion.mp4',3.9,'MOTION'],['03-editor.mp4',6.1,'EDITOR'],
    ['04-ui-code.mp4',6.2,'UI'],['05-pedagogy.mp4',14.7,'PEDAGOGY'],['06-assets-audio.mp4',11.5,'AUDIO'],['07-integrations.mp4',6.5,'INTEGRATIONS']
  ] as const;
  return <V21Canvas>
    <div style={{position:'absolute',left:22,right:22,top:22,bottom:120,display:'grid',gridTemplateColumns:'repeat(2,1fr)',gridTemplateRows:'repeat(4,1fr)',gap:10}}>
      {files.map((it,i)=><div key={it[0]} style={{position:'relative',overflow:'hidden',borderRadius:24,border:'1px solid #c4d6ff',boxShadow:'0 16px 40px rgba(35,75,160,.10)',gridColumn:i===6?'1 / span 2':undefined}}>
        <Clip file={it[0]} startSec={it[1]}/>
        <div style={{position:'absolute',left:12,bottom:12}}><Chip tone={i%3===0?'blue':i%3===1?'violet':'green'}>{it[2]}</Chip></div>
      </div>)}
    </div>
  </V21Canvas>;
};

const Scene=({id,children}:{id:keyof typeof factoryTourSync.scenes;children:React.ReactNode})=>{
  const s=factoryTourSync.scenes[id]!;
  return <Sequence from={s.from} durationInFrames={s.durationFrames}>{children}</Sequence>;
};

export const FactoryTourShowcaseV21=()=> <AbsoluteFill style={{background:v21.bg}}>
  <Scene id="intro"><Mosaic files={[
    {file:'01-engine.mp4',startSec:10.2,label:'ENGINE'},
    {file:'02-motion.mp4',startSec:3.9,label:'MOTION'},
    {file:'03-editor.mp4',startSec:6.1,label:'EDITOR'},
    {file:'04-ui-code.mp4',startSec:6.2,label:'UI + CODE'},
  ]}/><Overlay kicker="N4 FACTORY TOUR · V2.1" title="A FÁBRICA EM OPERAÇÃO" subtitle="Sete showcases reais, recombinados como uma única prova."/></Scene>

  <Scene id="evidence"><FullClip file="01-engine.mp4" startSec={10.2} label="source → spec → registry"/><Overlay kicker="01 · EVIDÊNCIA" title="COMEÇA NA FONTE REAL" subtitle="Código, estado e proveniência aparecem antes da narrativa."/></Scene>

  <Scene id="components"><FullClip file="01-engine.mp4" startSec={4.8} label="TechnicalLessonSpec"/><Overlay kicker="02 · SPEC + COMPONENTS" title="INTENÇÃO VIRA ESTRUTURA" subtitle="Template, registry e componentes transformam o roteiro em sistema."/></Scene>

  <Scene id="motion"><FullClip file="02-motion.mp4" startSec={3.9} label="focusIntent → motion"/><Overlay kicker="03 · MOTION" title="MOVIMENTO COM FUNÇÃO" subtitle="Foco, relação, typing, métricas e progresso deixam estados legíveis."/></Scene>

  <Scene id="editor"><FullClip file="03-editor.mp4" startSec={3.1} label="canvas + inspector + timeline"/><Overlay kicker="04 · EDITOR" title="LAYOUT TAMBÉM É DADO" subtitle="Mover, transformar, alinhar e persistir no mesmo viewport."/></Scene>

  <Scene id="uiPedagogy"><Split left={{file:'04-ui-code.mp4',startSec:6.2,label:'UI + CODE'}} right={{file:'05-pedagogy.mp4',startSec:14.7,label:'PEDAGOGY'}}/><Overlay kicker="05 · UI + PEDAGOGIA" title="SIMULAR E ENSINAR" subtitle="Interface, código, recall, quiz e personagens mostram ação e aprendizagem."/></Scene>

  <Scene id="assetsAudio"><FullClip file="06-assets-audio.mp4" startSec={11.5} label="asset → mix → QA"/><Overlay kicker="06 · ASSETS + ÁUDIO" title="MÍDIA ENTRA NO CONTRATO" subtitle="Busca, materialização, ducking e loudness tornam o áudio verificável."/></Scene>

  <Scene id="integrations"><FullClip file="07-integrations.mp4" startSec={6.5} label="origin → limit → adapt"/><Overlay kicker="07 · INTEGRAÇÕES" title="ORIGEM E LIMITES EXPLÍCITOS" subtitle="Adobe, Instavar, importer e Explain entram com proveniência."/></Scene>

  <Scene id="qa"><Qa/><Overlay kicker="08 · QA" title="VALIDAR ANTES DE PROMOVER" subtitle="Safe areas, typecheck, testes, áudio e sync entram no mesmo gate."/></Scene>

  <Scene id="close"><ClosingWall/><Overlay kicker="MCF CONTENT STUDIO N4" title="EVIDÊNCIA → VÍDEO ASSISTÍVEL" subtitle="Rastreável, versionado e pronto para revisão humana."/></Scene>

  <CaptionOverlay cues={factoryTourSync.cues}/>
</AbsoluteFill>;

export {factoryTourSync};
