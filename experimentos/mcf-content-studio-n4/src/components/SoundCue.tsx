import {useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type SoundCueProps=CommonProps&{label?:string;kind?:'impact'|'transition'|'ambient';intensity?:number};

export const SoundCue=({aspect='9:16',reducedMotion=false,label='Impact cue',kind='impact',intensity=0.8}:SoundCueProps)=>{
  const frame=useCurrentFrame();
  const active=reducedMotion?1:Math.max(0,1-Math.abs((frame%30)-8)/12);
  const bars=Array.from({length:18},(_,i)=>Math.max(.12,Math.min(1,(Math.sin(i*1.7+frame*.16)+1)/2*intensity*active+.12)));
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{display:'grid',placeItems:'center'}}>
    <Card style={{width:aspect==='9:16'?'100%':'72%'}}>
      <div style={{fontSize:22,letterSpacing:4,color:designTokens.color.accent}}>AUDIO / FX • {kind.toUpperCase()}</div>
      <div style={{fontSize:44,fontWeight:900,marginTop:14}}>{label}</div>
      <div style={{display:'flex',gap:8,alignItems:'center',height:160,marginTop:34}}>
        {bars.map((height,i)=><div key={i} style={{flex:1,height:`${height*100}%`,borderRadius:999,background:designTokens.color.accent,opacity:.45+height*.55}}/>)}
      </div>
    </Card>
  </SafeFrame>;
};
