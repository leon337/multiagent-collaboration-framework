type Props={
  props:Record<string,unknown>;
  editableProps:string[];
  onChange:(key:string,value:unknown)=>void;
};

export const PropEditor=({props,editableProps,onChange}:Props)=>
  <div className="prop-editor">
    {editableProps.map((key)=>{
      const value=props[key];
      if(typeof value==='boolean'){
        return <label key={key}><span>{key}</span><input type="checkbox" checked={value} onChange={(e)=>onChange(key,e.target.checked)}/></label>;
      }
      if(typeof value==='number'){
        return <label key={key}><span>{key}</span><input type="number" value={value} onChange={(e)=>onChange(key,Number(e.target.value))}/></label>;
      }
      if(typeof value==='string'){
        return <label key={key}><span>{key}</span><textarea value={value} onChange={(e)=>onChange(key,e.target.value)}/></label>;
      }
      return <label key={key}><span>{key}</span><textarea value={JSON.stringify(value,null,2)} onChange={(e)=>{
        try{onChange(key,JSON.parse(e.target.value));}catch{/* keep previous valid value */}
      }}/></label>;
    })}
  </div>;
