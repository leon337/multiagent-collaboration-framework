import {AbsoluteFill,Img,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {LightTechBackdrop} from '../../components/LightTechBackdrop';
import type {ShowcaseSync} from '../synced';
import syncData from './sync.json';

const factoryTourSync=syncData as ShowcaseSync;
const source=(name:string)=>staticFile('factory-tour/'+name);
const clipStart=(seconds:number,fps:number)=>Math.round(seconds*fps);

const Clip=({file,startSec=0,fit='cover'}:{file:string;startSec?:number;fit?:'cover'|'contain'})=>{
  const {fps}=useVideoConfig();
  return <OffthreadVideo src={source(file)} startFrom={clipStart(startSec,fps)} muted style={{width:'100%',height:'100%',objectFit:fit,background:'#eef4ff'}}/>;
};

const Label=({kicker,title,subtitle}:{kicker:string;title:string;subtitle?:string})=><div style={{
  position:'absolute',left:64,right:64,top:96,zIndex:30,
  fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif'
}}>
  <div style={{display:'flex',alignItems:'center',gap:18}}>
    <div style={{fontSize:20,letterSpacing:5,color:'#2d5bff',fontWeight:950}}>{kicker}</div>
    <div style={{width:90,height:2,background:'linear-gradient(90deg,#2d5bff,transparent)'}}/>
  </div>
  <div style={{fontSize:62,lineHeight:.98,fontWeight:950,letterSpacing:-2.5,marginTop:14,color:'#07142f',maxWidth:880}}>{title}</div>
  {subtitle?<div style={{fontSize:24,lineHeight:1.35,color:'#5f7399',marginTop:14,maxWidth:780,fontWeight:650}}>{subtitle}</div>:null}
</div>;

const Scene=({id,children}:{id:keyof typeof factoryTourSync.scenes;children:React.ReactNode})=>{
  const scene=factoryTourSync.scenes[id]!;
  return <Sequence from={scene.from} durationInFrames={scene.durationFrames}>{children}</Sequence>;
};

const Montage=({files}:{files:Array<{file:string;startSec:number}>})=>{
  const frame=useCurrentFrame();
  const scale=interpolate(frame,[0,80],[1.005,1.025],{extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background:'#f7faff',padding:26,overflow:'hidden'}}>
    <LightTechBackdrop/>
    <div style={{position:'relative',zIndex:2,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,width:'100%',height:'100%',transform:`scale(${scale})`,paddingTop:410,paddingBottom:190}}>
      {files.slice(0,4).map((item)=><div key={item.file} style={{overflow:'hidden',borderRadius:30,border:'1px solid #c9dbff',boxShadow:'0 24px 55px rgba(49,91,182,.17)',background:'white'}}><Clip {...item}/></div>)}
    </div>
  </AbsoluteFill>;
};

const Split=({left,right}:{left:{file:string;startSec:number};right:{file:string;startSec:number}})=><AbsoluteFill style={{background:'#f7faff',padding:26,overflow:'hidden'}}>
  <LightTechBackdrop/>
  <div style={{position:'relative',zIndex:2,display:'grid',gridTemplateRows:'1fr 1fr',gap:14,width:'100%',height:'100%',paddingTop:410,paddingBottom:190}}>
    <div style={{overflow:'hidden',borderRadius:30,border:'1px solid #c9dbff',boxShadow:'0 24px 55px rgba(49,91,182,.15)',background:'white'}}><Clip {...left}/></div>
    <div style={{overflow:'hidden',borderRadius:30,border:'1px solid #c9dbff',boxShadow:'0 24px 55px rgba(49,91,182,.15)',background:'white'}}><Clip {...right}/></div>
  </div>
</AbsoluteFill>;

const Single=({file,startSec}:{file:string;startSec:number})=><AbsoluteFill style={{background:'#f7faff',padding:26,overflow:'hidden'}}>
  <LightTechBackdrop/>
  <div style={{position:'relative',zIndex:2,width:'100%',height:'100%',paddingTop:410,paddingBottom:190}}>
    <div style={{width:'100%',height:'100%',overflow:'hidden',borderRadius:34,border:'1px solid #c9dbff',boxShadow:'0 28px 65px rgba(49,91,182,.18)',background:'white'}}><Clip file={file} startSec={startSec}/></div>
  </div>
</AbsoluteFill>;

const QaScene=()=> <AbsoluteFill style={{background:'#f7faff',padding:26,overflow:'hidden'}}>
  <LightTechBackdrop/>
  <div style={{position:'relative',zIndex:2,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,paddingTop:410,paddingBottom:190,width:'100%',height:'100%'}}>
    {['qa/01-engine-universal.png','qa/04-ui-code-universal.png','qa/06-assets-audio-universal.png','qa/07-integrations-universal.png'].map((file)=><div key={file} style={{overflow:'hidden',borderRadius:28,border:'1px solid #c9dbff',background:'white',boxShadow:'0 22px 52px rgba(49,91,182,.14)'}}>
      <Img src={source(file)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
    </div>)}
  </div>
</AbsoluteFill>;

export const FactoryTourShowcase=()=> <AbsoluteFill style={{background:'#f7faff'}}>
  <Scene id="intro"><Montage files={[
    {file:'01-engine.mp4',startSec:10.2},{file:'02-motion.mp4',startSec:3.9},{file:'03-editor.mp4',startSec:6.1},{file:'04-ui-code.mp4',startSec:6.2},
  ]}/><Label kicker="N4 FACTORY TOUR" title="A FÁBRICA EM OPERAÇÃO" subtitle="Sete showcases reais. Um único pipeline."/></Scene>
  <Scene id="evidence"><Single file="01-engine.mp4" startSec={10.2}/><Label kicker="01 · EVIDÊNCIA" title="COMEÇA NA FONTE REAL" subtitle="Código, registros, políticas e estado verificável."/></Scene>
  <Scene id="components"><Single file="01-engine.mp4" startSec={4.8}/><Label kicker="02 · SPEC + COMPONENTS" title="INTENÇÃO VIRA ESTRUTURA" subtitle="Templates, componentes reutilizáveis e registry."/></Scene>
  <Scene id="motion"><Single file="02-motion.mp4" startSec={3.9}/><Label kicker="03 · MOTION" title="MOVIMENTO COM FUNÇÃO" subtitle="Foco, relação, typing, métricas e progresso."/></Scene>
  <Scene id="editor"><Single file="03-editor.mp4" startSec={3.1}/><Label kicker="04 · EDITOR" title="LAYOUT TAMBÉM É DADO" subtitle="Mover, transformar, alinhar, persistir e editar timeline."/></Scene>
  <Scene id="uiPedagogy"><Split left={{file:'04-ui-code.mp4',startSec:6.2}} right={{file:'05-pedagogy.mp4',startSec:14.7}}/><Label kicker="05 · UI + PEDAGOGIA" title="SIMULAR E ENSINAR" subtitle="Interfaces, código, recall, quiz e personagens."/></Scene>
  <Scene id="assetsAudio"><Single file="06-assets-audio.mp4" startSec={11.5}/><Label kicker="06 · ASSETS + ÁUDIO" title="MÍDIA ENTRA NO CONTRATO" subtitle="Library, mix, ducking e loudness QA."/></Scene>
  <Scene id="integrations"><Single file="07-integrations.mp4" startSec={6.5}/><Label kicker="07 · INTEGRAÇÕES" title="ORIGEM E LIMITES EXPLÍCITOS" subtitle="Adobe, Instavar e imports governados."/></Scene>
  <Scene id="qa"><QaScene/><Label kicker="08 · QA" title="VALIDAR ANTES DE PROMOVER" subtitle="Typecheck, testes, safe areas e A/V sync."/></Scene>
  <Scene id="close"><Montage files={[
    {file:'05-pedagogy.mp4',startSec:29.2},{file:'06-assets-audio.mp4',startSec:24.2},{file:'07-integrations.mp4',startSec:34.6},{file:'03-editor.mp4',startSec:21.4},
  ]}/><Label kicker="MCF CONTENT STUDIO N4" title="EVIDÊNCIA → VÍDEO ASSISTÍVEL" subtitle="Rastreável. Versionado. Pronto para revisão."/></Scene>
  <CaptionOverlay cues={factoryTourSync.cues}/>
</AbsoluteFill>;

export {factoryTourSync};