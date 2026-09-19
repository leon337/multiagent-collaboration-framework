import {useCurrentFrame} from 'remotion';
import {progressAt} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type AnimatedTimelineProps=CommonProps&{title?:string;items?:string[]};

export const AnimatedTimeline=({aspect='9:16',reducedMotion=false,title='Eventos',items=['mensagem','tool call','resultado','checkpoint']}:AnimatedTimelineProps)=>{
  const frame=useCurrentFrame();
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:52,fontWeight:800,marginBottom:72}}>{title}</div>
    <div style={{display:'grid',gap:38}}>
      {items.map((item,index)=>{
        const p=progressAt(frame,index*14,index*14+12,reducedMotion);
        return <div key={`${item}-${index}`} style={{display:'grid',gridTemplateColumns:'44px 1fr',gap:24,alignItems:'center',opacity:p,transform:`translateX(${(1-p)*30}px)`}}>
          <div style={{width:22,height:22,borderRadius:'50%',background:designTokens.color.accent,boxShadow:`0 0 0 8px ${designTokens.color.surfaceStrong}`}}/>
          <div style={{fontSize:36,padding:'26px 30px',borderBottom:`1px solid ${designTokens.color.line}`}}>{item}</div>
        </div>;
      })}
    </div>
  </SafeFrame>;
};
