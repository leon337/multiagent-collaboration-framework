import {AbsoluteFill,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {assetsAudioSync} from '../phase-b/synced';
import {Chip,Panel,Stage,StatusDot,TimelineTrack,reveal,v21} from './shared';

const cues=assetsAudioSync.cues;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

const Intro=()=>{
  const f=useCurrentFrame(); const p=reveal(f,0,26);
  const steps=[['SEARCH','assets'],['BUILD','procedural'],['MIX','4 tracks'],['DUCK','-9 dB'],['QA','loudness']];
  return <Stage kicker="N4 SHOWCASE 06 · ASSET + AUDIO" title="MÍDIA ENTRA COMO CONTRATO, NÃO COMO ARQUIVO SOLTO" subtitle="Busca, materialização, mix, ducking e QA ficam visíveis no mesmo pipeline." proof={['ASSET','MIX','QA']}>
    <Panel style={{height:'100%',padding:28,display:'grid',alignItems:'center'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
        {steps.map(([a,b],i)=><div key={a} style={{display:'grid',gap:14,alignContent:'center',opacity:interpolate(p,[i*.1,Math.min(1,i*.1+.5)],[0,1],clamp)}}>
          <div style={{height:130,borderRadius:28,display:'grid',placeItems:'center',background:['#eaf0ff','#f0ecff','#eafaff','#e9fbf4','#fff7e5'][i],border:'1px solid '+['#b8caff','#d5c8ff','#b6eaff','#b7ead5','#f3d994'][i]}}>
            <div style={{fontSize:20,fontWeight:950,color:[v21.blue,v21.violet,'#1685b2',v21.green,v21.amber][i]}}>{a}</div>
          </div>
          <div style={{fontSize:15,textAlign:'center',color:v21.muted}}>{b}</div>
        </div>)}
      </div>
    </Panel>
  </Stage>;
};

const Assets=()=>{
  const f=useCurrentFrame(); const total=assetsAudioSync.scenes.assets!.durationFrames; const active=Math.min(5,Math.floor(f/Math.max(1,total/6)));
  const items=[
    ['demo-loop','video','approved'],
    ['ui-click','sfx','approved'],
    ['ambient-pulse','ambient','approved'],
    ['music-bed','music','approved'],
    ['mcf-mark','image','approved'],
    ['grid-texture','image','approved']
  ];
  return <Stage kicker="01 · ASSET LIBRARY" title="BUSCA POR USO, TIPO E PROVENIÊNCIA" subtitle="O viewer enxerga o filtro, o resultado e o status do asset selecionado." proof={['FILTER','RESULT','APPROVED']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'240px 1fr',gap:16}}>
      <Panel style={{padding:20}}>
        <div style={{fontSize:14,letterSpacing:2.2,fontWeight:900,color:v21.muted}}>FILTERS</div>
        {['all','video','image','sfx','music','ambient'].map((x,i)=><div key={x} style={{padding:'13px 12px',borderRadius:14,marginTop:10,background:i===Math.min(active,5)?'#edf3ff':'#fbfdff',border:'1px solid '+(i===Math.min(active,5)?'#b9caff':v21.line),fontSize:16,fontWeight:i===Math.min(active,5)?900:700}}>{x}</div>)}
      </Panel>
      <Panel style={{padding:18,display:'grid',gridTemplateRows:'auto 1fr',gap:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:24,fontWeight:950}}>Approved assets</div><Chip tone="green">6 results</Chip></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {items.map((it,i)=><div key={it[0]} style={{padding:16,borderRadius:18,border:'1px solid '+(i===active?'#97b3ff':v21.line),background:i===active?'#eef4ff':'#fbfdff',display:'grid',gridTemplateColumns:'58px 1fr auto',gap:12,alignItems:'center'}}>
            <div style={{width:54,height:54,borderRadius:16,background:i%2?'#f0ecff':'#eaf0ff',display:'grid',placeItems:'center',fontSize:24}}>{it[1]==='video'?'▶':it[1]==='image'?'◇':'♪'}</div>
            <div><div style={{fontSize:17,fontWeight:900}}>{it[0]}</div><div style={{fontSize:13,color:v21.muted,marginTop:5}}>{it[1]} · local manifest</div></div>
            <Chip tone="green">{it[2]}</Chip>
          </div>)}
        </div>
      </Panel>
    </div>
  </Stage>;
};

const Procedural=()=>{
  const f=useCurrentFrame(); const total=assetsAudioSync.scenes.procedural!.durationFrames;
  const jobs=[['demo-loop','ffmpeg-color-loop-v1'],['ui-click','sine-wav-v1'],['ambient-pulse','sine-wav-v1'],['music-bed','sine-wav-v1']];
  return <Stage kicker="02 · MATERIALIZAÇÃO" title="ASSETS PROCEDURAIS NASCEM DENTRO DO PIPELINE" subtitle="Cada job mostra gerador, progresso e arquivo materializado." proof={['GENERATOR','BUILD','READY']}>
    <Panel style={{height:'100%',padding:22,display:'grid',gap:14,alignContent:'center'}}>
      {jobs.map((j,i)=>{
        const start=i*Math.max(1,total/6); const p=interpolate(f,[start,start+Math.max(20,total/3)],[0,1],clamp);
        return <div key={j[0]} style={{display:'grid',gridTemplateColumns:'180px 1fr 120px',gap:16,alignItems:'center',padding:'16px 18px',borderRadius:18,border:'1px solid '+v21.line,background:'#fbfdff'}}>
          <div><div style={{fontSize:18,fontWeight:950}}>{j[0]}</div><div style={{fontSize:13,color:v21.muted,marginTop:4}}>{j[1]}</div></div>
          <div style={{height:14,borderRadius:99,background:'#e7eefb',overflow:'hidden'}}><div style={{height:'100%',width:`${p*100}%`,background:i%2?'linear-gradient(90deg,#7257ff,#48c7ff)':'linear-gradient(90deg,#245cff,#10b981)'}}/></div>
          <div style={{textAlign:'right'}}>{p>=1?<Chip tone="green">ready</Chip>:<Chip tone="amber">{Math.round(p*100)}%</Chip>}</div>
        </div>;
      })}
    </Panel>
  </Stage>;
};

const Mix=()=>{
  const f=useCurrentFrame(); const total=assetsAudioSync.scenes.mix!.durationFrames; const play=interpolate(f,[0,total],[0,1],clamp);
  return <Stage kicker="03 · MIX" title="QUATRO TRILHAS, UM MESMO TEMPO" subtitle="Narração, música, SFX e ambiente ficam sincronizados com um playhead comum." proof={['NARRATION','MUSIC','SFX + AMBIENT']}>
    <Panel style={{height:'100%',padding:24,display:'grid',gridTemplateRows:'auto 1fr auto',gap:18,background:'linear-gradient(145deg,#fff,#f1f6ff)'}}>
      <div style={{display:'flex',justifyContent:'space-between'}}><Chip>LessonAudioMix</Chip><Chip tone="green">ducking on</Chip></div>
      <div style={{display:'grid',gap:24,alignContent:'center'}}>
        <TimelineTrack label="Narration" segments={[1.1,.8,1.2,.9]} accent={v21.green} play={play}/>
        <TimelineTrack label="Music" segments={[1,1,1,1]} accent={v21.violet} play={play}/>
        <TimelineTrack label="SFX" segments={[.3,.4,.2,.6, .2]} accent={v21.blue} play={play}/>
        <TimelineTrack label="Ambient" segments={[1.4,.9,1.1]} accent={v21.cyan} play={play}/>
      </div>
      <div style={{height:110,display:'flex',alignItems:'end',gap:6}}>
        {Array.from({length:44},(_,i)=>{const h=.22+.72*Math.abs(Math.sin(i*.62+play*8));return <div key={i} style={{flex:1,height:`${h*100}%`,borderRadius:6,background:i%3===0?v21.green:i%3===1?v21.blue:v21.violet,opacity:.58}}/>})}
      </div>
    </Panel>
  </Stage>;
};

const Ducking=()=>{
  const f=useCurrentFrame(); const total=assetsAudioSync.scenes.ducking!.durationFrames; const p=interpolate(f,[8,total*.72],[0,1],clamp);
  const points=Array.from({length:24},(_,i)=>{const x=i/23; const narration=x>.25&&x<.72; const music=narration?-9*p:0; return {x,music,narration};});
  return <Stage kicker="04 · DUCKING" title="A VOZ ABRE ESPAÇO NO MIX" subtitle="Quando a narração entra, música e ambiente reduzem ganho; depois recuperam." proof={['TRIGGER','-9 DB','RELEASE']}>
    <Panel style={{height:'100%',padding:28,display:'grid',gridTemplateRows:'auto 1fr auto',gap:18}}>
      <div style={{display:'flex',gap:12}}><Chip tone="green">trigger: narration</Chip><Chip tone="violet">targets: music + ambient</Chip><Chip tone="amber">reduction: -9 dB</Chip></div>
      <div style={{position:'relative',borderRadius:24,background:'#f8fbff',border:'1px solid '+v21.line,overflow:'hidden'}}>
        {[0,1,2,3].map(i=><div key={i} style={{position:'absolute',left:0,right:0,top:`${20+i*20}%`,height:1,background:'#dfe8f8'}}/>)}
        <svg viewBox="0 0 1000 420" style={{width:'100%',height:'100%'}}>
          <polyline points={points.map(pt=>`${pt.x*1000},${210-pt.music*13}`).join(' ')} fill="none" stroke={v21.violet} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points={points.map(pt=>`${pt.x*1000},${pt.narration?120:300}`).join(' ')} fill="none" stroke={v21.green} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{position:'absolute',left:'27%',top:20,bottom:20,width:'43%',background:'rgba(16,185,129,.06)',borderLeft:'2px dashed '+v21.green,borderRight:'2px dashed '+v21.green}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between'}}><StatusDot label="attack 6f"/><StatusDot label="release 15f"/><StatusDot label="voice stays clear"/></div>
    </Panel>
  </Stage>;
};

const QA=()=>{
  const f=useCurrentFrame(); const p=reveal(f,0,28);
  const meters=[['Integrated','-16.2','LUFS'],['True Peak','-1.1','dBTP'],['Duration','54.8','sec'],['Streams','2','A/V']];
  return <Stage kicker="05 · AUDIO QA" title="O MIX É MEDIDO ANTES DA ENTREGA" subtitle="Stream, duração, loudness e peak aparecem como evidência do arquivo final." proof={['PROBE','MEASURE','PASS']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
      {meters.map(([a,b,c],i)=><Panel key={a} style={{padding:24,display:'grid',alignContent:'space-between',opacity:interpolate(p,[i*.12,Math.min(1,i*.12+.5)],[0,1],clamp)}}>
        <div style={{display:'flex',justifyContent:'space-between'}}><Chip tone={i===1?'violet':'blue'}>{a}</Chip><Chip tone="green">PASS</Chip></div>
        <div style={{fontSize:66,fontWeight:950,marginTop:26}}>{b}</div>
        <div style={{fontSize:18,color:v21.muted}}>{c}</div>
      </Panel>)}
    </div>
  </Stage>;
};

const Close=()=> <Stage kicker="N4 AUDIO SYSTEM" title="ÁUDIO É PARTE DO CONTRATO" subtitle="Busca, materialização, mix, ducking e QA formam uma trilha rastreável." proof={['ASSET','MIX','DELIVER']}>
  <Panel style={{height:'100%',padding:28,display:'grid',gridTemplateRows:'1fr auto',gap:22}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,alignItems:'center'}}>
      {['ASSET','BUILD','MIX','DUCK','QA'].map((x,i)=><div key={x} style={{textAlign:'center'}}>
        <div style={{width:110,height:110,borderRadius:30,margin:'0 auto',display:'grid',placeItems:'center',background:['#eaf0ff','#f0ecff','#eafaff','#e9fbf4','#fff7e5'][i],fontSize:19,fontWeight:950,color:[v21.blue,v21.violet,'#1685b2',v21.green,v21.amber][i]}}>{x}</div>
        {i<4?<div style={{fontSize:30,color:v21.muted,marginTop:12}}>→</div>:null}
      </div>)}
    </div>
    <div style={{display:'flex',justifyContent:'space-between'}}><StatusDot label="narration"/><StatusDot label="music"/><StatusDot label="SFX"/><StatusDot label="ambient"/></div>
  </Panel>
</Stage>;

const Scene=({id,children}:{id:keyof typeof assetsAudioSync.scenes;children:React.ReactNode})=>{
  const s=assetsAudioSync.scenes[id]!;
  return <Sequence from={s.from} durationInFrames={s.durationFrames}>{children}</Sequence>;
};

export const AssetAudioShowcaseV21=()=> <AbsoluteFill>
  <Scene id="intro"><Intro/></Scene>
  <Scene id="assets"><Assets/></Scene>
  <Scene id="procedural"><Procedural/></Scene>
  <Scene id="mix"><Mix/></Scene>
  <Scene id="ducking"><Ducking/></Scene>
  <Scene id="qa"><QA/></Scene>
  <Scene id="close"><Close/></Scene>
  <CaptionOverlay cues={cues}/>
</AbsoluteFill>;
