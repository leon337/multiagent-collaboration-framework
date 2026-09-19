import {useCurrentFrame,useVideoConfig} from 'remotion';
import {designTokens} from '../lib/tokens';

export const LessonProgressBar=({label='Runtime agêntico moderno'}:{label?:string})=>{
  const frame=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  const progress=Math.min(1,Math.max(0,frame/Math.max(1,durationInFrames-1)));
  return <div style={{
    position:'absolute',top:42,left:72,right:72,zIndex:20,
    fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif',
    pointerEvents:'none',
  }}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:22,color:designTokens.color.muted,marginBottom:14}}>
      <span>MCF • N4</span><span>{label}</span>
    </div>
    <div style={{height:7,borderRadius:99,background:designTokens.color.surfaceStrong,overflow:'hidden'}}>
      <div style={{width:`${progress*100}%`,height:'100%',background:designTokens.color.accent,borderRadius:99}}/>
    </div>
  </div>;
};
