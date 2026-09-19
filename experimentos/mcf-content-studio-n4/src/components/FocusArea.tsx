import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type FocusAreaProps=CommonProps&{title?:string;context?:string[];focus?:string;note?:string};

export const FocusArea=({aspect='9:16',reducedMotion=false,title='Onde olhar agora',context=['Aplicação','Agente','Modelo','Runtime'],focus='Runtime',note='Somente o runtime autorizado executa no ambiente.'}:FocusAreaProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:46,fontWeight:850}}>{title}</div>
    <div style={{display:'grid',gridTemplateColumns:aspect==='9:16'?'1fr 1fr':'repeat(4,1fr)',gap:18,marginTop:40}}>
      {context.map((item)=><Card key={item} style={{opacity:item===focus?1:.28,borderColor:item===focus?designTokens.color.accent:designTokens.color.line,minHeight:150,display:'grid',placeItems:'center'}}>
        <div style={{fontSize:30,fontWeight:800,textAlign:'center'}}>{item}</div>
      </Card>)}
    </div>
    <Card style={{marginTop:28,borderColor:designTokens.color.accent}}>
      <div style={{fontSize:28,lineHeight:1.45}}>{note}</div>
    </Card>
  </SafeFrame>;
