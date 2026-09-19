import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type TreeDiagramProps=CommonProps&{root?:string;branches?:string[];leaves?:string[]};

export const TreeDiagram=({aspect='9:16',reducedMotion=false,root='Aplicação',branches=['Agente A','Agente B'],leaves=['Tool','Runtime','Artifact']}:TreeDiagramProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{alignSelf:'center',textAlign:'center',borderColor:designTokens.color.accent}}>
      <div style={{fontSize:38,fontWeight:900}}>{root}</div>
    </Card>
    <div style={{textAlign:'center',fontSize:34,color:designTokens.color.accent,margin:'10px 0'}}>↓</div>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(3,Math.max(1,branches.length))},1fr)`,gap:18}}>
      {branches.map((branch)=><Card key={branch} style={{textAlign:'center'}}><div style={{fontSize:30,fontWeight:820}}>{branch}</div></Card>)}
    </div>
    <div style={{textAlign:'center',fontSize:34,color:designTokens.color.accent,margin:'10px 0'}}>↓</div>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(3,Math.max(1,leaves.length))},1fr)`,gap:14}}>
      {leaves.map((leaf)=><div key={leaf} style={{padding:20,borderRadius:18,background:designTokens.color.surfaceStrong,textAlign:'center',fontSize:25}}>{leaf}</div>)}
    </div>
  </SafeFrame>;
