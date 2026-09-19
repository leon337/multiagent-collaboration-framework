import {useEffect,useMemo,useState} from 'react';
import {Player} from '@remotion/player';
import type {LabAspect,LabEntry,LabTemplate} from './types';
import {LabErrorBoundary} from './LabErrorBoundary';
import {PropEditor} from './PropEditor';
import './lab.css';

type Props={entries:LabEntry[];templates:LabTemplate[]};

export const LabShell=({entries,templates}:Props)=>{
  const [selectedId,setSelectedId]=useState(entries[0]?.id??'');
  const [aspect,setAspect]=useState<LabAspect>('9:16');
  const [reducedMotion,setReducedMotion]=useState(false);
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('all');
  const [status,setStatus]=useState('APPROVED');
  const [templateId,setTemplateId]=useState('all');
  const [overrides,setOverrides]=useState<Record<string,Record<string,unknown>>>({});

  const template=templates.find((item)=>item.id===templateId);
  const categories=useMemo(()=>['all',...Array.from(new Set(entries.map((entry)=>entry.category))).sort()],[entries]);

  const filtered=useMemo(()=>{
    const normalized=query.trim().toLowerCase();
    return entries.filter((entry)=>{
      const queryMatch=!normalized||
        entry.id.toLowerCase().includes(normalized)||
        entry.name.toLowerCase().includes(normalized)||
        entry.category.toLowerCase().includes(normalized);
      const categoryMatch=category==='all'||entry.category===category;
      const statusMatch=status==='all'||entry.status===status;
      const aspectMatch=entry.supportedAspects.includes(aspect);
      const templateMatch=!template||template.componentIds.includes(entry.id);
      return queryMatch&&categoryMatch&&statusMatch&&aspectMatch&&templateMatch;
    });
  },[entries,query,category,status,aspect,template]);

  useEffect(()=>{
    if(!filtered.some((entry)=>entry.id===selectedId)&&filtered[0]) setSelectedId(filtered[0].id);
  },[filtered,selectedId]);

  const selected=entries.find((entry)=>entry.id===selectedId)??filtered[0]??entries[0];
  const inputProps=useMemo(()=>{
    if(!selected) return {};
    return {...selected.defaultProps,...(overrides[selected.id]??{}),aspect,reducedMotion};
  },[selected,overrides,aspect,reducedMotion]);

  if(!selected) return <main className="lab-empty">Nenhum componente registrado.</main>;

  const vertical=aspect==='9:16';

  return <main className="lab-shell">
    <aside className="lab-sidebar">
      <div className="lab-brand">MCF Video Lab <span>N4</span></div>
      <input className="lab-search" placeholder="Buscar componente…" aria-label="Buscar componente" value={query} onChange={(event)=>setQuery(event.target.value)}/>
      <div className="lab-filter-grid">
        <label>Categoria<select value={category} onChange={(event)=>setCategory(event.target.value)}>{categories.map((item)=><option key={item}>{item}</option>)}</select></label>
        <label>Status<select value={status} onChange={(event)=>setStatus(event.target.value)}><option>all</option><option>APPROVED</option><option>ADAPTED</option></select></label>
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
    </aside>

    <section className="lab-stage">
      <header>
        <div><h1>{selected.name}</h1><p>{selected.id} • {selected.status}</p></div>
        <div className="lab-controls">
          <button className={aspect==='9:16'?'active':''} onClick={()=>setAspect('9:16')}>9:16</button>
          <button className={aspect==='16:9'?'active':''} onClick={()=>setAspect('16:9')}>16:9</button>
          <label><input type="checkbox" checked={reducedMotion} onChange={(event)=>setReducedMotion(event.target.checked)}/> reduced motion</label>
        </div>
      </header>
      <div className="lab-player-wrap">
        <LabErrorBoundary key={`${selected.id}-${aspect}-${reducedMotion}`}>
          <Player component={selected.component} inputProps={inputProps} durationInFrames={selected.durationInFrames}
            compositionWidth={vertical?1080:1920} compositionHeight={vertical?1920:1080} fps={30} controls loop style={{width:'100%',height:'100%'}}/>
        </LabErrorBoundary>
      </div>
    </section>

    <aside className="lab-inspector">
      <h2>Props editáveis</h2>
      <PropEditor props={inputProps} editableProps={selected.editableProps}
        onChange={(key,value)=>setOverrides((current)=>({...current,[selected.id]:{...(current[selected.id]??{}),[key]:value}}))}/>
      <h2>Spec</h2>
      <pre>{JSON.stringify(inputProps,null,2)}</pre>
    </aside>
  </main>;
};
