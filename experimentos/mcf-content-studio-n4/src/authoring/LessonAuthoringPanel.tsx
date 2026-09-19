import {useEffect,useMemo,useState} from 'react';
import type {TechnicalLessonSpec} from '../templates/types';
import {getTechnicalLessonDuration} from '../templates/types';
import type {MotionPresetId} from '../motion/presets';
import {labEntries} from '../registry/registry';
import {PropEditor} from '../lab/PropEditor';
import {AssetPicker} from './AssetPicker';
import {MotionPicker} from './MotionPicker';
import {reorderScene,serializeLesson,updateSceneComponent,updateSceneDuration,updateSceneMotion,updateSceneProps} from './lessonOps';

export type LessonAuthoringPanelProps={
  spec:TechnicalLessonSpec;
  onChange?:(spec:TechnicalLessonSpec)=>void;
};

const looksLikeLesson=(value:unknown):value is TechnicalLessonSpec=>{
  if(!value||typeof value!=='object') return false;
  const candidate=value as Partial<TechnicalLessonSpec>;
  return !!candidate.lesson&&Array.isArray(candidate.scenes)&&Array.isArray(candidate.chapters)&&!!candidate.narration&&!!candidate.visuals&&!!candidate.theme&&Array.isArray(candidate.assets)&&!!candidate.timings;
};

export const LessonAuthoringPanel=({spec,onChange}:LessonAuthoringPanelProps)=>{
  const [selectedScene,setSelectedScene]=useState(0);
  const json=useMemo(()=>serializeLesson(spec),[spec]);
  const [draftJson,setDraftJson]=useState(json);
  const [jsonError,setJsonError]=useState('');
  const duration=getTechnicalLessonDuration(spec);
  const scene=spec.scenes[selectedScene];
  const sceneEntry=scene?labEntries.find((entry)=>entry.id===scene.componentId):undefined;
  const sceneProps=sceneEntry&&scene?{...sceneEntry.defaultProps,...scene.props}:scene?.props??{};

  useEffect(()=>setDraftJson(json),[json]);

  const setSpec=(next:TechnicalLessonSpec)=>onChange?.(next);
  const move=(delta:number)=>{
    const target=selectedScene+delta;
    const next=reorderScene(spec,selectedScene,target);
    if(next!==spec){
      setSpec(next);
      setSelectedScene(target);
    }
  };

  const applyJson=()=>{
    try{
      const parsed:unknown=JSON.parse(draftJson);
      if(!looksLikeLesson(parsed)) throw new Error('Payload não corresponde ao TechnicalLessonSpec.');
      setSpec(parsed);
      setSelectedScene(0);
      setJsonError('');
    }catch(error){
      setJsonError(error instanceof Error?error.message:'JSON inválido.');
    }
  };

  return <section className="lesson-authoring-panel" aria-label="Lesson authoring">
    <header>
      <strong>{spec.lesson.title}</strong>
      <span>{spec.scenes.length} cenas · {duration} frames</span>
    </header>

    <div className="lesson-template-inputs">
      <label>Título da aula
        <input aria-label="Título da aula" value={spec.lesson.title}
          onChange={(event)=>setSpec({...spec,lesson:{...spec.lesson,title:event.target.value}})}/>
      </label>
      <label>Resumo da aula
        <textarea aria-label="Resumo da aula" value={spec.lesson.summary??''}
          onChange={(event)=>setSpec({...spec,lesson:{...spec.lesson,summary:event.target.value}})}/>
      </label>
      <label>Capítulos
        <textarea aria-label="Capítulos da aula" value={spec.chapters.join('\n')}
          onChange={(event)=>setSpec({...spec,chapters:event.target.value.split('\n').map((item)=>item.trim()).filter(Boolean)})}/>
      </label>
      <div className="lesson-template-grid">
        <label>Background
          <input aria-label="Background da aula" value={spec.theme.background}
            onChange={(event)=>setSpec({...spec,theme:{...spec.theme,background:event.target.value}})}/>
        </label>
        <label>Accent
          <input aria-label="Accent da aula" value={spec.theme.accent}
            onChange={(event)=>setSpec({...spec,theme:{...spec.theme,accent:event.target.value}})}/>
        </label>
        <label>FPS
          <input aria-label="FPS da aula" type="number" min={1} max={120} value={spec.timings.fps}
            onChange={(event)=>setSpec({...spec,timings:{...spec.timings,fps:Math.max(1,Math.min(120,Number(event.target.value)||30))}})}/>
        </label>
      </div>
    </div>

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
        <select value={scene.componentId} onChange={(event)=>{
          const nextEntry=labEntries.find((entry)=>entry.id===event.target.value);
          if(nextEntry) setSpec(updateSceneComponent(spec,selectedScene,nextEntry.id,nextEntry.defaultProps));
        }}>
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
      {sceneEntry?<div className="lesson-scene-props">
        <strong>Props editáveis da cena</strong>
        <PropEditor props={sceneProps} editableProps={sceneEntry.editableProps}
          onChange={(key,value)=>setSpec(updateSceneProps(spec,selectedScene,{[key]:value}))}/>
      </div>:null}
    </div>:null}

    <div className="lesson-assets">
      <AssetPicker selected={spec.assets} onChange={(assets)=>setSpec({...spec,assets})}/>
    </div>

    <label className="lesson-export">Lesson JSON
      <textarea aria-label="Lesson JSON export" value={draftJson} onChange={(event)=>setDraftJson(event.target.value)} rows={18}/>
    </label>
    <button className="lesson-apply-json" type="button" onClick={applyJson}>Aplicar JSON ao preview</button>
    {jsonError?<div className="lesson-json-error" role="alert">{jsonError}</div>:null}
  </section>;
};
