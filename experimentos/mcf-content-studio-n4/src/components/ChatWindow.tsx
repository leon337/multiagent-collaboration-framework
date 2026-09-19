import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type ChatWindowProps=CommonProps&{title?:string;messages?:string[]};

export const ChatWindow=({aspect='9:16',reducedMotion=false,title='Chat',messages=['Usuário: explique o runtime.','Agente: vou separar decisão de execução.','Tool: comando executado com sucesso.']}:ChatWindowProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'20px 26px',background:designTokens.color.surfaceStrong,fontSize:26,fontWeight:850}}>{title}</div>
      <div style={{padding:28,display:'grid',gap:18}}>
        {messages.map((message,index)=><div key={message+index} style={{maxWidth:'88%',justifySelf:index%2?'end':'start',padding:'18px 22px',borderRadius:24,background:index%2?designTokens.color.accent:designTokens.color.background,color:index%2?'white':designTokens.color.text,fontSize:27,lineHeight:1.4}}>{message}</div>)}
      </div>
    </Card>
  </SafeFrame>;
