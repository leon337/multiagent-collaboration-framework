import {AbsoluteFill,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {showcaseMotionSpec} from '../synced';
import {Chip,Node,Panel,Stage,TimelineTrack,reveal,v21} from './shared';

const cues=showcaseMotionSpec.narration.cues;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

const Intro=()=>{
  const f=useCurrentFrame(); const p=reveal(f,0,30);
  const presets=['fade','zoom','slide','camera','connector','draw-arrow','typewriter','underline','counter','progress','dim','scale','focus','reveal','pulse','pan','orbit','metric','text-entry'];
  return <Stage kicker="N4 SHOWCASE 02 · MOTION" title="19 PRESETS. CADA UM COM FUNÇÃO." subtitle="O movimento nasce da intenção da cena, não de uma coleção de efeitos soltos." proof={['INTENT','PRESET','FOCUS']}>
    <Panel style={{height:'100%',padding:24,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,alignContent:'center'}}>
      {presets.map((item,i)=>{
        const q=interpolate(p,[i/24,Math.min(1,i/24+.3)],[0,1],clamp);
        return <div key={item} style={{padding:'18px 12px',borderRadius:18,textAlign:'center',background:i%3===0?'#edf2ff':i%3===1?'#f1edff':'#eafaff',border:'1px solid '+(i%3===0?'#b9caff':i%3===1?'#d4c8ff':'#b8ebff'),fontSize:18,fontWeight:850,color:i%3===0?v21.blue:i%3===1?v21.violet:'#1685b2',opacity:q,transform:`translateY(${(1-q)*14}px)`}}>{item}</div>;
      })}
    </Panel>
  </Stage>;
};

const Focus=()=>{
  const f=useCurrentFrame(); const p=reveal(f,12,36);
  return <Stage kicker="01 · FOCUS INTENT" title="A CENA DECLARA O QUE IMPORTA" subtitle="Dim + camera zoom concentram atenção no conceito ativo." proof={['SCENE','INTENT: MODEL','ZOOM']}>
    <Panel style={{height:'100%',position:'relative',overflow:'hidden',background:'linear-gradient(145deg,#f9fbff,#edf3ff)'}}>
      {[
        ['MODEL',50,40],['RUNTIME',220,130],['ASSET',710,110],['GATE',755,520],['OUTPUT',110,560]
      ].map(([label,x,y],i)=><Node key={String(label)} label={String(label)} value={i===0?'FOCUS':'context'} active={i===0} accent={i===0?v21.blue:v21.muted} style={{position:'absolute',left:Number(x),top:Number(y),width:i===0?320:220,opacity:i===0?1:.18+.2*(1-p)}}/>)}
      <div style={{position:'absolute',left:28+p*150,top:14+p*150,width:460-p*160,height:340-p*100,border:'3px solid '+v21.blue,borderRadius:34,boxShadow:'0 0 0 999px rgba(20,38,75,.08)',transition:'none'}}/>
      <div style={{position:'absolute',right:44,bottom:44}}><Chip>camera zoom + dim</Chip></div>
    </Panel>
  </Stage>;
};

const Relation=()=>{
  const f=useCurrentFrame(); const p=reveal(f,8,46);
  return <Stage kicker="02 · CONNECTOR" title="MOVIMENTO EXPLICA RELAÇÃO" subtitle="O viewer vê causa e destino no mesmo gesto." proof={['A','CONNECT','B']}>
    <Panel style={{height:'100%',position:'relative',padding:28}}>
      <Node label="CONCEITO A" value="source" active style={{position:'absolute',left:70,top:220,width:300}}/>
      <Node label="CONCEITO B" value="effect" accent={v21.violet} active style={{position:'absolute',right:70,top:220,width:300}}/>
      <svg viewBox="0 0 900 500" style={{position:'absolute',left:70,right:70,top:130,bottom:130,width:'calc(100% - 140px)',height:'calc(100% - 260px)',overflow:'visible'}}>
        <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor={v21.blue}/><stop offset="1" stopColor={v21.violet}/></linearGradient></defs>
        <path d="M250 250 C360 130 540 130 650 250" fill="none" stroke="#d6e1ff" strokeWidth="14" strokeLinecap="round"/>
        <path d="M250 250 C360 130 540 130 650 250" fill="none" stroke="url(#g)" strokeWidth="8" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p}/>
        <circle cx={250+(650-250)*p} cy={250-110*Math.sin(Math.PI*p)} r="16" fill={v21.cyan} stroke="white" strokeWidth="8"/>
      </svg>
      <div style={{position:'absolute',left:'50%',bottom:120,transform:'translateX(-50%)'}}><Chip tone="violet">draw arrow → understanding</Chip></div>
    </Panel>
  </Stage>;
};

const Typing=()=>{
  const f=useCurrentFrame(); const text="focusIntent: 'text-entry'"; const count=Math.min(text.length,Math.floor(f/3));
  return <Stage kicker="03 · TEXT ENTRY" title="O ESTADO APARECE NO RITMO DA AÇÃO" subtitle="Typing, underline e progress tornam a mudança observável." proof={['TYPE','SELECT','STATE']}>
    <Panel style={{height:'100%',display:'grid',gridTemplateRows:'1fr 120px',padding:26,gap:18,background:'linear-gradient(145deg,#13213d,#0b1730)',borderColor:'#6f8fcc'}}>
      <div style={{display:'grid',alignContent:'center'}}>
        <div style={{fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',fontSize:34,color:'#dce9ff',lineHeight:1.6}}>
          <div style={{color:'#7cc8ff'}}>$ scene.intent</div>
          <div style={{marginTop:24}}>{text.slice(0,count)}<span style={{opacity:f%20<10?1:.2}}>▍</span></div>
        </div>
        <div style={{height:8,borderRadius:99,background:'#253b66',marginTop:32,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,count/text.length*100)}%`,background:'linear-gradient(90deg,#48c7ff,#7257ff)'}}/></div>
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center'}}><Chip>typewriter</Chip><Chip tone="violet">underline</Chip><Chip tone="green">progress</Chip></div>
    </Panel>
  </Stage>;
};

const Metric=()=>{
  const f=useCurrentFrame(); const p=reveal(f,6,42);
  return <Stage kicker="04 · SEMÂNTICA" title="12 PRESETS DE ESTILO + 7 SEMÂNTICOS" subtitle="A engine separa como algo se move de por que ele se move." proof={['STYLE 12','SEMANTIC 7','TOTAL 19']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
      {[
        ['STYLE',12,19,v21.blue,['fade','zoom','slide','scale']],
        ['SEMANTIC',7,19,v21.violet,['model','relation','metric','text-entry']]
      ].map(([label,val,max,color,tags])=><Panel key={String(label)} style={{padding:26,display:'grid',gridTemplateRows:'auto 1fr auto'}}>
        <div style={{fontSize:16,letterSpacing:3,fontWeight:900,color:String(color)}}>{label}</div>
        <div style={{display:'grid',placeItems:'center',position:'relative'}}>
          <div style={{width:220,height:220,borderRadius:'50%',background:`conic-gradient(${color} ${Number(val)/Number(max)*360*p}deg,#e8efff 0)`,display:'grid',placeItems:'center'}}>
            <div style={{width:160,height:160,borderRadius:'50%',background:'white',display:'grid',placeItems:'center',fontSize:64,fontWeight:950}}>{Math.round(Number(val)*p)}</div>
          </div>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{(tags as string[]).map(t=><Chip key={t} tone={label==='STYLE'?'blue':'violet'}>{t}</Chip>)}</div>
      </Panel>)}
    </div>
  </Stage>;
};

const Close=()=>{
  const f=useCurrentFrame(); const p=reveal(f,4,36);
  return <Stage kicker="REGRA" title="ANIMAÇÃO SERVE À COMPREENSÃO" subtitle="O roteiro declara intenção. A engine resolve o movimento." proof={['INTENT','MOTION','MEANING']}>
    <Panel style={{height:'100%',padding:28,display:'grid',gridTemplateRows:'1fr auto',gap:20}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,alignItems:'center'}}>
        <Node label="INTENT" value="model" active/>
        <div style={{fontSize:64,textAlign:'center',color:v21.blue,transform:`translateX(${(1-p)*-16}px)`}}>→</div>
        <Node label="MOTION" value="focus + zoom" accent={v21.violet} active/>
      </div>
      <TimelineTrack label="viewer" segments={[1,1.2,.7,1]} accent={v21.green} play={p}/>
    </Panel>
  </Stage>;
};

export const MotionShowcaseV21=()=> <AbsoluteFill>
  <Sequence from={0} durationInFrames={135}><Intro/></Sequence>
  <Sequence from={135} durationInFrames={180}><Focus/></Sequence>
  <Sequence from={315} durationInFrames={180}><Relation/></Sequence>
  <Sequence from={495} durationInFrames={180}><Typing/></Sequence>
  <Sequence from={675} durationInFrames={180}><Metric/></Sequence>
  <Sequence from={855} durationInFrames={180}><Close/></Sequence>
  <CaptionOverlay cues={cues}/>
</AbsoluteFill>;
