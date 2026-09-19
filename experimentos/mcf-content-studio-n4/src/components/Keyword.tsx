import {useReveal} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type KeywordProps=CommonProps&{keyword?:string;definition?:string;prefix?:string};

export const Keyword=({aspect='9:16',reducedMotion=false,prefix='PALAVRA-CHAVE',keyword='Sandbox',definition='Uma fronteira explícita que limita o alcance da execução.'}:KeywordProps)=>{
  const p=useReveal(0,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{display:'grid',placeItems:'center'}}>
    <div style={{textAlign:'center',opacity:p}}>
      <div style={{fontSize:24,letterSpacing:5,color:designTokens.color.muted}}>{prefix}</div>
      <div style={{fontSize:aspect==='9:16'?96:120,fontWeight:950,color:designTokens.color.accent,lineHeight:1,marginTop:24}}>{keyword}</div>
      <div style={{fontSize:30,lineHeight:1.45,maxWidth:aspect==='9:16'?820:980,margin:'34px auto 0',color:designTokens.color.text}}>{definition}</div>
    </div>
  </SafeFrame>;
};
