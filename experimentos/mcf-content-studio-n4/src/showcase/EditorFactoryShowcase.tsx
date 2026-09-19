import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import {CaptionOverlay} from '../pilot/CaptionOverlay';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const seg=(frame:number,a:number,b:number)=>interpolate(frame,[a,b],[0,1],clamp);
const cues=[
 {from:0,to:150,text:'O Video Lab evoluiu de editor estrutural para manipulação visual direta.'},
 {from:150,to:360,text:'A cena pode ser movida, redimensionada e rotacionada com snap.'},
 {from:360,to:570,text:'Também temos alinhamento e ajustes finos por nudge.'},
 {from:570,to:780,text:'O layout fica persistido no Technical Lesson Spec.'},
 {from:780,to:990,text:'E a timeline separa cenas, motion, narração e assets.'},
];

export const EditorFactoryShowcase=()=>{
 const f=useCurrentFrame();
 const x=f<180?0:interpolate(f,[180,330],[0,.22],clamp);
 const scale=f<330?1:interpolate(f,[330,450],[1,1.22],clamp);
 const rot=f<450?0:interpolate(f,[450,540],[0,15],clamp);
 const snapPulse=f>520&&f<640?1+Math.sin((f-520)/6)*.03:1;
 const finalX=f>630?interpolate(f,[630,700],[.22,0],clamp):x;
 const finalRot=f>700?interpolate(f,[700,760],[15,0],clamp):rot;
 const play=seg(f,760,990);
 const pointerX=interpolate(f,[150,300,420,540,660],[24,68,72,42,50],clamp);
 const pointerY=interpolate(f,[150,300,420,540,660],[40,34,62,52,44],clamp);
 return <AbsoluteFill style={{background:designTokens.color.background,color:designTokens.color.text,fontFamily:'Inter,system-ui,sans-serif',padding:'96px 64px 360px'}}>
   <div style={{fontSize:24,letterSpacing:4,color:designTokens.color.accent,fontWeight:800}}>N4 VIDEO LAB</div>
   <div style={{fontSize:62,fontWeight:900,lineHeight:1.02,marginTop:16}}>EDITOR VISUAL DIRETO</div>
   <div style={{fontSize:28,color:designTokens.color.muted,marginTop:18}}>drag · resize · rotate · snap · align · nudge · multi-track</div>
   <div style={{display:'grid',gridTemplateColumns:'1fr 1.3fr',gap:28,marginTop:48,height:820}}>
     <div style={{border:'1px solid '+designTokens.color.line,borderRadius:28,padding:22,background:designTokens.color.surface}}>
       <div style={{fontSize:22,fontWeight:800}}>COMPONENTES</div>
       {['Title','Diagram','Browser','Quiz','StickRig','SoundCue'].map((item,i)=><div key={item} style={{marginTop:18,padding:'18px 16px',borderRadius:14,background:i===2?designTokens.color.surfaceStrong:'#0d1320',border:i===2?'1px solid '+designTokens.color.accent:'1px solid transparent',fontSize:22}}>{item}</div>)}
     </div>
     <div style={{border:'1px solid '+designTokens.color.line,borderRadius:28,padding:22,background:'#05070c',position:'relative',overflow:'hidden'}}>
       <div style={{position:'absolute',inset:'8%',border:'1px dashed '+designTokens.color.line,borderRadius:18}}/>
       <div style={{position:'absolute',left:'50%',top:'43%',width:'62%',height:'30%',display:'grid',placeItems:'center',transform:`translate(calc(-50% + ${finalX*100}%),-50%) scale(${scale*snapPulse}) rotate(${finalRot}deg)`,background:designTokens.color.surfaceStrong,border:'4px solid '+designTokens.color.accent,borderRadius:22,boxShadow:'0 0 55px rgba(124,140,255,.25)'}}>
         <strong style={{fontSize:30}}>SCENE OBJECT</strong><div style={{fontSize:18,color:designTokens.color.muted}}>layout persistido</div>
         <div style={{position:'absolute',right:-12,bottom:-12,width:28,height:28,borderRadius:99,background:designTokens.color.accent,border:'4px solid white'}}/>
         <div style={{position:'absolute',left:'50%',top:-42,transform:'translateX(-50%)',width:34,height:34,borderRadius:99,display:'grid',placeItems:'center',background:designTokens.color.accent}}>↻</div>
       </div>
       <div style={{position:'absolute',left:`${pointerX}%`,top:`${pointerY}%`,fontSize:42,filter:'drop-shadow(0 6px 14px #000)'}}>☝</div>
       <div style={{position:'absolute',left:24,right:24,bottom:24,display:'flex',gap:8,flexWrap:'wrap'}}>{['SNAP','←','↔','→','↑','↕','↓','x−','x+','y−','y+','0°'].map((item,i)=><span key={item+i} style={{padding:'8px 11px',border:'1px solid '+designTokens.color.line,borderRadius:9,fontSize:14,background:i===0&&f>520?designTokens.color.accent:designTokens.color.surface}}>{item}</span>)}</div>
     </div>
   </div>
   <div style={{marginTop:24,border:'1px solid '+designTokens.color.line,borderRadius:24,padding:20,background:designTokens.color.surface}}>
     {[['Scenes',designTokens.color.accent,.86],['Motion','#9b8cff',.72],['Narration',designTokens.color.positive,.92],['Assets','#f6c85f',.62]].map(([label,color,width],i)=><div key={String(label)} style={{display:'grid',gridTemplateColumns:'120px 1fr',alignItems:'center',gap:14,marginTop:i?13:0}}><span style={{fontSize:16,color:designTokens.color.muted}}>{label}</span><div style={{height:20,borderRadius:8,background:'#0d1320',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,Number(width)*100*play)}%`,background:String(color),borderRadius:8}}/></div></div>)}
   </div>
   <CaptionOverlay cues={cues}/>
 </AbsoluteFill>;
};