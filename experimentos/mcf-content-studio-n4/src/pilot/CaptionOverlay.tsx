import {useCurrentFrame,useVideoConfig} from 'remotion';
import {captionLayoutFor} from '../lib/tokens';
import type {CaptionCue} from './narration';

export const CaptionOverlay=({cues}:{cues:readonly CaptionCue[]})=>{
  const frame=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const aspect=height>width?'9:16':'16:9';
  const layout=captionLayoutFor(aspect);
  const cue=cues.find((item)=>frame>=item.from&&frame<item.to);
  if(!cue) return null;
  return <div style={{
    position:'absolute',left:layout.left,right:layout.right,bottom:layout.bottom,zIndex:60,
    display:'flex',justifyContent:'center',pointerEvents:'none',
    fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif',
  }}>
    <div style={{
      width:'fit-content',maxWidth:layout.maxWidth,
      padding:`${layout.paddingY}px ${layout.paddingX}px`,
      borderRadius:24,
      background:'rgba(255,255,255,.94)',
      border:'1px solid #c7d9ff',
      color:'#07142f',
      fontSize:layout.fontSize,lineHeight:layout.lineHeight,
      fontWeight:800,letterSpacing:0.1,textAlign:'center',
      boxShadow:'0 18px 54px rgba(44,82,170,.18)',
      backdropFilter:'blur(18px)',
      textWrap:'balance',
    }}>{cue.text}</div>
  </div>;
};