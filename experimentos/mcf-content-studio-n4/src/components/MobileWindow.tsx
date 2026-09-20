import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type MobileWindowProps=CommonProps&{app?:string;title?:string;body?:string};

export const MobileWindow=({aspect='9:16',reducedMotion=false,app='MCF',title='Review Lab',body='Uma interface mobile simulada para demonstrar fluxos sem depender de screenshot externo.'}:MobileWindowProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{display:'grid',placeItems:'center'}}>
    <div style={{position:'absolute',left:110,top:260,fontSize:22,letterSpacing:4,color:designTokens.color.accent,fontWeight:900}}>MOBILE FLOW</div>
    <div style={{width:aspect==='9:16'?620:460,minHeight:760,borderRadius:56,border:'10px solid #d9e6ff',background:'linear-gradient(180deg,#ffffff,#f1f6ff)',padding:28,boxShadow:'0 36px 100px rgba(41,87,180,.22)'}}>
      <div style={{width:120,height:26,borderRadius:20,background:'#dce8ff',margin:'0 auto'}}/>
      <div style={{textAlign:'center',fontSize:18,color:designTokens.color.muted,marginTop:14}}>09:41</div>
      <div style={{marginTop:36,fontSize:24,color:designTokens.color.accent,fontWeight:900}}>{app}</div>
      <div style={{fontSize:48,fontWeight:950,marginTop:18}}>{title}</div>
      <div style={{fontSize:28,lineHeight:1.5,color:designTokens.color.muted,marginTop:24}}>{body}</div>
      <div style={{marginTop:42,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div style={{height:120,borderRadius:26,background:'linear-gradient(145deg,#edf3ff,#dce9ff)',border:'1px solid #c8dbff'}}/>
        <div style={{height:120,borderRadius:26,background:'linear-gradient(145deg,#f4efff,#e7ddff)',border:'1px solid #d8c9ff'}}/>
      </div>
    </div>
  </SafeFrame>;