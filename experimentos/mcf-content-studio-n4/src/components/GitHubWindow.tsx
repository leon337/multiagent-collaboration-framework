import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type GitHubWindowProps=CommonProps&{repo?:string;pr?:string;status?:string;summary?:string};

export const GitHubWindow=({aspect='9:16',reducedMotion=false,repo='leon337/mcf',pr='PR #266',status='DRAFT',summary='Evolução da engine audiovisual modular.'}:GitHubWindowProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{fontSize:22,letterSpacing:4,color:designTokens.color.accent,fontWeight:900,marginBottom:20}}>GITHUB STATE</div>
    <Card style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'20px 28px',background:'#eef4ff',borderBottom:`1px solid ${designTokens.color.line}`,fontSize:24,color:'#344d7a'}}>GitHub • {repo}</div>
      <div style={{padding:38}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'center'}}>
          <div style={{fontSize:aspect==='9:16'?48:58,fontWeight:950}}>{pr}</div>
          <div style={{padding:'9px 16px',borderRadius:999,background:'#e9edff',color:designTokens.color.accent,fontWeight:900}}>{status}</div>
        </div>
        <div style={{fontSize:30,lineHeight:1.45,color:designTokens.color.muted,marginTop:26}}>{summary}</div>
      </div>
    </Card>
  </SafeFrame>;