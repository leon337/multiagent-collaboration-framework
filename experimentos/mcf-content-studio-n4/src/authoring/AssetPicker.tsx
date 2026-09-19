import {useMemo,useState} from 'react';
import {assets as assetRegistry,searchAssets} from '../assets/searchAssets';
import type {AssetQuery} from '../assets/searchAssets';

export type AssetPickerProps={
  usage?:string;
  selected?:string[];
  onChange?:(ids:string[])=>void;
};

export const AssetPicker=({usage,selected=[],onChange}:AssetPickerProps)=>{
  const [query,setQuery]=useState('');
  const [type,setType]=useState('all');
  const [theme,setTheme]=useState('all');
  const [orientation,setOrientation]=useState('all');

  const types=useMemo(()=>['all',...Array.from(new Set(assetRegistry.map((asset)=>asset.type))).sort()],[ ]);
  const themes=useMemo(()=>['all',...Array.from(new Set(assetRegistry.map((asset)=>asset.theme))).sort()],[ ]);
  const orientations=useMemo(()=>['all',...Array.from(new Set(assetRegistry.map((asset)=>asset.orientation))).sort()],[ ]);

  const assets=useMemo(()=>{
    const filters:AssetQuery={
      ...(usage?{usage}:{}),
      ...(type!=='all'?{type:type as AssetQuery['type']}:{}),
      ...(theme!=='all'?{theme}:{}),
      ...(orientation!=='all'?{orientation:orientation as AssetQuery['orientation']}:{}),
    };
    const normalized=query.trim().toLowerCase();
    return searchAssets(filters).filter((asset)=>
      !normalized||
      asset.id.toLowerCase().includes(normalized)||
      asset.style.toLowerCase().includes(normalized)||
      asset.usage.some((item)=>item.toLowerCase().includes(normalized))
    );
  },[usage,query,type,theme,orientation]);

  const toggle=(id:string)=>{
    const next=selected.includes(id)?selected.filter((item)=>item!==id):[...selected,id];
    onChange?.(next);
  };

  return <section className="asset-picker">
    <label style={{display:'grid',gap:6}}>Assets
      <input aria-label="Buscar asset" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar asset…" />
    </label>
    <div className="asset-filter-grid">
      <label>Tipo<select aria-label="Tipo de asset" value={type} onChange={(event)=>setType(event.target.value)}>{types.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label>Tema<select aria-label="Tema de asset" value={theme} onChange={(event)=>setTheme(event.target.value)}>{themes.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label>Orientação<select aria-label="Orientação de asset" value={orientation} onChange={(event)=>setOrientation(event.target.value)}>{orientations.map((item)=><option key={item}>{item}</option>)}</select></label>
    </div>
    <div style={{display:'grid',gap:8,marginTop:10}}>
      {assets.map((asset)=><button key={asset.id} type="button" onClick={()=>toggle(asset.id)} aria-pressed={selected.includes(asset.id)}>
        {selected.includes(asset.id)?'✓ ':''}{asset.id} · {asset.type}
      </button>)}
      {assets.length===0?<small>Nenhum asset compatível com os filtros atuais.</small>:null}
    </div>
  </section>;
};
