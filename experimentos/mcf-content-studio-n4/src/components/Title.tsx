import {interpolate,useCurrentFrame} from 'remotion';
import {useReveal} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {fitTextSize} from '../lib/textFit';
import {Card,SafeFrame} from './shared';

export type TitleProps=CommonProps&{eyebrow?:string;title?:string;subtitle?:string};

const Chip=({label,icon,delay}:{label:string;icon:string;delay:number})=>{
  const frame=useCurrentFrame();
  const p=interpolate(frame,[delay,delay+24],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <div style={{
    width:190,height:150,borderRadius:34,
    background:'linear-gradient(145deg,rgba(255,255,255,.98),rgba(231,241,255,.94))',
    border:'1px solid #c8dcff',boxShadow:'0 24px 45px rgba(60,102,220,.18)',
    display:'grid',placeItems:'center',transform:`translateY(${(1-p)*28}px) scale(${.92+.08*p}) rotate(-4deg)`,
    opacity:p
  }}>
    <div style={{fontSize:54,color:designTokens.color.accent}}>{icon}</div>
    <div style={{fontSize:18,letterSpacing:2.2,fontWeight:900,color:'#4267c9'}}>{label}</div>
  </div>;
};

export const Title=({aspect='9:16',reducedMotion=false,eyebrow='CAPÍTULO',title='Título principal',subtitle='Contexto curto para orientar a cena.'}:TitleProps)=>{
  const p=useReveal(0,reducedMotion);
  const titleSize=fitTextSize({text:title,preferredPx:aspect==='9:16'?78:96,minPx:aspect==='9:16'?54:62,softCharacterLimit:aspect==='9:16'?30:44});
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{display:'grid',gridTemplateColumns:aspect==='9:16'?'1fr':'1.1fr .9fr',gap:34,alignItems:'center',height:'100%'}}>
      <div style={{opacity:p,transform:`translateY(${(1-p)*32}px)`}}>
        <div style={{display:'flex',alignItems:'center',gap:18}}>
          <div style={{fontSize:23,letterSpacing:5,color:designTokens.color.accent,fontWeight:900}}>{eyebrow}</div>
          <div style={{height:2,width:100,background:'linear-gradient(90deg,#2d5bff,rgba(45,91,255,0))'}}/>
        </div>
        <div style={{fontSize:titleSize,fontWeight:950,lineHeight:.98,letterSpacing:-2.5,marginTop:26,maxWidth:aspect==='9:16'?'95%':'78%'}}>{title}</div>
        <div style={{fontSize:29,lineHeight:1.35,color:designTokens.color.muted,marginTop:26,maxWidth:aspect==='9:16'?'92%':'70%'}}>{subtitle}</div>
        <Card style={{marginTop:56,padding:28,borderRadius:28,maxWidth:aspect==='9:16'?'92%':'72%'}}>
          <div style={{display:'flex',alignItems:'center',gap:18}}>
            <div style={{width:64,height:64,borderRadius:18,display:'grid',placeItems:'center',background:'#edf3ff',color:designTokens.color.accent,fontSize:34}}>◇</div>
            <div style={{fontSize:24,fontWeight:850,lineHeight:1.25}}>N4 transforma evidência em estrutura visual reutilizável.</div>
          </div>
        </Card>
      </div>
      {aspect!=='9:16'?<div style={{position:'relative',height:620}}>
        <div style={{position:'absolute',left:110,top:185,width:260,height:210,borderRadius:46,background:'linear-gradient(145deg,#7bbdff,#535cff)',boxShadow:'0 30px 70px rgba(69,77,255,.35)',display:'grid',placeItems:'center',color:'white',fontWeight:950,fontSize:72,transform:'rotate(-7deg)'}}>N4</div>
        <div style={{position:'absolute',left:10,top:20}}><Chip label="SPEC" icon="◇" delay={8}/></div>
        <div style={{position:'absolute',right:0,top:80}}><Chip label="COMPONENT" icon="⬡" delay={15}/></div>
        <div style={{position:'absolute',right:50,bottom:35}}><Chip label="REVIEW" icon="✓" delay={22}/></div>
      </div>:<div style={{position:'absolute',right:80,top:260,opacity:.88,transform:'scale(.86)'}}>
        <Chip label="N4" icon="◇" delay={8}/>
      </div>}
    </div>
  </SafeFrame>;
};
