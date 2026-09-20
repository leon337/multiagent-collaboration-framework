import {useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type TerminalWindowProps=CommonProps&{command?:string;output?:string};

export const TerminalWindow=({aspect='9:16',reducedMotion=false,command='pnpm test',output='✓ 128 tests passed'}:TerminalWindowProps)=>{
  const frame=useCurrentFrame();
  const length=reducedMotion?command.length:Math.min(command.length,Math.floor(frame/3));
  const typed=command.slice(0,length);
  const showOutput=reducedMotion||frame>command.length*3+18;
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{fontSize:22,letterSpacing:4,color:designTokens.color.accent,fontWeight:900,marginBottom:20}}>TERMINAL SIMULATION</div>
    <Card style={{background:'linear-gradient(145deg,#13213d,#0b1730)',minHeight:440,borderColor:'#7998d6',boxShadow:'0 28px 70px rgba(23,51,108,.2)'}}>
      <div style={{fontSize:24,color:'#a9b9d7',marginBottom:38}}>terminal — mcf-content-studio</div>
      <div style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',fontSize:34,lineHeight:1.7,color:'#f7fbff'}}>
        <div><span style={{color:'#7cc8ff'}}>$</span> {typed}<span style={{opacity:frame%20<10?1:0}}>▍</span></div>
        {showOutput?<div style={{color:'#69e1b0',marginTop:22}}>{output}</div>:null}
      </div>
    </Card>
  </SafeFrame>;
};