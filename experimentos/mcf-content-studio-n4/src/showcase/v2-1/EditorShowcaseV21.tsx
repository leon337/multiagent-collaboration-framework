import {AbsoluteFill,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {editorSync} from '../synced';
import {Chip,MiniCode,Panel,Stage,StatusDot,TimelineTrack,reveal,v21} from './shared';

const cues=editorSync.cues;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

type Action='intro'|'direct'|'transform'|'rotate'|'align'|'nudge'|'persistA'|'persistB'|'timeline'|'tracks';

const WorkbenchHeader=({label}:{label:string})=><div style={{
  height:64,display:'flex',alignItems:'center',justifyContent:'space-between',
  padding:'0 18px',borderBottom:'1px solid '+v21.line,background:'rgba(244,248,255,.96)',
}}>
  <div style={{display:'flex',alignItems:'center',gap:12}}>
    <Chip>VIDEO LAB</Chip>
    <span style={{fontSize:15,fontWeight:850,color:v21.muted}}>{label}</span>
  </div>
  <div style={{display:'flex',gap:8}}>
    {['↶','↷','100%','PREVIEW'].map(x=><span key={x} style={{
      padding:'8px 11px',borderRadius:12,border:'1px solid '+v21.line,
      background:'white',fontSize:13,fontWeight:800,
    }}>{x}</span>)}
  </div>
</div>;

const BrowserObject=({x=0,y=0,scale=1,rot=0,label='BROWSER WINDOW'}:{x?:number;y?:number;scale?:number;rot?:number;label?:string})=>
  <div style={{
    position:'absolute',left:'50%',top:'50%',width:'58%',height:'28%',
    transform:`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(${scale}) rotate(${rot}deg)`,
    transformOrigin:'center',border:'4px solid '+v21.blue,borderRadius:24,
    background:'linear-gradient(145deg,#ffffff,#e8f0ff)',
    boxShadow:'0 28px 70px rgba(36,92,255,.20)',display:'grid',placeItems:'center',
  }}>
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:24,fontWeight:950}}>{label}</div>
      <div style={{fontSize:14,color:v21.muted,marginTop:6}}>Review Queue · reusable component</div>
    </div>
    {[
      ['left',-10,'top','50%'],['right',-10,'top','50%'],['left','50%','top',-10],['left','50%','bottom',-10],
    ].map((a,i)=>{
      const style:any={position:'absolute',width:18,height:18,borderRadius:99,background:v21.blue,border:'3px solid white'};
      style[a[0] as string]=a[1]; style[a[2] as string]=a[3];
      return <span key={i} style={style}/>;
    })}
  </div>;

const OverviewView=()=>{
  const f=useCurrentFrame();
  const p=reveal(f,0,28);
  return <Panel style={{height:'100%',padding:0,overflow:'hidden',display:'grid',gridTemplateRows:'64px 1fr 220px'}}>
    <WorkbenchHeader label="showcase-03.lesson.json"/>
    <div style={{minHeight:0,display:'grid',gridTemplateColumns:'200px 1fr 220px',gap:12,padding:12}}>
      <Panel style={{padding:14}}>
        <div style={{fontSize:12,letterSpacing:2.4,fontWeight:900,color:v21.muted}}>COMPONENTS</div>
        {['Title','Diagram','Browser','Quiz','StickRig','SoundCue'].map((item,i)=><div key={item} style={{
          marginTop:9,padding:'11px 10px',borderRadius:13,
          background:i===2?'#e6eeff':'#f7faff',
          border:'1px solid '+(i===2?'#9eb8ff':v21.line),
          fontSize:14,fontWeight:i===2?900:700,color:i===2?v21.blue:v21.ink,
          opacity:interpolate(p,[i*.07,Math.min(1,i*.07+.55)],[0,1],clamp),
        }}>{item}</div>)}
      </Panel>

      <div style={{position:'relative',overflow:'hidden',borderRadius:26,border:'1px solid #bfd3ff',background:'linear-gradient(145deg,#f9fbff,#dfe9ff)'}}>
        <div style={{position:'absolute',inset:24,border:'1px dashed #9fb8e9',borderRadius:18}}/>
        <BrowserObject/>
        <div style={{position:'absolute',left:'48%',top:'54%',fontSize:42,filter:'drop-shadow(0 6px 10px rgba(20,40,90,.22))'}}>☝</div>
        <div style={{position:'absolute',left:18,bottom:18}}><Chip>selected</Chip></div>
      </div>

      <Panel style={{padding:14}}>
        <div style={{fontSize:12,letterSpacing:2.4,fontWeight:900,color:v21.muted}}>INSPECTOR</div>
        {[
          ['x','52'],['y','-34'],['scale','1.00'],['rotation','0°']
        ].map(([a,b])=><div key={a} style={{
          display:'flex',justifyContent:'space-between',padding:'11px 0',
          borderBottom:'1px solid #e5edfb',fontSize:14,
        }}><span style={{color:v21.muted}}>{a}</span><strong>{b}</strong></div>)}
        <div style={{marginTop:16}}><StatusDot label="editing"/></div>
      </Panel>
    </div>
    <div style={{padding:'12px 16px 14px',borderTop:'1px solid '+v21.line,background:'#f8fbff',display:'grid',gap:10}}>
      <TimelineTrack label="Scenes" segments={[1.2,.8,1.1,.9]} play={.36}/>
      <TimelineTrack label="Motion" segments={[.6,1.4,.7,1.3]} accent={v21.violet} play={.36}/>
      <TimelineTrack label="Narration" segments={[1,1,1,1]} accent={v21.green} play={.36}/>
    </div>
  </Panel>;
};

const TransformView=({action}:{action:'direct'|'transform'|'rotate'|'nudge'})=>{
  const f=useCurrentFrame();
  const move=action==='direct'?interpolate(f,[10,62],[0,1],clamp):1;
  const scale=action==='transform'?interpolate(f,[8,64],[1,1.34],clamp):1.18;
  const rot=action==='rotate'?interpolate(f,[8,58],[0,15],clamp):10;
  const nudge=action==='nudge'?Math.round(interpolate(f,[8,54],[0,8],clamp)):0;
  const x=action==='direct'?interpolate(move,[0,1],[-90,65],clamp):48+nudge;
  const y=action==='transform'?interpolate(f,[8,64],[30,-46],clamp):-28;
  const label=action==='direct'?'pointer move':action==='transform'?'scale + position':action==='rotate'?'snap rotation':'keyboard nudge';

  return <Panel style={{height:'100%',padding:0,overflow:'hidden',display:'grid',gridTemplateRows:'64px 1fr'}}>
    <WorkbenchHeader label="Canvas Focus"/>
    <div style={{minHeight:0,display:'grid',gridTemplateColumns:'1fr 270px',gap:14,padding:14}}>
      <div style={{position:'relative',overflow:'hidden',borderRadius:28,border:'1px solid #a9c2ff',background:'linear-gradient(155deg,#dce8ff,#f8fbff 58%,#eaf1ff)'}}>
        <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:2,background:'#ff5b8a22'}}/>
        <div style={{position:'absolute',top:'50%',left:0,right:0,height:2,background:'#ff5b8a22'}}/>
        <BrowserObject x={x} y={y} scale={scale} rot={rot}/>
        <div style={{position:'absolute',left:action==='direct'?62:67,top:action==='direct'?530:310,fontSize:48}}>☝</div>
        <div style={{position:'absolute',left:20,bottom:20,display:'flex',gap:8}}>
          <Chip>{label}</Chip>
          {action==='rotate'?<Chip tone="green">snap 15°</Chip>:null}
          {action==='nudge'?<Chip tone="green">+{nudge}px</Chip>:null}
        </div>
      </div>

      <Panel style={{padding:18,display:'grid',gridTemplateRows:'auto 1fr auto',gap:16}}>
        <div>
          <div style={{fontSize:12,letterSpacing:2.4,fontWeight:900,color:v21.muted}}>TRANSFORM</div>
          <div style={{fontSize:28,fontWeight:950,marginTop:10}}>{label.toUpperCase()}</div>
        </div>
        <div style={{display:'grid',alignContent:'center',gap:13}}>
          {[
            ['x',String(Math.round(x))],
            ['y',String(Math.round(y))],
            ['scale',scale.toFixed(2)],
            ['rotation',rot.toFixed(0)+'°'],
          ].map(([a,b],i)=><div key={a} style={{
            display:'grid',gridTemplateColumns:'1fr auto',gap:10,padding:14,
            borderRadius:16,background:i===1?'#eef3ff':'#f8fbff',
            border:'1px solid '+v21.line,
          }}><span style={{fontSize:15,color:v21.muted}}>{a}</span><strong style={{fontSize:20}}>{b}</strong></div>)}
        </div>
        <StatusDot label="live transform"/>
      </Panel>
    </div>
  </Panel>;
};

const AlignView=()=>{
  const f=useCurrentFrame();
  const p=reveal(f,4,26);
  return <Panel style={{height:'100%',padding:0,overflow:'hidden',display:'grid',gridTemplateRows:'64px 1fr'}}>
    <WorkbenchHeader label="Alignment Mode"/>
    <div style={{position:'relative',minHeight:0,margin:14,borderRadius:30,overflow:'hidden',border:'1px solid #b4c9f7',background:'linear-gradient(145deg,#edf4ff,#f9fbff)'}}>
      <div style={{position:'absolute',left:'50%',top:22,bottom:22,width:3,background:'#ff4f80',opacity:.75*p,boxShadow:'0 0 0 4px rgba(255,79,128,.07)'}}/>
      <div style={{position:'absolute',top:'50%',left:22,right:22,height:3,background:'#ff4f80',opacity:.75*p,boxShadow:'0 0 0 4px rgba(255,79,128,.07)'}}/>

      <div style={{position:'absolute',left:68,top:102,width:240,height:170,borderRadius:24,background:'#eaf0ff',border:'2px solid #aac0ff',display:'grid',placeItems:'center',fontWeight:950,color:v21.blue}}>TITLE</div>
      <div style={{position:'absolute',right:70,top:126,width:240,height:170,borderRadius:24,background:'#f0ecff',border:'2px solid #cfc1ff',display:'grid',placeItems:'center',fontWeight:950,color:v21.violet}}>DIAGRAM</div>

      <div style={{
        position:'absolute',left:'50%',top:'50%',width:360,height:220,
        transform:'translate(-50%,-50%)',borderRadius:28,
        background:'linear-gradient(145deg,#fff,#e5eeff)',border:'4px solid '+v21.blue,
        boxShadow:'0 30px 80px rgba(36,92,255,.20)',display:'grid',placeItems:'center',
      }}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:28,fontWeight:950}}>BROWSER</div>
          <div style={{fontSize:15,color:v21.muted,marginTop:7}}>center snapped</div>
        </div>
      </div>

      <div style={{position:'absolute',left:64,bottom:58,display:'grid',gap:10}}>
        <Chip tone="green">vertical center ✓</Chip>
        <Chip tone="green">horizontal center ✓</Chip>
      </div>
      <Panel style={{position:'absolute',right:54,bottom:50,width:300,padding:18}}>
        <div style={{fontSize:13,letterSpacing:2.2,fontWeight:900,color:v21.muted}}>KEYBOARD</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,52px)',gap:8,justifyContent:'center',marginTop:16}}>
          {['','↑','','←','•','→','','↓',''].map((x,i)=><div key={i} style={{height:46,borderRadius:12,border:'1px solid '+v21.line,background:x?'#fff':'transparent',display:'grid',placeItems:'center',fontSize:20,fontWeight:900}}>{x}</div>)}
        </div>
      </Panel>
    </div>
  </Panel>;
};

const PersistView=({action}:{action:'persistA'|'persistB'})=>{
  const f=useCurrentFrame();
  const p=reveal(f,4,28);
  const isSpec=action==='persistB';
  return <Panel style={{height:'100%',padding:0,overflow:'hidden',display:'grid',gridTemplateRows:'64px 1fr'}}>
    <WorkbenchHeader label={isSpec?'TechnicalLessonSpec':'Persist Layout'}/>
    <div style={{minHeight:0,display:'grid',gridTemplateColumns:'.9fr 70px 1.1fr',gap:14,padding:16,alignItems:'center'}}>
      <Panel style={{height:'82%',padding:20,display:'grid',gridTemplateRows:'auto 1fr auto',gap:14}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <Chip>CANVAS STATE</Chip><Chip tone="green">saved</Chip>
        </div>
        <div style={{position:'relative',borderRadius:22,background:'linear-gradient(145deg,#edf3ff,#dfeaff)',border:'1px solid #b9cbf3'}}>
          <div style={{position:'absolute',left:'50%',top:'50%',width:'64%',height:'32%',transform:'translate(-50%,-50%) rotate(12deg)',border:'3px solid '+v21.blue,borderRadius:20,background:'white',display:'grid',placeItems:'center',boxShadow:'0 18px 45px rgba(36,92,255,.16)'}}>
            <strong>BROWSER WINDOW</strong>
          </div>
        </div>
        <div style={{fontSize:16,color:v21.muted}}>x 60 · y -34 · scale 1.18 · 12°</div>
      </Panel>

      <div style={{fontSize:58,textAlign:'center',color:v21.blue,transform:`translateX(${(1-p)*-18}px)`}}>→</div>

      <MiniCode
        lines={isSpec?[
          'TechnicalLessonSpec {',
          '  scene: "browser",',
          '  layout: { x: 60, y: -34 },',
          '  scale: 1.18,',
          '  rotationDeg: 12,',
          '  persisted: true',
          '}',
        ]:[
          'layout = {',
          '  x: 60,',
          '  y: -34,',
          '  scale: 1.18,',
          '  rotationDeg: 12',
          '}',
          'save(layout);',
        ]}
        activeLine={isSpec?5:6}
        style={{height:'82%',display:'grid',alignContent:'center'}}
      />
    </div>
  </Panel>;
};

const TimelineView=({action}:{action:'timeline'|'tracks'})=>{
  const f=useCurrentFrame();
  const total=action==='timeline'?77:100;
  const play=interpolate(f,[0,total],[0,1],clamp);
  return <Panel style={{height:'100%',padding:0,overflow:'hidden',display:'grid',gridTemplateRows:'64px 1fr'}}>
    <WorkbenchHeader label="Timeline"/>
    <div style={{minHeight:0,padding:18,display:'grid',gridTemplateRows:'120px 1fr 170px',gap:16,background:'linear-gradient(180deg,#eef4ff,#f9fbff)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center'}}>
        <div>
          <div style={{fontSize:14,letterSpacing:2.4,fontWeight:900,color:v21.muted}}>MULTI-TRACK EDIT</div>
          <div style={{fontSize:36,fontWeight:950,marginTop:8}}>{action==='timeline'?'SCENES + MOTION':'NARRATION + ASSETS'}</div>
        </div>
        <div style={{display:'flex',gap:8}}><Chip>30fps</Chip><Chip tone="green">autosaved</Chip></div>
      </div>

      <Panel style={{padding:22,display:'grid',gap:22,alignContent:'center',position:'relative',overflow:'hidden'}}>
        <TimelineTrack label="Scenes" segments={[1.2,.8,1.1,.9,.7]} play={play}/>
        <TimelineTrack label="Motion" segments={[.6,1.4,.7,1.3,.8]} accent={v21.violet} play={play}/>
        <TimelineTrack label="Narration" segments={[1,1,1,1,1]} accent={v21.green} play={play}/>
        <TimelineTrack label="Assets" segments={[.7,.9,1.5,.8,.6]} accent={v21.amber} play={play}/>
        <div style={{position:'absolute',left:`${Math.min(96,Math.max(4,play*100))}%`,top:10,bottom:10,width:3,background:v21.red,boxShadow:'0 0 14px rgba(240,68,104,.4)'}}/>
      </Panel>

      <div style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:14}}>
        <Panel style={{padding:16}}>
          <div style={{fontSize:13,letterSpacing:2.2,fontWeight:900,color:v21.muted}}>WAVEFORM</div>
          <div style={{height:86,display:'flex',alignItems:'center',gap:4,marginTop:10}}>
            {Array.from({length:54},(_,i)=>{
              const h=.18+.78*Math.abs(Math.sin(i*.47+play*7));
              return <div key={i} style={{flex:1,height:`${h*100}%`,borderRadius:6,background:i%2?v21.green:v21.blue,opacity:.6}}/>;
            })}
          </div>
        </Panel>
        <Panel style={{padding:16,display:'grid',alignContent:'center',gap:10}}>
          <StatusDot label="scene boundaries"/>
          <StatusDot label="audio aligned"/>
          <StatusDot label="assets linked"/>
        </Panel>
      </div>
    </div>
  </Panel>;
};

const EditorVisual=({action}:{action:Action})=>{
  if(action==='intro') return <OverviewView/>;
  if(action==='align') return <AlignView/>;
  if(action==='persistA'||action==='persistB') return <PersistView action={action}/>;
  if(action==='timeline'||action==='tracks') return <TimelineView action={action}/>;
  return <TransformView action={action}/>;
};

const EditorScene=({action,title,subtitle,proof}:{action:Action;title:string;subtitle:string;proof:[string,string,string]})=>
  <Stage kicker="N4 SHOWCASE 03 · EDITOR" title={title} subtitle={subtitle} proof={proof} compact>
    <EditorVisual action={action}/>
  </Stage>;

export const EditorShowcaseV21=()=> <AbsoluteFill>
  <Sequence from={editorSync.scenes.intro!.from} durationInFrames={editorSync.scenes.intro!.durationFrames}><EditorScene action="intro" title="O VIDEO LAB É UMA INTERFACE DE EDIÇÃO" subtitle="Objeto, ação, inspector e timeline aparecem como partes do mesmo sistema." proof={['SELECT','EDIT','SAVE']}/></Sequence>
  <Sequence from={editorSync.scenes.direct!.from} durationInFrames={editorSync.scenes.direct!.durationFrames}><EditorScene action="direct" title="MANIPULAÇÃO VISUAL DIRETA" subtitle="O cursor move o componente e o inspector acompanha o estado." proof={['POINTER','MOVE','STATE']}/></Sequence>
  <Sequence from={editorSync.scenes.transform!.from} durationInFrames={editorSync.scenes.transform!.durationFrames}><EditorScene action="transform" title="MOVER E REDIMENSIONAR" subtitle="O canvas vira o foco; posição e escala mudam diante do viewer." proof={['DRAG','SCALE','INSPECT']}/></Sequence>
  <Sequence from={editorSync.scenes.rotate!.from} durationInFrames={editorSync.scenes.rotate!.durationFrames}><EditorScene action="rotate" title="ROTACIONAR COM SNAP" subtitle="O ângulo converge para um estado previsível e verificável." proof={['ROTATE','SNAP','15°']}/></Sequence>
  <Sequence from={editorSync.scenes.align!.from} durationInFrames={editorSync.scenes.align!.durationFrames}><EditorScene action="align" title="ALINHAMENTO É FEEDBACK VISUAL" subtitle="Guias e eixos ocupam a cena quando o objeto encontra o centro." proof={['GUIDE X','GUIDE Y','CENTER']}/></Sequence>
  <Sequence from={editorSync.scenes.nudge!.from} durationInFrames={editorSync.scenes.nudge!.durationFrames}><EditorScene action="nudge" title="NUDGE CORRIGE PRECISÃO" subtitle="Ajustes pequenos aparecem como valor, deslocamento e resultado." proof={['KEYBOARD','+8PX','PRECISE']}/></Sequence>
  <Sequence from={editorSync.scenes['persist-a']!.from} durationInFrames={editorSync.scenes['persist-a']!.durationFrames}><EditorScene action="persistA" title="LAYOUT VIRA DADO" subtitle="O estado visual deixa o canvas e entra num objeto persistido." proof={['CANVAS','JSON','SAVED']}/></Sequence>
  <Sequence from={editorSync.scenes['persist-b']!.from} durationInFrames={editorSync.scenes['persist-b']!.durationFrames}><EditorScene action="persistB" title="TECHNICAL LESSON SPEC GUARDA O ESTADO" subtitle="Preview e especificação ficam lado a lado para provar persistência." proof={['SPEC','PERSIST','REOPEN']}/></Sequence>
  <Sequence from={editorSync.scenes.timeline!.from} durationInFrames={editorSync.scenes.timeline!.durationFrames}><EditorScene action="timeline" title="CENAS E MOTION EM TRILHAS" subtitle="O playhead percorre uma timeline que ocupa o quadro inteiro." proof={['SCENES','MOTION','PLAYHEAD']}/></Sequence>
  <Sequence from={editorSync.scenes.tracks!.from} durationInFrames={editorSync.scenes.tracks!.durationFrames}><EditorScene action="tracks" title="NARRAÇÃO E ASSETS TÊM TRILHAS PRÓPRIAS" subtitle="Waveform, playhead e estados de vínculo tornam a sincronização visível." proof={['NARRATION','ASSETS','SYNC']}/></Sequence>
  <CaptionOverlay cues={cues}/>
</AbsoluteFill>;
