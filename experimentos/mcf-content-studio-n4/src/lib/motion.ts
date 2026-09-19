import {interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';

export const useReveal=(delayFrames=0,reducedMotion=false)=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  if(reducedMotion) return frame>=delayFrames?1:0;
  return spring({frame:Math.max(0,frame-delayFrames),fps,config:{damping:18,stiffness:120,mass:0.8}});
};

export const progressAt=(frame:number,start:number,end:number,reducedMotion=false)=>
  reducedMotion ? (frame>=start?1:0)
    : interpolate(frame,[start,end],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
