import {useMemo,useState} from 'react';
import type {TechnicalLessonSpec} from '../templates/types';
import {getTechnicalLessonDuration} from '../templates/types';
import {AssetPicker} from './AssetPicker';
import {MotionPicker} from './MotionPicker';
import {reorderScene,serializeLesson,updateSceneDuration} from './lessonOps';

export type LessonAuthoringPanelProps={
  spec:TechnicalLessonSpec;
  onChange?:(spec:TechnicalLessonSpec)=>void;
};

export const LessonAuthoringPanel=({spec,onChange}:LessonAuthoringPanelProps)=>{
  const [selectedScene,setSelectedScene]=useState(0);
  const [motionPreset,setMotionPreset]=useState('fade');
  const json=useMemo(()=>serializeLesson(spec),[spec]);
  const duration=getTechnicalLessonDuration(spec);

  const setSpec=(next:TechnicalLessonSpec)=>onChange?.(next);
  const move=(delta:number)=>{
    const target=selectedScene+delta;
    const next=reorderScene(spec,selectedScene,target);
    if(next!==spec){
      setSpec(next);
      setSelectedScene(target);
    }
  };

  return <section className="lesson-authoring-panel">
    <header>
      <strong>{spec.lesson.title}</strong>
      <span>{spec.scenes.length} cenas · {duration} frames</span>
    </header>

    <div style={{display:'grid',gap:8,marginTop:12}}>
      {spec.scenes.map((scene,index)=><button key={scene.id} type="button" onClick={()=>setSelectedScene(index)} aria-pressed={index===selectedScene}>
        {String(index+1).padStart(2,'0')} · {scene.componentId} · {scene.durationFrames}f
      </button>)}
    </div>

    {spec.scenes[selectedScene]?<div style={{display:'grid',gap:10,marginTop:14}}>
      <label>Duration frames
        <input type="number" min={1} value={spec.scenes[selectedScene].durationFrames}
          onChange={(event)=>setSpec(updateSceneDuration(spec,selectedScene,Number(event.target.value)))}/>
      </label>
      <div style={{display:'flex',gap:8}}>
        <button type="button" disabled={selectedScene===0} onClick={()=>move(-1)}>↑ Mover</button>
        <button type="button" disabled={selectedScene===spec.scenes.length-1} onClick={()=>move(1)}>↓ Mover</button>
      </div>
      <MotionPicker value={motionPreset} onChange={setMotionPreset}/>
    </div>:null}

    <div style={{marginTop:16}}>
      <AssetPicker selected={spec.assets} onChange={(assets)=>setSpec({...spec,assets})}/>
    </div>

    <label style={{display:'grid',gap:6,marginTop:16}}>JSON / VideoSpec-like payload
      <textarea readOnly value={json} rows={18}/>
    </label>
  </section>;
};
