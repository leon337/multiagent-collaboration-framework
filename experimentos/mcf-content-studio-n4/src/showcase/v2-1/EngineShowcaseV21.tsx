import {AbsoluteFill,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {engineSync,showcaseEngineSpec} from '../synced';
import {AnimatedLine,Chip,MiniCode,Node,Panel,Stage,StatusDot,reveal,v21,V21Canvas} from './shared';

const cues=showcaseEngineSpec.narration.cues;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

const Intro=()=>{
  const f=useCurrentFrame(); const p=reveal(f,0,20);
  const nodes:Array<[string,string]>=[['SOURCE','Issue / PR'],['SPEC','TechnicalLessonSpec'],['REGISTRY','APPROVED'],['RENDER','Remotion']];
  return <Stage kicker="N4 SHOWCASE 01 · ENGINE" title="ROTEIRO VIRA SISTEMA EXECUTÁVEL" subtitle="A mesma fonte factual percorre spec, registry e composição sem duplicar a aula." proof={['SOURCE REAL','SPEC','VIDEO']}>
    <div style={{position:'relative',height:'100%',display:'grid',gridTemplateRows:'1fr 180px',gap:18}}>
      <Panel style={{position:'relative',padding:28,overflow:'hidden'}}>
        <div style={{position:'absolute',left:90,right:90,top:'50%',height:4,background:'linear-gradient(90deg,#245cff,#48c7ff,#7257ff)',opacity:.22}}/>
        <div style={{height:'100%',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,alignItems:'center'}}>
          {nodes.map(([a,b],i)=><div key={a} style={{opacity:interpolate(p,[i*.16,Math.min(1,i*.16+.42)],[0,1],clamp),transform:`translateY(${(1-p)*20}px)`}}>
            <Node label={a} value={b} accent={i===2?v21.green:i===3?v21.violet:v21.blue} active={i===2}/>
          </div>)}
        </div>
        <div style={{position:'absolute',left:72,right:72,bottom:34,display:'flex',justifyContent:'space-between'}}>
          <Chip>evidência</Chip><Chip tone="violet">composição</Chip><Chip tone="green">rastreável</Chip>
        </div>
      </Panel>
      <div style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:18}}>
        <MiniCode lines={['const spec = buildLesson(source);','registry.resolve(spec.scenes);','render(spec);']} activeLine={Math.min(2,Math.floor(f/34))}/>
        <Panel style={{padding:22,display:'grid',gap:12,alignContent:'center'}}>
          <StatusDot label="fonte verificada"/><StatusDot label="componentes aprovados"/><StatusDot label="render determinístico"/>
        </Panel>
      </div>
    </div>
  </Stage>;
};

const Compare=()=>{
  const f=useCurrentFrame(); const p=reveal(f,8,34);
  return <Stage kicker="01 · ARQUITETURA" title="DE CENAS ISOLADAS PARA UMA ENGINE" subtitle="O conteúdo muda. O contrato de composição permanece." proof={['ANTES','TRANSFORMA','AGORA']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'.88fr 1.12fr',gap:18}}>
      <Panel style={{padding:24,position:'relative',overflow:'hidden'}}>
        <div style={{fontSize:16,letterSpacing:3,fontWeight:900,color:v21.red}}>ANTES · DUPLICAÇÃO</div>
        <div style={{marginTop:22,position:'relative',height:440}}>
          {[0,1,2,3].map((i)=><div key={i} style={{position:'absolute',left:18+i*22,top:18+i*58,right:18,border:'1px solid #ffd2dc',borderRadius:18,background:'#fff8fa',padding:18,boxShadow:'0 14px 32px rgba(170,43,78,.08)',opacity:.9-i*.12}}>
            <div style={{fontFamily:'ui-monospace,monospace',fontSize:18,fontWeight:800}}>lesson-{i+1}.tsx</div>
            <div style={{height:7,background:'#ffdce5',marginTop:13,borderRadius:9,width:`${78-i*6}%`}}/>
            <div style={{height:7,background:'#ffe9ef',marginTop:8,borderRadius:9,width:'62%'}}/>
          </div>)}
        </div>
        <Chip tone="red">código repetido</Chip>
      </Panel>
      <Panel style={{padding:24,position:'relative',overflow:'hidden',borderColor:'#a9c0ff'}}>
        <div style={{fontSize:16,letterSpacing:3,fontWeight:900,color:v21.green}}>AGORA · COMPOSIÇÃO</div>
        <div style={{position:'relative',height:470,marginTop:8}}>
          <Node label="TechnicalLessonSpec" value="1 contrato" active style={{position:'absolute',left:128,right:128,top:20}}/>
          <AnimatedLine from={[252,130]} to={[100,264]} progress={p}/>
          <AnimatedLine from={[340,130]} to={[330,264]} progress={p} accent={v21.violet}/>
          <AnimatedLine from={[428,130]} to={[560,264]} progress={p} accent={v21.green}/>
          <Node label="TITLE" value="component" style={{position:'absolute',left:16,top:270,width:190}}/>
          <Node label="DIAGRAM" value="component" accent={v21.violet} style={{position:'absolute',left:224,top:270,width:190}}/>
          <Node label="QA" value="component" accent={v21.green} style={{position:'absolute',right:16,top:270,width:190}}/>
          <div style={{position:'absolute',left:88,right:88,bottom:18,display:'flex',justifyContent:'center'}}><Chip tone="green">selecionar peças aprovadas</Chip></div>
        </div>
      </Panel>
    </div>
  </Stage>;
};

const Tree=()=>{
  const f=useCurrentFrame(); const p=reveal(f,6,34);
  return <Stage kicker="02 · REGISTRY" title="A ENGINE COMBINA PEÇAS APROVADAS" subtitle="Template no centro. Biblioteca ao redor. O Registry resolve o que pode entrar." proof={['TEMPLATE','REGISTRY','APPROVED']}>
    <Panel style={{height:'100%',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)'}}>
        <Node label="TechnicalLessonTemplate" value="renderScenes()" active style={{width:360,padding:28}}/>
      </div>
      <AnimatedLine from={[540,390]} to={[190,180]} progress={p}/>
      <AnimatedLine from={[540,390]} to={[850,180]} progress={p} accent={v21.violet}/>
      <AnimatedLine from={[540,390]} to={[190,620]} progress={p} accent={v21.green}/>
      <AnimatedLine from={[540,390]} to={[850,620]} progress={p} accent={v21.amber}/>
      <Node label="COMPONENTS" value="45" style={{position:'absolute',left:58,top:104,width:260}}/>
      <Node label="MOTION" value="19" accent={v21.violet} style={{position:'absolute',right:58,top:104,width:260}}/>
      <Node label="ASSETS" value="15" accent={v21.green} style={{position:'absolute',left:58,bottom:92,width:260}}/>
      <Node label="TEMPLATES" value="6" accent={v21.amber} style={{position:'absolute',right:58,bottom:92,width:260}}/>
      <div style={{position:'absolute',left:'50%',bottom:26,transform:'translateX(-50%)'}}><Chip tone="green">Registry status = APPROVED</Chip></div>
    </Panel>
  </Stage>;
};

const Metrics=()=>{
  const f=useCurrentFrame(); const p=reveal(f,0,44);
  const items=[['COMPONENTS',45,50,v21.blue],['MOTION',19,20,v21.violet],['ASSETS',15,20,v21.green]];
  return <Stage kicker="03 · BIBLIOTECA" title="A CAPACIDADE JÁ É MENSURÁVEL" subtitle="A engine não é promessa: os recursos existem no Registry atual." proof={['COUNT','REGISTRY','READY']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
      {items.map(([label,val,max,color],i)=>{
        const n=Math.round(Number(val)*p); const pct=Number(val)/Number(max);
        return <Panel key={String(label)} style={{padding:24,display:'grid',gridTemplateRows:'auto 1fr auto',alignItems:'center',textAlign:'center'}}>
          <div style={{fontSize:15,letterSpacing:2.6,fontWeight:900,color:String(color)}}>{label}</div>
          <div style={{position:'relative',width:190,height:190,margin:'0 auto',display:'grid',placeItems:'center'}}>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',background:`conic-gradient(${color} ${pct*360*p}deg,#e8efff 0)`,boxShadow:'inset 0 0 0 18px rgba(255,255,255,.75)'}}/>
            <div style={{position:'relative',fontSize:58,fontWeight:950}}>{n}</div>
          </div>
          <div style={{fontSize:17,color:v21.muted}}>Registry · current</div>
        </Panel>;
      })}
    </div>
  </Stage>;
};

const Close=()=>{
  const f=useCurrentFrame(); const p=reveal(f,4,24);
  return <Stage kicker="RESULTADO" title="DADOS MUDAM. A INFRAESTRUTURA PERMANECE." subtitle="A próxima aula troca a especificação, não reconstrói a fábrica." proof={['LESS COPY','MORE COMPOSE','REVIEW']}>
    <Panel style={{height:'100%',padding:28,display:'grid',gridTemplateColumns:'1fr 90px 1fr',gap:20,alignItems:'center'}}>
      <div style={{opacity:1-p*.35}}>
        <Chip tone="red">ANTES</Chip>
        <MiniCode lines={['<Scene title="..."/>','<Scene diagram="..."/>','<Scene metrics="..."/>','// duplicar em cada aula']} activeLine={3} style={{marginTop:18}}/>
      </div>
      <div style={{display:'grid',placeItems:'center',fontSize:58,color:v21.blue,transform:`translateX(${(1-p)*-18}px)`}}>→</div>
      <div>
        <Chip tone="green">AGORA</Chip>
        <MiniCode lines={['const spec = { scenes };','registry.validate(spec);','<TechnicalLessonTemplate spec={spec}/>','✓ reusable']} activeLine={3} style={{marginTop:18}}/>
      </div>
    </Panel>
  </Stage>;
};

const Scene=({id,children}:{id:keyof typeof engineSync.scenes;children:React.ReactNode})=>{
  const s=engineSync.scenes[id]!;
  return <Sequence from={s.from} durationInFrames={s.durationFrames}>{children}</Sequence>;
};

export const EngineShowcaseV21=()=> <AbsoluteFill>
  <Scene id="title"><Intro/></Scene>
  <Scene id="compare"><Compare/></Scene>
  <Scene id="tree"><Tree/></Scene>
  <Scene id="metrics"><Metrics/></Scene>
  <Scene id="close"><Close/></Scene>
  <CaptionOverlay cues={cues}/>
</AbsoluteFill>;
