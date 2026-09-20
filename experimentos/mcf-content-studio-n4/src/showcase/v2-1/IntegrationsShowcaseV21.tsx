import {AbsoluteFill,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {integrationsSync} from '../phase-b/synced';
import {Chip,MiniCode,Node,Panel,Stage,StatusDot,reveal,v21} from './shared';

const cues=integrationsSync.cues;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

const Intro=()=>{
  const f=useCurrentFrame(); const p=reveal(f,0,28);
  const nodes=[
    ['ADOBE','visual ref',v21.blue],['INSTAVAR','VideoSpec',v21.violet],['IMPORTER','manifest',v21.amber],['EXPLAIN','companion',v21.green]
  ];
  return <Stage kicker="N4 SHOWCASE 07 · INTEGRATIONS" title="CADA INTEGRAÇÃO ENTRA COM ORIGEM E LIMITE" subtitle="O N4 recebe handoffs governados; nenhuma ponte vira autorização implícita." proof={['SOURCE','ADAPT','REVIEW']}>
    <Panel style={{height:'100%',position:'relative',padding:26}}>
      <Node label="N4" value="governed handoff" active style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:330}}/>
      {nodes.map(([a,b,c],i)=>{
        const pos=([[60,90],[650,90],[60,520],[650,520]] as Array<[number,number]>)[i]!;
        return <Panel key={String(a)} style={{position:'absolute',left:pos[0],top:pos[1],width:270,padding:22,opacity:interpolate(p,[i*.12,Math.min(1,i*.12+.55)],[0,1],clamp),borderColor:String(c),background:'#fff'}}>
          <Chip tone={i===1?'violet':i===2?'amber':i===3?'green':'blue'}>{a}</Chip>
          <div style={{fontSize:22,fontWeight:950,marginTop:16}}>{b}</div>
          <div style={{fontSize:15,color:v21.muted,marginTop:8}}>provenance attached</div>
        </Panel>;
      })}
      <svg viewBox="0 0 1000 800" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
        {[[195,190,500,400],[790,190,500,400],[195,620,500,400],[790,620,500,400]].map((a,i)=><line key={i} x1={a[0]} y1={a[1]} x2={a[2]} y2={a[3]} stroke={[v21.blue,v21.violet,v21.amber,v21.green][i]} strokeWidth="5" strokeDasharray="9 10" opacity={.35+.55*p}/>)}
      </svg>
    </Panel>
  </Stage>;
};

const Adobe=()=>{
  const f=useCurrentFrame(); const total=integrationsSync.scenes.adobe!.durationFrames; const p=reveal(f,6,30);
  return <Stage kicker="01 · ADOBE EXPRESS → N4" title="REFERÊNCIA VISUAL ENTRA COMO HANDOFF" subtitle="O bridge transporta alvo, aspect e tokens sem fingir introspecção que não existe." proof={['REFERENCE','TOKENS','0 FINDINGS']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'1fr 90px 1fr',gap:14,alignItems:'center'}}>
      <Panel style={{height:'100%',padding:24,display:'grid',gridTemplateRows:'auto 1fr auto'}}>
        <Chip>ADOBE EXPRESS</Chip>
        <div style={{display:'grid',alignContent:'center',gap:16}}>
          <div style={{height:220,borderRadius:26,background:'linear-gradient(145deg,#dce8ff,#f4efff)',display:'grid',placeItems:'center',fontSize:54,color:v21.blue}}>◇</div>
          <div style={{fontSize:18,fontWeight:850}}>visual reference</div>
        </div>
        <StatusDot label="source identified"/>
      </Panel>
      <div style={{fontSize:64,textAlign:'center',color:v21.blue,transform:`translateX(${(1-p)*-18}px)`}}>→</div>
      <Panel style={{height:'100%',padding:24,display:'grid',gridTemplateRows:'auto 1fr auto'}}>
        <Chip tone="green">N4 HANDOFF</Chip>
        <div style={{display:'grid',alignContent:'center',gap:13}}>
          {['component: BounceHeadlineN4','aspect: 9:16','tokens: target','findings: 0'].map((x,i)=><div key={x} style={{padding:14,borderRadius:15,background:i===3?'#ebfbf4':'#f7faff',border:'1px solid '+(i===3?'#b5ead3':v21.line),fontSize:16,fontWeight:i===3?900:750}}>{x}</div>)}
        </div>
        <StatusDot label="validated"/>
      </Panel>
    </div>
  </Stage>;
};

const Limits=()=>{
  const rows=[
    ['node introspection','NO','non-claim'],
    ['token introspection','NO','non-claim'],
    ['pixel-perfect parity','NO','non-claim'],
    ['visual reference','YES','supported'],
    ['target tokens','YES','supported']
  ];
  return <Stage kicker="02 · NON-CLAIMS" title="O BRIDGE MOSTRA O QUE PODE E O QUE NÃO PODE" subtitle="Limites explícitos impedem que uma integração seja apresentada como automação mágica." proof={['CAPABILITY','LIMIT','TRUTH']}>
    <Panel style={{height:'100%',padding:22}}>
      <div style={{display:'grid',gridTemplateColumns:'1.2fr .5fr 1fr',padding:'0 12px 12px',fontSize:13,letterSpacing:2,fontWeight:900,color:v21.muted}}><span>CAPABILITY</span><span>STATE</span><span>INTERPRETATION</span></div>
      <div style={{display:'grid',gap:10}}>
        {rows.map(([a,b,c],i)=><div key={a} style={{display:'grid',gridTemplateColumns:'1.2fr .5fr 1fr',alignItems:'center',padding:'15px 12px',borderRadius:16,background:i<3?'#fff7f9':'#f0fbf6',border:'1px solid '+(i<3?'#ffd2dd':'#b8ead5')}}>
          <strong style={{fontSize:17}}>{a}</strong><Chip tone={b==='YES'?'green':'red'}>{b}</Chip><span style={{fontSize:15,color:v21.muted}}>{c}</span>
        </div>)}
      </div>
    </Panel>
  </Stage>;
};

const Instavar=()=>{
  const f=useCurrentFrame(); const total=integrationsSync.scenes.instavar!.durationFrames; const active=Math.min(2,Math.floor(f/Math.max(1,total/3)));
  const beats=[['BEAT 1','problem'],['BEAT 2','proof'],['BEAT 3','takeaway']];
  return <Stage kicker="03 · INSTAVAR" title="STORYBOARD VIRA VIDEOSPEC E DEPOIS CENA" subtitle="A ponte preserva aspecto, cenas e timing antes de entrar no N4." proof={['STORYBOARD','VIDEOSPEC','N4']}>
    <Panel style={{height:'100%',padding:24,display:'grid',gridTemplateRows:'1fr 1fr',gap:18}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
        {beats.map(([a,b],i)=><div key={a} style={{padding:20,borderRadius:22,border:'2px solid '+(i<=active?['#9ab3ff','#c9baff','#9fe6d1'][i]:v21.line),background:i<=active?['#eef3ff','#f3efff','#eefbf6'][i]:'#fbfdff',opacity:i<=active?1:.36}}>
          <Chip tone={i===1?'violet':i===2?'green':'blue'}>{a}</Chip><div style={{fontSize:24,fontWeight:950,marginTop:20}}>{b}</div>
        </div>)}
      </div>
      <MiniCode lines={['schemaVersion: "1.0"','templateFamily: "proof-walkthrough"','target.aspect: "9:16"','scenes: hero → proof → cta','ducking: true']} activeLine={Math.min(4,active+1)}/>
    </Panel>
  </Stage>;
};

const Importer=()=>{
  const f=useCurrentFrame(); const p=reveal(f,8,34);
  return <Stage kicker="04 · EXTERNAL IMPORTER" title="ADAPTAR ANTES DE PROMOVER" subtitle="Revision, licença, decisão e status permanecem visíveis durante o handoff." proof={['REVISION','LICENSE','DECISION']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'1fr .95fr',gap:18}}>
      <Panel style={{padding:24}}>
        <Chip tone="amber">SOURCE MANIFEST</Chip>
        <div style={{display:'grid',gap:14,marginTop:24}}>
          {[
            ['revision','7bce76aa2d'],['license','MIT'],['source','external'],['status','reviewed']
          ].map(([a,b])=><div key={a} style={{display:'flex',justifyContent:'space-between',padding:'15px 16px',borderRadius:15,background:'#fbfdff',border:'1px solid '+v21.line,fontSize:17}}><span style={{color:v21.muted}}>{a}</span><strong>{b}</strong></div>)}
        </div>
      </Panel>
      <Panel style={{padding:24,display:'grid',gridTemplateRows:'auto 1fr auto'}}>
        <Chip>POLICY DECISION</Chip>
        <div style={{display:'grid',placeItems:'center'}}>
          <div style={{width:220,height:220,borderRadius:'50%',display:'grid',placeItems:'center',background:`conic-gradient(${v21.green} ${p*290}deg,#e8efff 0)`}}>
            <div style={{width:166,height:166,borderRadius:'50%',background:'white',display:'grid',placeItems:'center',fontSize:34,fontWeight:950,color:v21.green}}>ADAPT</div>
          </div>
        </div>
        <StatusDot label="promotion blocked until review"/>
      </Panel>
    </div>
  </Stage>;
};

const Adapted=()=>{
  const f=useCurrentFrame(); const p=reveal(f,6,36);
  return <Stage kicker="05 · ADAPTAÇÃO" title="O IMPORT NÃO ENTRA CRU NA FÁBRICA" subtitle="A peça externa recebe tratamento N4, mantendo origem e decisão ligadas ao resultado." proof={['EXTERNAL','ADAPT','N4']}>
    <Panel style={{height:'100%',padding:26,display:'grid',gridTemplateColumns:'1fr 90px 1fr',gap:18,alignItems:'center'}}>
      <div style={{padding:24,borderRadius:24,background:'#13213d',color:'white',height:360,display:'grid',alignContent:'center',textAlign:'center',opacity:.86}}>
        <Chip tone="amber">EXTERNAL</Chip><div style={{fontSize:38,fontWeight:950,marginTop:40}}>BOUNCE HEADLINE</div><div style={{fontSize:16,color:'#b7c7e6',marginTop:12}}>source component</div>
      </div>
      <div style={{fontSize:62,textAlign:'center',color:v21.blue,transform:`rotate(${(1-p)*-12}deg)`}}>→</div>
      <div style={{padding:24,borderRadius:24,background:'linear-gradient(145deg,#eef3ff,#f7faff)',border:'2px solid #a9bdff',height:360,display:'grid',alignContent:'center',textAlign:'center',boxShadow:'0 26px 62px rgba(36,92,255,.14)'}}>
        <Chip>N4 ADAPTED</Chip><div style={{fontSize:38,fontWeight:950,marginTop:40,color:v21.blue}}>IMPORT GOVERNADO</div><div style={{fontSize:16,color:v21.muted,marginTop:12}}>provenance retained</div>
      </div>
    </Panel>
  </Stage>;
};

const Explain=()=>{
  const f=useCurrentFrame(); const p=reveal(f,6,30);
  return <Stage kicker="06 · EXPLAIN COMPANION" title="DUAS SAÍDAS, DOIS PAPÉIS" subtitle="Remotion entrega o vídeo composto. Explain entrega uma revisão narrada assistível; nenhum substitui a governança." proof={['REMOTION','EXPLAIN','SEPARATE']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
      <Panel style={{padding:26,transform:`translateX(${(1-p)*-22}px)`}}>
        <Chip>REMOTION / N4</Chip>
        <div style={{height:280,borderRadius:26,background:'linear-gradient(145deg,#17305f,#245cff)',display:'grid',placeItems:'center',color:'white',fontSize:68,marginTop:26}}>▶</div>
        <div style={{display:'grid',gap:12,marginTop:24}}><StatusDot label="composition"/><StatusDot label="render"/><StatusDot label="A/V sync"/></div>
      </Panel>
      <Panel style={{padding:26,transform:`translateX(${(1-p)*22}px)`}}>
        <Chip tone="green">EXPLAIN</Chip>
        <div style={{height:280,borderRadius:26,background:'linear-gradient(145deg,#e9fbf4,#eafaff)',display:'grid',placeItems:'center',fontSize:62,color:v21.green,marginTop:26}}>◫</div>
        <div style={{display:'grid',gap:12,marginTop:24}}><StatusDot label="inline review"/><StatusDot label="narrated"/><StatusDot label="companion"/></div>
      </Panel>
    </div>
  </Stage>;
};

const Close=()=> <Stage kicker="N4 INTEGRATION POLICY" title="ORIGEM → LIMITE → ADAPTAÇÃO → REVIEW" subtitle="Integração é rastreabilidade. A automação nunca apaga a procedência nem o gate humano." proof={['SOURCE','LIMIT','HUMAN_GATE']}>
  <Panel style={{height:'100%',padding:28,display:'grid',alignItems:'center'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
      {[['ORIGEM','①',v21.blue],['LIMITE','②',v21.red],['ADAPTAÇÃO','③',v21.violet],['REVIEW','④',v21.green]].map(([a,b,c])=><div key={String(a)} style={{display:'grid',gap:16,textAlign:'center'}}>
        <div style={{width:130,height:130,borderRadius:36,margin:'0 auto',display:'grid',placeItems:'center',background:String(c)+'18',border:'1px solid '+String(c)+'55',fontSize:52,fontWeight:950,color:String(c)}}>{b}</div>
        <div style={{fontSize:18,fontWeight:950}}>{a}</div>
      </div>)}
    </div>
  </Panel>
</Stage>;

const Scene=({id,children}:{id:keyof typeof integrationsSync.scenes;children:React.ReactNode})=>{
  const s=integrationsSync.scenes[id]!;
  return <Sequence from={s.from} durationInFrames={s.durationFrames}>{children}</Sequence>;
};

export const IntegrationsShowcaseV21=()=> <AbsoluteFill>
  <Scene id="intro"><Intro/></Scene>
  <Scene id="adobe"><Adobe/></Scene>
  <Scene id="limits"><Limits/></Scene>
  <Scene id="instavar"><Instavar/></Scene>
  <Scene id="importer"><Importer/></Scene>
  <Scene id="adapted"><Adapted/></Scene>
  <Scene id="explain"><Explain/></Scene>
  <Scene id="close"><Close/></Scene>
  <CaptionOverlay cues={cues}/>
</AbsoluteFill>;
