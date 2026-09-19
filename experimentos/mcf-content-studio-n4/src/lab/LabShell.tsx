import {useMemo,useState} from 'react';
import {Player} from '@remotion/player';
import type {LabAspect,LabEntry} from './types';
import {PropEditor} from './PropEditor';
import './lab.css';

type Props={entries:LabEntry[]};

export const LabShell=({entries}:Props)=>{
  const [selectedId,setSelectedId]=useState(entries[0]?.id??'');
  const [aspect,setAspect]=useState<LabAspect>('9:16');
  const [reducedMotion,setReducedMotion]=useState(false);
  const selected=entries.find((entry)=>entry.id===selectedId)??entries[0];
  const [overrides,setOverrides]=useState<Record<string,Record<string,unknown>>>({});

  const inputProps=useMemo(()=>{
    if(!selected) return {};
    return {...selected.defaultProps,...(overrides[selected.id]??{}),aspect,reducedMotion};
  },[selected,overrides,aspect,reducedMotion]);

  if(!selected) return <main className="lab-empty">Nenhum componente registrado.</main>;

  const vertical=aspect==='9:16';
  return <main className="lab-shell">
    <aside className="lab-sidebar">
      <div className="lab-brand">MCF Video Lab <span>N4</span></div>
      <input className="lab-search" placeholder="Buscar componente…" aria-label="Buscar componente"/>
      <nav>
        {entries.map((entry)=><button className={entry.id===selected.id?'active':''} key={entry.id} onClick={()=>setSelectedId(entry.id)}>
          <strong>{entry.name}</strong><small>{entry.category}</small>
        </button>)}
      </nav>
    </aside>

    <section className="lab-stage">
      <header>
        <div><h1>{selected.name}</h1><p>{selected.id}</p></div>
        <div className="lab-controls">
          <button className={aspect==='9:16'?'active':''} onClick={()=>setAspect('9:16')}>9:16</button>
          <button className={aspect==='16:9'?'active':''} onClick={()=>setAspect('16:9')}>16:9</button>
          <label><input type="checkbox" checked={reducedMotion} onChange={(e)=>setReducedMotion(e.target.checked)}/> reduced motion</label>
        </div>
      </header>
      <div className="lab-player-wrap">
        <Player
          component={selected.component}
          inputProps={inputProps}
          durationInFrames={selected.durationInFrames}
          compositionWidth={vertical?1080:1920}
          compositionHeight={vertical?1920:1080}
          fps={30}
          controls
          loop
          style={{width:'100%',height:'100%'}}
        />
      </div>
    </section>

    <aside className="lab-inspector">
      <h2>Props</h2>
      <PropEditor
        props={inputProps}
        editableProps={selected.editableProps}
        onChange={(key,value)=>setOverrides((current)=>({...current,[selected.id]:{...(current[selected.id]??{}),[key]:value}}))}
      />
      <h2>Spec</h2>
      <pre>{JSON.stringify(inputProps,null,2)}</pre>
    </aside>
  </main>;
};
