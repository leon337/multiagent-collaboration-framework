import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type GitHubWindowProps=CommonProps&{repo?:string;pr?:string;status?:string;summary?:string};

export const GitHubWindow=({aspect='9:16',reducedMotion=false,repo='leon337/mcf',pr='PR #266',status='DRAFT',summary='Evolução da engine audiovisual modular.'}:GitHubWindowProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'20px 28px',background:'#0d1117',borderBottom:`1px solid ${designTokens.color.line}`,fontSize:24}}>GitHub • {repo}</div>
      <div style={{padding:34}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'center'}}>
          <div style={{fontSize:aspect==='9:16'?48:58,fontWeight:900}}>{pr}</div>
          <div style={{padding:'8px 14px',borderRadius:999,background:'rgba(124,140,255,.18)',color:designTokens.color.accent,fontWeight:800}}>{status}</div>
        </div>
        <div style={{fontSize:30,lineHeight:1.45,color:designTokens.color.muted,marginTop:26}}>{summary}</div>
      </div>
    </Card>
  </SafeFrame>;
