import {useCurrentFrame,useVideoConfig} from 'remotion';
import {captionLayoutFor,designTokens} from '../lib/tokens';
import type {CaptionCue} from './narration';

export const CaptionOverlay=({cues}:{cues:readonly CaptionCue[]})=>{
  const frame=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const aspect=height>width?'9:16':'16:9';
  const layout=captionLayoutFor(aspect);
  const cue=cues.find((item)=>frame>=item.from&&frame<item.to);
  if(!cue) return null;
  return <div style={{
    position:'absolute',left:layout.side,right:layout.side,bottom:layout.bottom,zIndex:60,
    display:'flex',justifyContent:'center',pointerEvents:'none',
    fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif',
  }}>
    <div style={{
      width:'fit-content',maxWidth:layout.maxWidth,
      padding:`${layout.paddingY}px ${layout.paddingX}px`,
      borderRadius:24,
      background:'rgba(3,5,10,0.95)',border:`1px solid ${designTokens.color.line}`,
      color:designTokens.color.text,fontSize:layout.fontSize,lineHeight:layout.lineHeight,
      fontWeight:650,letterSpacing:0.1,textAlign:'center',
      boxShadow:'0 18px 64px rgba(0,0,0,0.52)',
      textWrap:'balance',
    }}>{cue.text}</div>
  </div>;
};
