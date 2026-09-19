import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type DiffViewerProps=CommonProps&{title?:string;removed?:string[];added?:string[]};

export const DiffViewer=({aspect='9:16',reducedMotion=false,title='Diff',removed=['- acesso irrestrito'],added=['+ runtime autorizado','+ sandbox explícito']}:DiffViewerProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{background:'#05070c'}}>
      <div style={{fontSize:28,fontWeight:800,marginBottom:28}}>{title}</div>
      <div style={{fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',fontSize:aspect==='9:16'?27:31,lineHeight:1.6}}>
        {removed.map((line)=><div key={line} style={{background:'rgba(255,127,135,.12)',color:designTokens.color.negative,padding:'8px 12px'}}>{line}</div>)}
        {added.map((line)=><div key={line} style={{background:'rgba(88,214,141,.12)',color:designTokens.color.positive,padding:'8px 12px'}}>{line}</div>)}
      </div>
    </Card>
  </SafeFrame>;
