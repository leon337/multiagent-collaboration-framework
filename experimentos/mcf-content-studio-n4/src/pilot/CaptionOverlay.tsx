import {useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CaptionCue} from './narration';

export const CaptionOverlay=({cues}:{cues:readonly CaptionCue[]})=>{
  const frame=useCurrentFrame();
  const cue=cues.find((item)=>frame>=item.from&&frame<item.to);
  if(!cue) return null;
  return <div style={{
    position:'absolute',left:72,right:72,bottom:64,zIndex:30,
    display:'flex',justifyContent:'center',pointerEvents:'none',
    fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif',
  }}>
    <div style={{
      maxWidth:900,padding:'18px 24px',borderRadius:20,
      background:'rgba(5,7,12,0.88)',border:`1px solid ${designTokens.color.line}`,
      color:designTokens.color.text,fontSize:30,lineHeight:1.3,textAlign:'center',
      boxShadow:'0 12px 50px rgba(0,0,0,0.35)',
    }}>{cue.text}</div>
  </div>;
};
