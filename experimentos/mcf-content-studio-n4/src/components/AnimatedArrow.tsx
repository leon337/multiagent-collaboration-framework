import {useCurrentFrame} from 'remotion';
import {progressAt} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type AnimatedArrowProps=CommonProps&{from?:string;to?:string};

export const AnimatedArrow=({aspect='9:16',reducedMotion=false,from='MODELO',to='RUNTIME'}:AnimatedArrowProps)=>{
  const frame=useCurrentFrame();
  const p=progressAt(frame,8,40,reducedMotion);
  const vertical=aspect==='9:16';
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{display:'grid',placeItems:'center'}}>
    <div style={{display:'flex',flexDirection:vertical?'column':'row',alignItems:'center',gap:32,width:'100%',justifyContent:'center'}}>
      <div style={{fontSize:42,fontWeight:800}}>{from}</div>
      <div style={{position:'relative',width:vertical?12:'42%',height:vertical?320:12,background:designTokens.color.surfaceStrong,borderRadius:20,overflow:'visible'}}>
        <div style={{width:vertical?'100%':`${p*100}%`,height:vertical?`${p*100}%`:'100%',background:designTokens.color.accent,borderRadius:20}}/>
        <div style={{position:'absolute',right:vertical?'50%':-18,bottom:vertical?-26:'auto',top:vertical?'auto':'50%',transform:vertical?'translateX(50%) rotate(90deg)':'translateY(-50%)',fontSize:52,color:designTokens.color.accent}}>➜</div>
      </div>
      <div style={{fontSize:42,fontWeight:800}}>{to}</div>
    </div>
  </SafeFrame>;
};
