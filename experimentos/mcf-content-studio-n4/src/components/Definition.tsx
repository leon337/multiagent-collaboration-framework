import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type DefinitionProps=CommonProps&{term?:string;definition?:string;example?:string};

export const Definition=({aspect='9:16',reducedMotion=false,term='Sessão',definition='Unidade persistente que conserva conversa e trabalho ao longo dos turnos.',example='Ex.: histórico + eventos + artefatos relacionados.'}:DefinitionProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{fontSize:24,letterSpacing:4,color:designTokens.color.accent}}>DEFINIÇÃO</div>
    <div style={{fontSize:aspect==='9:16'?78:94,fontWeight:950,lineHeight:1,marginTop:22}}>{term}</div>
    <Card style={{marginTop:36}}>
      <div style={{fontSize:32,lineHeight:1.5}}>{definition}</div>
      <div style={{fontSize:26,lineHeight:1.45,color:designTokens.color.muted,marginTop:24}}>{example}</div>
    </Card>
  </SafeFrame>;
