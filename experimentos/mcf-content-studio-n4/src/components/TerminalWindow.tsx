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
    <Card style={{background:'#05070c',minHeight:440}}>
      <div style={{fontSize:24,color:designTokens.color.muted,marginBottom:38}}>terminal — mcf-content-studio</div>
      <div style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',fontSize:34,lineHeight:1.7}}>
        <div><span style={{color:designTokens.color.accent}}>$</span> {typed}<span style={{opacity:frame%20<10?1:0}}>▍</span></div>
        {showOutput?<div style={{color:designTokens.color.positive,marginTop:22}}>{output}</div>:null}
      </div>
    </Card>
  </SafeFrame>;
};
