import {useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type QuizProps=CommonProps&{question?:string;options?:string[];correctIndex?:number;revealAfterFrame?:number};

export const Quiz=({aspect='9:16',reducedMotion=false,question='Qual camada executa comandos?',options=['Modelo','Runtime','Prompt'],correctIndex=1,revealAfterFrame=75}:QuizProps)=>{
  const frame=useCurrentFrame();
  const reveal=reducedMotion||frame>=revealAfterFrame;
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:26,letterSpacing:4,color:designTokens.color.accent}}>QUIZ</div>
    <div style={{fontSize:aspect==='9:16'?56:66,fontWeight:900,lineHeight:1.08,marginTop:20}}>{question}</div>
    <div style={{display:'grid',gap:18,marginTop:46}}>
      {options.map((option,index)=>{
        const active=reveal&&index===correctIndex;
        return <Card key={option+index} style={{padding:26,borderColor:active?designTokens.color.positive:designTokens.color.line,opacity:reveal&&!active?.45:1}}>
          <div style={{display:'flex',alignItems:'center',gap:18,fontSize:30,fontWeight:760}}>
            <span style={{width:42,height:42,borderRadius:999,display:'grid',placeItems:'center',background:active?designTokens.color.positive:designTokens.color.surfaceStrong,color:active?'#07120b':designTokens.color.text}}>{String.fromCharCode(65+index)}</span>
            {option}
          </div>
        </Card>;
      })}
    </div>
  </SafeFrame>;
};
