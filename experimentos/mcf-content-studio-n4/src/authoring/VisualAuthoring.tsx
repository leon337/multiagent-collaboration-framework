import {useRef} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import type {SceneLayout,TechnicalLessonSpec} from '../templates/types';

export const DEFAULT_SCENE_LAYOUT:SceneLayout={x:0,y:0,scale:1,rotationDeg:0,snap:true};
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
export const normalizeSceneLayout=(value:Partial<SceneLayout>={}):SceneLayout=>({
  x:clamp(value.x??0,-0.45,0.45),y:clamp(value.y??0,-0.45,0.45),
  scale:clamp(value.scale??1,0.5,1.5),rotationDeg:clamp(value.rotationDeg??0,-180,180),snap:value.snap??true,
});
export const snapSceneLayout=(value:SceneLayout):SceneLayout=>{
  if(!value.snap) return normalizeSceneLayout(value);
  const step=(n:number,s:number)=>Math.round(n/s)*s;
  return normalizeSceneLayout({...value,x:step(value.x,.05),y:step(value.y,.05),scale:step(value.scale,.05),rotationDeg:step(value.rotationDeg,15)});
};

type Gesture={mode:'drag'|'resize'|'rotate';startX:number;startY:number;start:SceneLayout;pointerId:number};

export const SceneCanvasEditor=({aspect,layout,onChange}:{aspect:'9:16'|'16:9';layout?:SceneLayout;onChange:(next:SceneLayout)=>void})=>{
  const value=normalizeSceneLayout(layout);
  const gesture=useRef<Gesture|null>(null);
  const vertical=aspect==='9:16';
  const begin=(mode:Gesture['mode'])=>(event:ReactPointerEvent<HTMLDivElement>)=>{
    gesture.current={mode,startX:event.clientX,startY:event.clientY,start:value,pointerId:event.pointerId};
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const move=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const g=gesture.current; if(!g||g.pointerId!==event.pointerId) return;
    const host=event.currentTarget.closest('.scene-canvas') as HTMLElement|null;
    const rect=host?.getBoundingClientRect(); if(!rect) return;
    const dx=event.clientX-g.startX,dy=event.clientY-g.startY;
    let next=g.start;
    if(g.mode==='drag') next={...g.start,x:g.start.x+dx/rect.width,y:g.start.y+dy/rect.height};
    if(g.mode==='resize') next={...g.start,scale:g.start.scale+(dx+dy)/(vertical?520:700)};
    if(g.mode==='rotate') next={...g.start,rotationDeg:g.start.rotationDeg+dx*.7};
    onChange(snapSceneLayout(normalizeSceneLayout(next)));
  };
  const end=(event:ReactPointerEvent<HTMLDivElement>)=>{if(gesture.current?.pointerId===event.pointerId) gesture.current=null;};
  return <div className="scene-layout-editor">
    <div className={`scene-canvas ${vertical?'portrait':'landscape'}`}>
      <div className="scene-safe-area"/>
      <div className="scene-object" style={{transform:`translate(calc(-50% + ${value.x*100}%),calc(-50% + ${value.y*100}%)) scale(${value.scale}) rotate(${value.rotationDeg}deg)`}}
        onPointerDown={begin('drag')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <span>SCENE</span>
        <div className="scene-resize-handle" title="Resize" onPointerDown={(e)=>{e.stopPropagation();begin('resize')(e);}} onPointerMove={move} onPointerUp={end}/>
        <div className="scene-rotate-handle" title="Rotate" onPointerDown={(e)=>{e.stopPropagation();begin('rotate')(e);}} onPointerMove={move} onPointerUp={end}>↻</div>
      </div>
    </div>
    <div className="scene-layout-controls">
      <label><input type="checkbox" checked={value.snap} onChange={(e)=>onChange({...value,snap:e.target.checked})}/> snap</label>
      <button type="button" onClick={()=>onChange(DEFAULT_SCENE_LAYOUT)}>Reset</button>
      <output>x {value.x.toFixed(2)} · y {value.y.toFixed(2)} · scale {value.scale.toFixed(2)} · rot {Math.round(value.rotationDeg)}°</output>
    </div>
  </div>;
};

export const MultiTrackTimeline=({spec,selectedScene,onSelect}:{spec:TechnicalLessonSpec;selectedScene:number;onSelect:(index:number)=>void})=>{
  const total=spec.scenes.reduce((sum,scene)=>sum+scene.durationFrames,0);
  let cursor=0;
  const scenePositions=spec.scenes.map((scene,index)=>{const from=cursor;cursor+=scene.durationFrames;return {scene,index,left:from/total*100,width:scene.durationFrames/total*100};});
  const cuePositions=spec.narration.cues.map((cue,index)=>({cue,index,left:cue.from/total*100,width:(cue.to-cue.from)/total*100}));
  return <div className="multi-track" aria-label="Multi-track timeline">
    <div className="track-row"><span>Scenes</span><div className="track-lane">{scenePositions.map(({scene,index,left,width})=><button type="button" key={scene.id} className={index===selectedScene?'active':''} onClick={()=>onSelect(index)} style={{left:`${left}%`,width:`${width}%`}} title={scene.componentId}>{index+1}</button>)}</div></div>
    <div className="track-row"><span>Motion</span><div className="track-lane">{scenePositions.filter(x=>x.scene.motionPreset).map(({scene,index,left,width})=><div key={scene.id} className="track-motion" style={{left:`${left}%`,width:`${width}%`}} title={scene.motionPreset}>{scene.motionPreset}</div>)}</div></div>
    <div className="track-row"><span>Narration</span><div className="track-lane">{cuePositions.map(({cue,index,left,width})=><div key={index} className="track-narration" style={{left:`${left}%`,width:`${width}%`}} title={cue.text}/>)}</div></div>
    <div className="track-row"><span>Assets</span><div className="track-assets">{spec.assets.map(asset=><span key={asset}>{asset}</span>)}</div></div>
  </div>;
};
