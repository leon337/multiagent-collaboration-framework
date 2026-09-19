import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type BrowserWindowProps=CommonProps&{url?:string;headline?:string;body?:string};

export const BrowserWindow=({aspect='9:16',reducedMotion=false,url='mcf.local/runtime',headline='Runtime agêntico',body='Uma interface simulada para explicar software sem depender de screenshots frágeis.'}:BrowserWindowProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{padding:0,overflow:'hidden'}}>
      <div style={{height:74,display:'flex',alignItems:'center',gap:14,padding:'0 28px',background:designTokens.color.surfaceStrong}}>
        <span>●</span><span>●</span><span>●</span>
        <div style={{marginLeft:20,flex:1,background:designTokens.color.background,borderRadius:18,padding:'12px 20px',fontSize:22,color:designTokens.color.muted}}>{url}</div>
      </div>
      <div style={{padding:48}}>
        <div style={{fontSize:52,fontWeight:850}}>{headline}</div>
        <div style={{fontSize:32,lineHeight:1.45,color:designTokens.color.muted,marginTop:28}}>{body}</div>
      </div>
    </Card>
  </SafeFrame>;
