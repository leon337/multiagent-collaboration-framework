import {useMemo,useState} from 'react';
import {searchAssets} from '../assets/searchAssets';

export type AssetPickerProps={
  usage?:string;
  selected?:string[];
  onChange?:(ids:string[])=>void;
};

export const AssetPicker=({usage,selected=[],onChange}:AssetPickerProps)=>{
  const [query,setQuery]=useState('');
  const assets=useMemo(()=>searchAssets(usage?{usage}:{}).filter((asset)=>
    !query.trim()||
    asset.id.toLowerCase().includes(query.trim().toLowerCase())||
    asset.style.toLowerCase().includes(query.trim().toLowerCase())
  ),[usage,query]);

  const toggle=(id:string)=>{
    const next=selected.includes(id)?selected.filter((item)=>item!==id):[...selected,id];
    onChange?.(next);
  };

  return <section>
    <label style={{display:'grid',gap:6}}>Assets
      <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar asset…" />
    </label>
    <div style={{display:'grid',gap:8,marginTop:10}}>
      {assets.map((asset)=><button key={asset.id} type="button" onClick={()=>toggle(asset.id)} aria-pressed={selected.includes(asset.id)}>
        {selected.includes(asset.id)?'✓ ':''}{asset.id} · {asset.type}
      </button>)}
    </div>
  </section>;
};
