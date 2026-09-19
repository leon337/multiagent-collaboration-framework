import {interpolate} from 'remotion';
import presetsData from '../../motion/presets.json';

export type MotionPresetId=(typeof presetsData.presets)[number]['id'];
export const motionPresets=presetsData.presets;

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

export const motionProgress=(frame:number,start=0,duration=18,reducedMotion=false)=>
  reducedMotion?1:interpolate(frame,[start,start+Math.max(1,duration)],[0,1],clamp);

export const resolveMotionStyle=(id:MotionPresetId,progress:number):Record<string,string|number>=>{
  const p=Math.max(0,Math.min(1,progress));
  switch(id){
    case 'fade': return {opacity:p};
    case 'slide': return {opacity:p,transform:`translateY(${(1-p)*36}px)`};
    case 'scale': return {opacity:p,transform:`scale(${0.9+p*0.1})`};
    case 'zoom': return {opacity:p,transform:`scale(${1.12-p*0.12})`};
    case 'focus': return {opacity:0.45+p*0.55,transform:`scale(${0.96+p*0.04})`};
    case 'blur': return {opacity:p,filter:`blur(${(1-p)*10}px)`};
    case 'dim': return {opacity:0.25+p*0.75};
    case 'highlight': return {opacity:1,filter:`brightness(${0.7+p*0.3})`};
    case 'reveal': return {opacity:p,clipPath:`inset(0 ${(1-p)*100}% 0 0)`};
    case 'stagger': return {opacity:p,transform:`translateY(${(1-p)*20}px)`};
    case 'camera-pan': return {transform:`translateX(${(1-p)*48}px)`};
    case 'camera-zoom': return {transform:`scale(${0.94+p*0.06})`};
    default: return {};
  }
};

export const getMotionPreset=(id:MotionPresetId)=>motionPresets.find((preset)=>preset.id===id);
