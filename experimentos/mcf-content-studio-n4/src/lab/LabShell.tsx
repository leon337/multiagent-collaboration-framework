import {useEffect,useMemo,useState} from 'react';
import {Player} from '@remotion/player';
import type {LabAspect,LabEntry,LabTemplate} from './types';
import {LabErrorBoundary} from './LabErrorBoundary';
import {PropEditor} from './PropEditor';
import {LessonAuthoringPanel} from '../authoring/LessonAuthoringPanel';
import {TechnicalLessonTemplate} from '../templates/TechnicalLessonTemplate';
import {getTechnicalLessonDuration,type TechnicalLessonSpec} from '../templates/types';
import initialLessonData from '../templates/runtime-agentico-data-demo.lesson.json';
import './lab.css';

type Props={entries:LabEntry[];templates:LabTemplate[]};
type EditableFilter='all'|'editable'|'fixed';
type LabMode='component'|'lesson';

const initialLesson=initialLessonData as TechnicalLessonSpec;

export const LabShell=({entries,templates}:Props)=>{
  const [mode,setMode]=useState<LabMode>('component');
  const [selectedId,setSelectedId]=useState(entries[0]?.id??'');
  const [aspect,setAspect]=useState<LabAspect>('9:16');
  const [reducedMotion,setReducedMotion]=useState(false);
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('all');
  const [status,setStatus]=useState('APPROVED');
  const [intent,setIntent]=useState('all');
  const [editable,setEditable]=useState<EditableFilter>('all');
  const [templateId,setTemplateId]=useState('all');
  const [overrides,setOverrides]=useState<Record<string,Record<string,unknown>>>({});
  const [stillCommand,setStillCommand]=useState('');
  const [lessonSpec,setLessonSpec]=useState<TechnicalLessonSpec>(initialLesson);

  const template=templates.find((item)=>item.id===templateId);
  const categories=useMemo(()=>['all',...Array.from(new Set(entries.map((entry)=>entry.category))).sort()],[entries]);
  const intents=useMemo(()=>['all',...Array.from(new Set(entries.flatMap((entry)=>entry.intents))).sort()],[entries]);

  const filtered=useMemo(()=>{
    const normalized=query.trim().toLowerCase();
    return entries.filter((entry)=>{
      const queryMatch=!normalized||
        entry.id.toLowerCase().includes(normalized)||
        entry.name.toLowerCase().includes(normalized)||
        entry.category.toLowerCase().includes(normalized)||
        entry.tags.some((tag)=>tag.toLowerCase().includes(normalized))||
        entry.intents.some((item)=>item.toLowerCase().includes(normalized));
      const categoryMatch=category==='all'||entry.category===category;
      const statusMatch=status==='all'||entry.status===status;
      const intentMatch=intent==='all'||entry.intents.includes(intent);
      const aspectMatch=entry.supportedAspects.includes(aspect);
      const editableMatch=editable==='all'||(editable==='editable'?entry.editableProps.length>0:entry.editableProps.length===0);
      const templateMatch=!template||template.componentIds.includes(entry.id);
      return queryMatch&&categoryMatch&&statusMatch&&intentMatch&&aspectMatch&&editableMatch&&templateMatch;
    });
  },[entries,query,category,status,intent,aspect,editable,template]);

  useEffect(()=>{
    if(!filtered.some((entry)=>entry.id===selectedId)&&filtered[0]) setSelectedId(filtered[0].id);
  },[filtered,selectedId]);

  const selected=entries.find((entry)=>entry.id===selectedId)??filtered[0]??entries[0];
  const inputProps=useMemo(()=>{
    if(!selected) return {};
    return {...selected.defaultProps,...(overrides[selected.id]??{}),aspect,reducedMotion};
  },[selected,overrides,aspect,reducedMotion]);

  const setLessonVisual=(nextAspect:LabAspect,nextReducedMotion=reducedMotion)=>{
    setAspect(nextAspect);
    setLessonSpec((current)=>({...current,visuals:{...current.visuals,aspect:nextAspect,reducedMotion:nextReducedMotion}}));
  };
  const setLessonReducedMotion=(value:boolean)=>{
    setReducedMotion(value);
    setLessonSpec((current)=>({...current,visuals:{...current.visuals,reducedMotion:value}}));
  };

  if(!selected) return <main className="lab-empty">Nenhum componente registrado.</main>;

  const vertical=aspect==='9:16';
  const prepareStill=()=>{
    const composition=aspect==='9:16'?'RegistryComponentQaPortrait':'RegistryComponentQaLandscape';
    const props=JSON.stringify({componentId:selected.id,reducedMotion});
    const frame=Math.max(1,Math.floor(selected.durationInFrames/2));
    setStillCommand(`pnpm exec remotion still src/remotion/index.ts ${composition} out/${selected.id}-${aspect.replace(':','x')}.png --frame=${frame} --props='${props}'`);
  };

  return <main className="lab-shell">
    <aside className="lab-sidebar">
      <div className="lab-brand">MCF Video Lab <span>N4</span></div>
      <div className="lab-mode-switch" aria-label="Modo do Video Lab">
        <button className={mode==='component'?'active':''} onClick={()=>setMode('component')}>Componentes</button>
        <button className={mode==='lesson'?'active':''} onClick={()=>setMode('lesson')}>Aula</button>
      </div>

      {mode==='component'?<>
        <input className="lab-search" placeholder="Buscar componente…" aria-label="Buscar componente" value={query} onChange={(event)=>setQuery(event.target.value)}/>
        <div className="lab-filter-grid">
          <label>Categoria<select value={category} onChange={(event)=>setCategory(event.target.value)}>{categories.map((item)=><option key={item}>{item}</option>)}</select></label>
          <label>Status<select value={status} onChange={(event)=>setStatus(event.target.value)}><option>all</option><option>APPROVED</option><option>ADAPTED</option></select></label>
          <label>Intenção<select value={intent} onChange={(event)=>setIntent(event.target.value)}>{intents.map((item)=><option key={item} value={item}>{item}</option>)}</select></label>
          <label>Editabilidade<select value={editable} onChange={(event)=>setEditable(event.target.value as EditableFilter)}><option value="all">all</option><option value="editable">editable</option><option value="fixed">fixed</option></select></label>
          <label>Template<select value={templateId} onChange={(event)=>setTemplateId(event.target.value)}><option value="all">all</option>{templates.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div>
        {template?<p className="lab-template-purpose">{template.purpose}</p>:null}
        <div className="lab-count">{filtered.length} de {entries.length} componentes</div>
        <nav aria-label="Componentes N4">
          {filtered.map((entry)=><button className={entry.id===selected.id?'active':''} key={entry.id} onClick={()=>setSelectedId(entry.id)}>
            <strong>{entry.name}</strong><small>{entry.category} • {entry.status}</small>
          </button>)}
          {filtered.length===0?<div className="lab-empty-results">Nenhum resultado.</div>:null}
        </nav>
      </>:<div className="lab-lesson-summary">
        <div className="lab-count">LESSON AUTHORING</div>
        <strong>{lessonSpec.lesson.title}</strong>
        <p>{lessonSpec.scenes.length} cenas • {getTechnicalLessonDuration(lessonSpec)} frames</p>
        <p>Engine genérica: nenhuma composição TSX específica da aula.</p>
      </div>}
    </aside>

    <section className="lab-stage">
      <header>
        <div>
          <h1>{mode==='component'?selected.name:lessonSpec.lesson.title}</h1>
          <p>{mode==='component'? `${selected.id} • ${selected.status}` : 'TechnicalLessonTemplate • data-driven'}</p>
        </div>
        <div className="lab-controls">
          <button className={aspect==='9:16'?'active':''} onClick={()=>mode==='lesson'?setLessonVisual('9:16'):setAspect('9:16')}>9:16</button>
          <button className={aspect==='16:9'?'active':''} onClick={()=>mode==='lesson'?setLessonVisual('16:9'):setAspect('16:9')}>16:9</button>
          <label><input type="checkbox" checked={reducedMotion} onChange={(event)=>mode==='lesson'?setLessonReducedMotion(event.target.checked):setReducedMotion(event.target.checked)}/> reduced motion</label>
          {mode==='component'?<button onClick={prepareStill}>Preparar still</button>:null}
        </div>
      </header>

      <div className="lab-player-wrap" data-lab-mode={mode}>
        <LabErrorBoundary key={mode==='component'?`${selected.id}-${aspect}-${reducedMotion}`:`lesson-${aspect}-${reducedMotion}-${lessonSpec.scenes.length}`}>
          {mode==='component'
            ? <Player component={selected.component} inputProps={inputProps} durationInFrames={selected.durationInFrames}
                compositionWidth={vertical?1080:1920} compositionHeight={vertical?1920:1080} fps={30} controls loop style={{width:'100%',height:'100%'}}/>
            : <Player component={TechnicalLessonTemplate} inputProps={{spec:lessonSpec}} durationInFrames={getTechnicalLessonDuration(lessonSpec)}
                compositionWidth={vertical?1080:1920} compositionHeight={vertical?1920:1080} fps={lessonSpec.timings.fps} controls loop style={{width:'100%',height:'100%'}}/>}
        </LabErrorBoundary>
      </div>
    </section>

    <aside className="lab-inspector">
      {mode==='component'?<>
        <h2>Props editáveis</h2>
        <PropEditor props={inputProps} editableProps={selected.editableProps}
          onChange={(key,value)=>setOverrides((current)=>({...current,[selected.id]:{...(current[selected.id]??{}),[key]:value}}))}/>
        <h2>Spec</h2>
        <pre>{JSON.stringify(inputProps,null,2)}</pre>
        <h2>Still pipeline</h2>
        {stillCommand
          ? <textarea className="lab-still-command" aria-label="Still command" readOnly value={stillCommand}/>
          : <p className="lab-hint">Use “Preparar still” para gerar um comando reproduzível no frame atual de validação.</p>}
      </>:<>
        <h2>Lesson authoring</h2>
        <LessonAuthoringPanel spec={lessonSpec} onChange={setLessonSpec}/>
      </>}
    </aside>
  </main>;
};
