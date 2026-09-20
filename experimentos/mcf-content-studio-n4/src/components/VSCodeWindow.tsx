import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type VSCodeWindowProps=CommonProps&{file?:string;code?:string};

export const VSCodeWindow=({aspect='9:16',reducedMotion=false,file='TechnicalLessonTemplate.tsx',code='export const TechnicalLessonTemplate = ({spec}) => {\n  return renderScenes(spec.scenes);\n};'}:VSCodeWindowProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{fontSize:22,letterSpacing:4,color:designTokens.color.accent,fontWeight:900,marginBottom:20}}>CODE AS VISUAL</div>
    <Card style={{padding:0,overflow:'hidden',background:'#f9fbff'}}>
      <div style={{display:'grid',gridTemplateColumns:'190px 1fr'}}>
        <div style={{background:'#edf3ff',padding:22,minHeight:420,color:designTokens.color.muted,fontSize:22,borderRight:`1px solid ${designTokens.color.line}`}}>
          <div>EXPLORER</div><div style={{marginTop:24,color:designTokens.color.text}}>src/</div><div style={{marginLeft:18,marginTop:10}}>{file}</div>
        </div>
        <div>
          <div style={{height:52,padding:'14px 20px',background:'#f1f5ff',fontSize:20,color:'#345'}}> {file}</div>
          <pre style={{margin:0,padding:28,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',fontSize:aspect==='9:16'?24:28,lineHeight:1.55,whiteSpace:'pre-wrap',color:'#17325e'}}>{code}</pre>
        </div>
      </div>
    </Card>
  </SafeFrame>;