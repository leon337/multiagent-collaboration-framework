import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type CodePanelProps=CommonProps&{title?:string;language?:string;code?:string};

export const CodePanel=({aspect='9:16',reducedMotion=false,title='Código',language='ts',code='const result = await agent.run(input);'}:CodePanelProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{fontSize:22,letterSpacing:4,color:designTokens.color.accent,fontWeight:900,marginBottom:20}}>EXECUTABLE SPEC</div>
    <Card style={{background:'linear-gradient(145deg,#13213d,#0d1830)',padding:0,overflow:'hidden',borderColor:'#7f9bd2'}}>
      <div style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',background:'#1b2d50',color:'#f6f9ff'}}>
        <strong>{title}</strong><span style={{color:'#b7c7e6'}}>{language}</span>
      </div>
      <pre style={{margin:0,padding:34,fontSize:aspect==='9:16'?28:32,lineHeight:1.55,whiteSpace:'pre-wrap',fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',color:'#eef5ff'}}>{code}</pre>
    </Card>
  </SafeFrame>;