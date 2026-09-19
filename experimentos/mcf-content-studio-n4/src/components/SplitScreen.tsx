import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type SplitScreenProps=CommonProps&{leftTitle?:string;leftBody?:string;rightTitle?:string;rightBody?:string};

export const SplitScreen=({aspect='9:16',reducedMotion=false,leftTitle='Decide',leftBody='Modelo',rightTitle='Executa',rightBody='Runtime autorizado'}:SplitScreenProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{display:'grid',gridTemplateColumns:aspect==='9:16'?'1fr':'1fr 1fr',gap:24}}>
      <Card style={{borderColor:designTokens.color.accent}}>
        <div style={{fontSize:24,color:designTokens.color.accent,letterSpacing:3}}>LADO A</div>
        <div style={{fontSize:52,fontWeight:900,marginTop:18}}>{leftTitle}</div>
        <div style={{fontSize:30,color:designTokens.color.muted,marginTop:18}}>{leftBody}</div>
      </Card>
      <Card>
        <div style={{fontSize:24,color:designTokens.color.positive,letterSpacing:3}}>LADO B</div>
        <div style={{fontSize:52,fontWeight:900,marginTop:18}}>{rightTitle}</div>
        <div style={{fontSize:30,color:designTokens.color.muted,marginTop:18}}>{rightBody}</div>
      </Card>
    </div>
  </SafeFrame>;
