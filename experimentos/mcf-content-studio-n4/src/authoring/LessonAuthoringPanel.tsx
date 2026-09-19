import {useMemo,useState} from 'react';
import type {TechnicalLessonSpec} from '../templates/types';
import {getTechnicalLessonDuration} from '../templates/types';
import type {MotionPresetId} from '../motion/presets';
import {labEntries} from '../registry/registry';
import {AssetPicker} from './AssetPicker';
import {MotionPicker} from './MotionPicker';
import {reorderScene,serializeLesson,updateSceneComponent,updateSceneDuration,updateSceneMotion} from './lessonOps';

export type LessonAuthoringPanelProps={
  spec:TechnicalLessonSpec;
  onChange?:(spec:TechnicalLessonSpec)=>void;
};

export const LessonAuthoringPanel=({spec,onChange}:LessonAuthoringPanelProps)=>{
  const [selectedScene,setSelectedScene]=useState(0);
  const json=useMemo(()=>serializeLesson(spec),[spec]);
  const duration=getTechnicalLessonDuration(spec);
  const scene=spec.scenes[selectedScene];

  const setSpec=(next:TechnicalLessonSpec)=>onChange?.(next);
  const move=(delta:number)=>{
    const target=selectedScene+delta;
    const next=reorderScene(spec,selectedScene,target);
    if(next!==spec){
      setSpec(next);
      setSelectedScene(target);
    }
  };

  return <section className="lesson-authoring-panel" aria-label="Lesson authoring">
    <header>
      <strong>{spec.lesson.title}</strong>
      <span>{spec.scenes.length} cenas · {duration} frames</span>
    </header>

    <div className="lesson-timeline" aria-label="Timeline da aula">
      {spec.scenes.map((item,index)=><button key={item.id} type="button"
        style={{flexGrow:item.durationFrames}} className={index===selectedScene?'active':''}
        onClick={()=>setSelectedScene(index)} title={item.componentId}>
        {index+1}
      </button>)}
    </div>

    <div className="lesson-scene-list">
      {spec.scenes.map((item,index)=><button key={item.id} type="button" onClick={()=>setSelectedScene(index)} aria-pressed={index===selectedScene}>
        {String(index+1).padStart(2,'0')} · {item.componentId} · {item.durationFrames}f
      </button>)}
    </div>

    {scene?<div className="lesson-scene-editor">
      <label>Componente
        <select value={scene.componentId} onChange={(event)=>setSpec(updateSceneComponent(spec,selectedScene,event.target.value))}>
          {labEntries.filter((entry)=>entry.status==='APPROVED').map((entry)=><option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
      </label>
      <label>Duração em frames
        <input aria-label="Duração em frames" type="number" min={1} value={scene.durationFrames}
          onChange={(event)=>setSpec(updateSceneDuration(spec,selectedScene,Number(event.target.value)))}/>
      </label>
      <div className="lesson-reorder">
        <button type="button" disabled={selectedScene===0} onClick={()=>move(-1)}>↑ Mover</button>
        <button type="button" disabled={selectedScene===spec.scenes.length-1} onClick={()=>move(1)}>↓ Mover</button>
      </div>
      <MotionPicker value={scene.motionPreset??'fade'} onChange={(id)=>setSpec(updateSceneMotion(spec,selectedScene,id as MotionPresetId))}/>
    </div>:null}

    <div className="lesson-assets">
      <AssetPicker selected={spec.assets} onChange={(assets)=>setSpec({...spec,assets})}/>
    </div>

    <label className="lesson-export">JSON / VideoSpec-like payload
      <textarea aria-label="Lesson JSON export" readOnly value={json} rows={18}/>
    </label>
  </section>;
};
