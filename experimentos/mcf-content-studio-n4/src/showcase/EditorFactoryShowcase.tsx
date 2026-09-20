import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import {socialCoreContentInsets} from '../lib/socialSafeArea';
import {CaptionOverlay} from '../pilot/CaptionOverlay';
import {LightTechBackdrop} from '../components/LightTechBackdrop';
import {editorSync} from './synced';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const seg=(frame:number,a:number,b:number)=>interpolate(frame,[a,b],[0,1],clamp);
const cues=editorSync.cues;

export const EditorFactoryShowcase=()=>{
 const f=useCurrentFrame();
 const direct=cues[1]!,transform=cues[2]!,rotate=cues[3]!,align=cues[4]!,nudge=cues[5]!,timeline=cues[8]!,tracks=cues[9]!;
 const x=f<transform.from?0:interpolate(f,[transform.from,transform.to],[0,.22],clamp);
 const scale=f<transform.from?1:interpolate(f,[transform.from,transform.to],[1,1.22],clamp);
 const rot=f<rotate.from?0:interpolate(f,[rotate.from,rotate.to],[0,15],clamp);
 const snapPulse=f>rotate.from&&f<rotate.to?1+Math.sin((f-rotate.from)/6)*.03:1;
 const finalX=f>align.from?interpolate(f,[align.from,nudge.to],[.22,0],clamp):x;
 const finalRot=f>align.from?interpolate(f,[align.from,nudge.to],[15,0],clamp):rot;
 const play=seg(f,timeline.from,tracks.to);
 const pointerX=interpolate(f,[direct.from,transform.to,rotate.to,align.to,nudge.to],[24,68,72,42,50],clamp);
 const pointerY=interpolate(f,[direct.from,transform.to,rotate.to,align.to,nudge.to],[40,34,62,52,44],clamp);
 return <AbsoluteFill style={{background:designTokens.color.background,color:designTokens.color.text,fontFamily:'Inter,system-ui,sans-serif',paddingTop:socialCoreContentInsets.top,paddingRight:socialCoreContentInsets.right,paddingBottom:socialCoreContentInsets.bottom,paddingLeft:socialCoreContentInsets.left,overflow:'hidden'}}>
   <LightTechBackdrop/>
   <div style={{position:'relative',zIndex:2}}>
     <div style={{display:'flex',alignItems:'center',gap:18}}>
       <div style={{fontSize:22,letterSpacing:5,color:designTokens.color.accent,fontWeight:900}}>N4 SHOWCASE 03</div>
       <div style={{width:100,height:2,background:'linear-gradient(90deg,#2d5bff,transparent)'}}/>
     </div>
     <div style={{fontSize:64,fontWeight:950,lineHeight:.98,letterSpacing:-2.2,marginTop:18}}>EDITOR VISUAL DIRETO</div>
     <div style={{fontSize:25,color:designTokens.color.muted,marginTop:18}}>drag · resize · rotate · snap · align · nudge · multi-track</div>
     <div style={{display:'grid',gridTemplateColumns:'.72fr 1.45fr',gap:22,marginTop:34,height:570}}>
       <div style={{border:'1px solid '+designTokens.color.line,borderRadius:32,padding:18,background:'rgba(255,255,255,.88)',boxShadow:designTokens.shadow.card}}>
         <div style={{fontSize:20,letterSpacing:3,color:'#5673bf',fontWeight:900}}>COMPONENTES</div>
         {['Title','Diagram','Browser','Quiz','StickRig','SoundCue'].map((item,i)=><div key={item} style={{marginTop:12,padding:'14px 14px',borderRadius:16,background:i===2?'linear-gradient(135deg,#e8efff,#dfe8ff)':'#f7faff',border:i===2?'1px solid '+designTokens.color.accent:'1px solid #e0eaff',fontSize:18,fontWeight:i===2?850:650,color:i===2?'#173a92':designTokens.color.text}}>{item}</div>)}
       </div>
       <div style={{border:'1px solid #c7d9ff',borderRadius:32,padding:22,background:'linear-gradient(145deg,#f8fbff,#e8f1ff)',position:'relative',overflow:'hidden',boxShadow:designTokens.shadow.card}}>
         <div style={{position:'absolute',inset:'8%',border:'2px dashed #a8c1f4',borderRadius:22}}/>
         <div style={{position:'absolute',left:'50%',top:'43%',width:'62%',height:'30%',display:'grid',placeItems:'center',transform:`translate(calc(-50% + ${finalX*100}%),-50%) scale(${scale*snapPulse}) rotate(${finalRot}deg)`,background:'linear-gradient(145deg,#ffffff,#edf4ff)',border:'4px solid '+designTokens.color.accent,borderRadius:26,boxShadow:'0 24px 60px rgba(45,91,255,.22)'}}>
           <strong style={{fontSize:24}}>SCENE OBJECT</strong><div style={{fontSize:18,color:designTokens.color.muted}}>layout persistido</div>
           <div style={{position:'absolute',right:-12,bottom:-12,width:28,height:28,borderRadius:99,background:designTokens.color.accent,border:'4px solid white'}}/>
           <div style={{position:'absolute',left:'50%',top:-42,transform:'translateX(-50%)',width:34,height:34,borderRadius:99,display:'grid',placeItems:'center',background:designTokens.color.accent,color:'white'}}>↻</div>
         </div>
         <div style={{position:'absolute',left:`${pointerX}%`,top:`${pointerY}%`,fontSize:42,filter:'drop-shadow(0 6px 14px rgba(34,62,130,.2))'}}>☝</div>
         <div style={{position:'absolute',left:24,right:24,bottom:24,display:'flex',gap:8,flexWrap:'wrap'}}>{['SNAP','←','↔','→','↑','↕','↓','x−','x+','y−','y+','0°'].map((item,i)=><span key={item+i} style={{padding:'8px 11px',border:'1px solid #c8d8fa',borderRadius:9,fontSize:14,background:i===0&&f>520?designTokens.color.accent:'rgba(255,255,255,.8)',color:i===0&&f>520?'white':designTokens.color.text}}>{item}</span>)}</div>
       </div>
     </div>
     <div style={{marginTop:18,border:'1px solid '+designTokens.color.line,borderRadius:28,padding:20,background:'rgba(255,255,255,.88)',boxShadow:designTokens.shadow.soft}}>
       {[['Scenes',designTokens.color.accent,.86],['Motion','#7557ff',.72],['Narration',designTokens.color.positive,.92],['Assets','#f1b83f',.62]].map(([label,color,width],i)=><div key={String(label)} style={{display:'grid',gridTemplateColumns:'120px 1fr',alignItems:'center',gap:14,marginTop:i?13:0}}><span style={{fontSize:16,color:designTokens.color.muted,fontWeight:750}}>{label}</span><div style={{height:20,borderRadius:8,background:'#edf3ff',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,Number(width)*100*play)}%`,background:String(color),borderRadius:8}}/></div></div>)}
     </div>
   </div>
   <CaptionOverlay cues={cues}/>
 </AbsoluteFill>;
};