import {AbsoluteFill,Img,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {SafeFrame} from '../../components/shared';
import type {ShowcaseSync} from '../synced';
import syncData from './sync.json';

const factoryTourSync=syncData as ShowcaseSync;

const source=(name:string)=>staticFile('factory-tour/'+name);
const clipStart=(seconds:number,fps:number)=>Math.round(seconds*fps);

const Clip=({file,startSec=0,fit='cover'}:{file:string;startSec?:number;fit?:'cover'|'contain'})=>{
  const {fps}=useVideoConfig();
  return <OffthreadVideo
    src={source(file)}
    startFrom={clipStart(startSec,fps)}
    muted
    style={{width:'100%',height:'100%',objectFit:fit,background:'#02040a'}}
  />;
};

const Label=({kicker,title,subtitle}:{kicker:string;title:string;subtitle?:string})=><div style={{
  position:'absolute',left:64,right:64,top:110,zIndex:30,
  fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif',
  textShadow:'0 4px 28px rgba(0,0,0,.75)'
}}>
  <div style={{fontSize:22,letterSpacing:5,color:'#9a92ff',fontWeight:900}}>{kicker}</div>
  <div style={{fontSize:64,lineHeight:1.02,fontWeight:950,letterSpacing:-2.5,marginTop:14,color:'#fff'}}>{title}</div>
  {subtitle?<div style={{fontSize:25,lineHeight:1.35,color:'#cbd2df',marginTop:16,maxWidth:850,fontWeight:650}}>{subtitle}</div>:null}
</div>;

const Scene=({id,children}:{id:keyof typeof factoryTourSync.scenes;children:React.ReactNode})=>{
  const scene=factoryTourSync.scenes[id]!;
  return <Sequence from={scene.from} durationInFrames={scene.durationFrames}>{children}</Sequence>;
};

const Montage=({files}:{files:Array<{file:string;startSec:number}>})=>{
  const frame=useCurrentFrame();
  const scale=interpolate(frame,[0,80],[1.015,1.04],{extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background:'#05070c',padding:18}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,width:'100%',height:'100%',transform:'scale('+scale+')'}}>
      {files.slice(0,4).map((item)=><div key={item.file} style={{overflow:'hidden',borderRadius:24,border:'1px solid #30364a'}}><Clip {...item}/></div>)}
    </div>
    <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(2,3,8,.25),rgba(2,3,8,.05) 45%,rgba(2,3,8,.72))'}}/>
  </AbsoluteFill>;
};

const Split=({left,right}:{left:{file:string;startSec:number};right:{file:string;startSec:number}})=><AbsoluteFill style={{background:'#05070c',padding:18}}>
  <div style={{display:'grid',gridTemplateRows:'1fr 1fr',gap:12,width:'100%',height:'100%'}}>
    <div style={{overflow:'hidden',borderRadius:24,border:'1px solid #30364a'}}><Clip {...left}/></div>
    <div style={{overflow:'hidden',borderRadius:24,border:'1px solid #30364a'}}><Clip {...right}/></div>
  </div>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(2,3,8,.35),rgba(2,3,8,.05) 50%,rgba(2,3,8,.4))'}}/>
</AbsoluteFill>;

const QaScene=()=> <AbsoluteFill style={{background:'#05070c'}}>
  <SafeFrame style={{justifyContent:'center'}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      {[
        'qa/01-engine-universal.png',
        'qa/04-ui-code-universal.png',
        'qa/06-assets-audio-universal.png',
        'qa/07-integrations-universal.png',
      ].map((file)=><div key={file} style={{overflow:'hidden',borderRadius:22,border:'1px solid #343a4f',background:'#090c13'}}>
        <Img src={source(file)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      </div>)}
    </div>
  </SafeFrame>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(2,3,8,.42),transparent 38%,rgba(2,3,8,.35))'}}/>
</AbsoluteFill>;

export const FactoryTourShowcase=()=> <AbsoluteFill style={{background:'#05070c'}}>
  <Scene id="intro">
    <Montage files={[
      {file:'01-engine.mp4',startSec:10.2},
      {file:'02-motion.mp4',startSec:3.9},
      {file:'03-editor.mp4',startSec:6.1},
      {file:'04-ui-code.mp4',startSec:6.2},
    ]}/>
    <Label kicker="N4 FACTORY TOUR" title="A FÁBRICA EM OPERAÇÃO" subtitle="Sete showcases reais. Um único pipeline."/>
  </Scene>

  <Scene id="evidence">
    <Clip file="01-engine.mp4" startSec={10.2}/>
    <Label kicker="01 · EVIDÊNCIA" title="COMEÇA NA FONTE REAL" subtitle="Código, registros, políticas e estado verificável."/>
  </Scene>

  <Scene id="components">
    <Clip file="01-engine.mp4" startSec={4.8}/>
    <Label kicker="02 · SPEC + COMPONENTS" title="INTENÇÃO VIRA ESTRUTURA" subtitle="Templates, componentes reutilizáveis e registry."/>
  </Scene>

  <Scene id="motion">
    <Clip file="02-motion.mp4" startSec={3.9}/>
    <Label kicker="03 · MOTION" title="MOVIMENTO COM FUNÇÃO" subtitle="Foco, relação, typing, métricas e progresso."/>
  </Scene>

  <Scene id="editor">
    <Clip file="03-editor.mp4" startSec={3.1}/>
    <Label kicker="04 · EDITOR" title="LAYOUT TAMBÉM É DADO" subtitle="Mover, transformar, alinhar, persistir e editar timeline."/>
  </Scene>

  <Scene id="uiPedagogy">
    <Split left={{file:'04-ui-code.mp4',startSec:6.2}} right={{file:'05-pedagogy.mp4',startSec:14.7}}/>
    <Label kicker="05 · UI + PEDAGOGIA" title="SIMULAR E ENSINAR" subtitle="Interfaces, código, recall, quiz e personagens."/>
  </Scene>

  <Scene id="assetsAudio">
    <Clip file="06-assets-audio.mp4" startSec={11.5}/>
    <Label kicker="06 · ASSETS + ÁUDIO" title="MÍDIA ENTRA NO CONTRATO" subtitle="Library, mix, ducking e loudness QA."/>
  </Scene>

  <Scene id="integrations">
    <Clip file="07-integrations.mp4" startSec={6.5}/>
    <Label kicker="07 · INTEGRAÇÕES" title="ORIGEM E LIMITES EXPLÍCITOS" subtitle="Adobe, Instavar e imports governados."/>
  </Scene>

  <Scene id="qa">
    <QaScene/>
    <Label kicker="08 · QA" title="VALIDAR ANTES DE PROMOVER" subtitle="Typecheck, testes, safe areas e A/V sync."/>
  </Scene>

  <Scene id="close">
    <Montage files={[
      {file:'05-pedagogy.mp4',startSec:29.2},
      {file:'06-assets-audio.mp4',startSec:24.2},
      {file:'07-integrations.mp4',startSec:34.6},
      {file:'03-editor.mp4',startSec:21.4},
    ]}/>
    <Label kicker="MCF CONTENT STUDIO N4" title="EVIDÊNCIA → VÍDEO ASSISTÍVEL" subtitle="Rastreável. Versionado. Pronto para revisão."/>
  </Scene>

  <CaptionOverlay cues={factoryTourSync.cues}/>
</AbsoluteFill>;

export {factoryTourSync};
