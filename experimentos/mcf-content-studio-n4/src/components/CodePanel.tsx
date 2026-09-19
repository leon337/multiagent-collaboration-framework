import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type CodePanelProps=CommonProps&{title?:string;language?:string;code?:string};

export const CodePanel=({aspect='9:16',reducedMotion=false,title='Código',language='ts',code='const result = await agent.run(input);'}:CodePanelProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{background:'#05070c',padding:0,overflow:'hidden'}}>
      <div style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',background:designTokens.color.surfaceStrong}}>
        <strong>{title}</strong><span style={{color:designTokens.color.muted}}>{language}</span>
      </div>
      <pre style={{margin:0,padding:34,fontSize:aspect==='9:16'?28:32,lineHeight:1.55,whiteSpace:'pre-wrap',fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',color:designTokens.color.text}}>{code}</pre>
    </Card>
  </SafeFrame>;
