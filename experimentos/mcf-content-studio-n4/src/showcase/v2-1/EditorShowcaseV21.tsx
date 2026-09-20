import {AbsoluteFill,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {editorSync} from '../synced';
import {Chip,Panel,Stage,StatusDot,TimelineTrack,reveal,v21} from './shared';

const cues=editorSync.cues;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

type Action='intro'|'direct'|'transform'|'rotate'|'align'|'nudge'|'persistA'|'persistB'|'timeline'|'tracks';

const EditorUi=({action}:{action:Action})=>{
  const f=useCurrentFrame();
  const p=reveal(f,6,30);
  const move=action==='direct'?interpolate(f,[12,60],[0,1],clamp):1;
  const scale=action==='transform'?interpolate(f,[8,62],[1,1.28],clamp):action==='intro'?1:1.18;
  const rot=action==='rotate'?interpolate(f,[8,56],[0,14],clamp):action==='intro'||action==='direct'||action==='transform'?0:12;
  const align=action==='align'?interpolate(f,[12,48],[0,1],clamp):action==='nudge'||action==='persistA'||action==='persistB'||action==='timeline'||action==='tracks'?1:0;
  const nudge=action==='nudge'?Math.round(interpolate(f,[10,56],[0,8],clamp)):action==='persistA'||action==='persistB'||action==='timeline'||action==='tracks'?8:0;
  const timelinePlay=action==='timeline'||action==='tracks'?interpolate(f,[0,Math.max(1,80)],[0,1],clamp):.42;

  const x=action==='direct'?interpolate(move,[0,1],[0,52],clamp):52+nudge;
  const y=action==='transform'?interpolate(f,[8,62],[0,-34],clamp):-34;
  const layoutText=['layout: {','  x: '+(52+nudge)+', y: -34,','  scale: '+scale.toFixed(2)+',','  rotationDeg: '+rot.toFixed(0),' }'].join('\n');

  return <Panel style={{height:'100%',padding:0,overflow:'hidden',display:'grid',gridTemplateRows:'66px 1fr 270px',background:'#f8fbff'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 18px',borderBottom:'1px solid '+v21.line,background:'rgba(255,255,255,.9)'}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <Chip>VIDEO LAB</Chip><span style={{fontSize:16,fontWeight:850,color:v21.muted}}>showcase-03.lesson.json</span>
      </div>
      <div style={{display:'flex',gap:8}}>
        {['↶','↷','100%','PREVIEW'].map(x=><span key={x} style={{padding:'8px 11px',borderRadius:12,border:'1px solid '+v21.line,background:'white',fontSize:14,fontWeight:800}}>{x}</span>)}
      </div>
    </div>

    <div style={{minHeight:0,display:'grid',gridTemplateColumns:'180px 1fr 220px',gap:12,padding:12}}>
      <Panel style={{padding:14,overflow:'hidden'}}>
        <div style={{fontSize:13,letterSpacing:2.4,fontWeight:900,color:v21.muted}}>COMPONENTS</div>
        {['Title','Diagram','Browser','Quiz','StickRig','SoundCue'].map((item,i)=><div key={item} style={{marginTop:10,padding:'12px 10px',borderRadius:13,background:i===2?'#eaf0ff':'#f8fbff',border:'1px solid '+(i===2?'#afc4ff':v21.line),fontSize:15,fontWeight:i===2?900:700,color:i===2?v21.blue:v21.ink}}>{item}</div>)}
      </Panel>

      <div style={{position:'relative',overflow:'hidden',borderRadius:26,border:'1px solid #c7d9ff',background:'linear-gradient(145deg,#ffffff,#eaf2ff)',boxShadow:'inset 0 0 0 1px rgba(255,255,255,.8)'}}>
        <div style={{position:'absolute',inset:24,border:'1px dashed #b6c9ef',borderRadius:18}}/>
        <div style={{position:'absolute',left:'50%',top:'48%',width:'58%',height:'26%',transform:\`translate(calc(-50% + \${x}px),calc(-50% + \${y}px)) scale(\${scale}) rotate(\${rot}deg)\`,transformOrigin:'center',border:'4px solid '+v21.blue,borderRadius:24,background:'linear-gradient(145deg,#ffffff,#edf4ff)',boxShadow:'0 26px 60px rgba(36,92,255,.20)',display:'grid',placeItems:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:950}}>BROWSER WINDOW</div>
            <div style={{fontSize:14,color:v21.muted,marginTop:5}}>Review Queue · reusable component</div>
          </div>
          <span style={{position:'absolute',left:-10,top:'50%',width:18,height:18,borderRadius:99,background:v21.blue,border:'3px solid white'}}/>
          <span style={{position:'absolute',right:-10,top:'50%',width:18,height:18,borderRadius:99,background:v21.blue,border:'3px solid white'}}/>
          <span style={{position:'absolute',left:'50%',top:-10,width:18,height:18,borderRadius:99,background:v21.blue,border:'3px solid white'}}/>
          <span style={{position:'absolute',left:'50%',bottom:-10,width:18,height:18,borderRadius:99,background:v21.blue,border:'3px solid white'}}/>
        </div>
        <div style={{position:'absolute',left:\`\${action==='direct'?20+move*48:action==='transform'?62:action==='rotate'?66:action==='align'?42:48}%\`,top:\`\${action==='direct'?62-move*22:action==='transform'?40:action==='rotate'?34:action==='align'?48:52}%\`,fontSize:38,filter:'drop-shadow(0 6px 10px rgba(20,40,90,.22))',opacity:p}}>☝</div>
        {align>0?<><div style={{position:'absolute',left:'50%',top:24,bottom:24,width:2,background:'#ff5b8a',opacity:.6*align}}/><div style={{position:'absolute',top:'48%',left:24,right:24,height:2,background:'#ff5b8a',opacity:.6*align}}/></>:null}
        <div style={{position:'absolute',left:18,bottom:18,display:'flex',gap:8}}>
          <Chip>{action==='rotate'?'snap 15°':action==='align'?'center guides':action==='nudge'?('nudge +'+nudge+'px'):'selected'}</Chip>
        </div>
      </div>

      <Panel style={{padding:14}}>
        <div style={{fontSize:13,letterSpacing:2.4,fontWeight:900,color:v21.muted}}>INSPECTOR</div>
        {[
          ['x',String(52+nudge)],['y',String(-34)],['scale',scale.toFixed(2)],['rotation',rot.toFixed(0)+'°']
        ].map(([a,b])=><div key={a} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #e8efff',fontSize:15}}><span style={{color:v21.muted}}>{a}</span><strong>{b}</strong></div>)}
        <div style={{marginTop:16}}><StatusDot label={action==='persistA'||action==='persistB'||action==='timeline'||action==='tracks'?'saved':'editing'} ok={true}/></div>
        {action==='persistA'||action==='persistB'?<div style={{marginTop:16,padding:12,borderRadius:14,background:'#13213d',color:'#dce9ff',fontFamily:'ui-monospace,monospace',fontSize:13,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{layoutText}</div>:null}
      </Panel>
    </div>

    <div style={{padding:'12px 16px 16px',borderTop:'1px solid '+v21.line,background:'rgba(255,255,255,.9)',display:'grid',gap:11}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:13,letterSpacing:2.2,fontWeight:900,color:v21.muted}}>MULTI-TRACK TIMELINE</div>
        <div style={{display:'flex',gap:7}}><Chip>30fps</Chip><Chip tone="green">autosaved</Chip></div>
      </div>
      <TimelineTrack label="Scenes" segments={[1.2,.8,1.1,.9]} play={timelinePlay}/>
      <TimelineTrack label="Motion" segments={[.6,1.4,.7,1.3]} accent={v21.violet} play={timelinePlay}/>
      <TimelineTrack label="Narration" segments={[1,1,1,1]} accent={v21.green} play={timelinePlay}/>
      <TimelineTrack label="Assets" segments={[.7,.9,1.5,.8]} accent={v21.amber} play={timelinePlay}/>
    </div>
  </Panel>;
};

const EditorScene=({action,title,subtitle,proof}:{action:Action;title:string;subtitle:string;proof:[string,string,string]})=>
  <Stage kicker="N4 SHOWCASE 03 · EDITOR" title={title} subtitle={subtitle} proof={proof} compact>
    <EditorUi action={action}/>
  </Stage>;

export const EditorShowcaseV21=()=> <AbsoluteFill>
  <Sequence from={editorSync.scenes.intro.from} durationInFrames={editorSync.scenes.intro.durationFrames}><EditorScene action="intro" title="O VIDEO LAB É UMA INTERFACE DE EDIÇÃO" subtitle="O objeto, a ação e o estado salvo ficam visíveis no mesmo viewport." proof={['SELECT','EDIT','SAVE']}/></Sequence>
  <Sequence from={editorSync.scenes.direct.from} durationInFrames={editorSync.scenes.direct.durationFrames}><EditorScene action="direct" title="MANIPULAÇÃO VISUAL DIRETA" subtitle="O cursor seleciona e move o componente dentro do canvas." proof={['POINTER','MOVE','STATE']}/></Sequence>
  <Sequence from={editorSync.scenes.transform.from} durationInFrames={editorSync.scenes.transform.durationFrames}><EditorScene action="transform" title="MOVER E REDIMENSIONAR" subtitle="Transformações atualizam canvas e inspector ao mesmo tempo." proof={['DRAG','SCALE','INSPECT']}/></Sequence>
  <Sequence from={editorSync.scenes.rotate.from} durationInFrames={editorSync.scenes.rotate.durationFrames}><EditorScene action="rotate" title="ROTACIONAR COM SNAP" subtitle="O ângulo converge para um estado previsível em vez de ficar solto." proof={['ROTATE','SNAP','15°']}/></Sequence>
  <Sequence from={editorSync.scenes.align.from} durationInFrames={editorSync.scenes.align.durationFrames}><EditorScene action="align" title="ALINHAMENTO É FEEDBACK VISUAL" subtitle="Guias aparecem quando o objeto cruza os eixos do canvas." proof={['GUIDE X','GUIDE Y','CENTER']}/></Sequence>
  <Sequence from={editorSync.scenes.nudge.from} durationInFrames={editorSync.scenes.nudge.durationFrames}><EditorScene action="nudge" title="NUDGE CORRIGE PRECISÃO" subtitle="Ajustes pequenos mudam o valor e preservam a intenção visual." proof={['KEYBOARD','+8PX','PRECISE']}/></Sequence>
  <Sequence from={editorSync.scenes['persist-a'].from} durationInFrames={editorSync.scenes['persist-a'].durationFrames}><EditorScene action="persistA" title="LAYOUT VIRA DADO" subtitle="A posição deixa de existir só no canvas e entra no documento." proof={['CANVAS','JSON','SAVED']}/></Sequence>
  <Sequence from={editorSync.scenes['persist-b'].from} durationInFrames={editorSync.scenes['persist-b'].durationFrames}><EditorScene action="persistB" title="TECHNICAL LESSON SPEC GUARDA O ESTADO" subtitle="A mesma cena pode ser reaberta sem reconstruir o layout." proof={['SPEC','PERSIST','REOPEN']}/></Sequence>
  <Sequence from={editorSync.scenes.timeline.from} durationInFrames={editorSync.scenes.timeline.durationFrames}><EditorScene action="timeline" title="CENAS E MOTION EM TRILHAS" subtitle="A timeline torna a montagem editável e inspecionável." proof={['SCENES','MOTION','PLAYHEAD']}/></Sequence>
  <Sequence from={editorSync.scenes.tracks.from} durationInFrames={editorSync.scenes.tracks.durationFrames}><EditorScene action="tracks" title="NARRAÇÃO E ASSETS TÊM TRILHAS PRÓPRIAS" subtitle="O editor mostra a relação entre visual, motion, voz e mídia." proof={['NARRATION','ASSETS','SYNC']}/></Sequence>
  <CaptionOverlay cues={cues}/>
</AbsoluteFill>;
