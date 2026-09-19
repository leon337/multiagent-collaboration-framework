import {motionPresets} from '../motion/presets';

export type MotionPickerProps={
  value?:string;
  onChange?:(id:string)=>void;
  implementedOnly?:boolean;
};

export const MotionPicker=({value,onChange,implementedOnly=true}:MotionPickerProps)=>{
  const presets=motionPresets.filter((preset)=>!implementedOnly||preset.status==='IMPLEMENTED');
  return <label style={{display:'grid',gap:6}}>Motion preset
    <select value={value??presets[0]?.id??''} onChange={(event)=>onChange?.(event.target.value)}>
      {presets.map((preset)=><option key={preset.id} value={preset.id}>{preset.displayName} — {preset.pedagogicalUse}</option>)}
    </select>
  </label>;
};
