import {AbsoluteFill} from 'remotion';
import {socialCaptionLane,socialSafeAreaProfiles,type SocialPlatformProfile} from '../lib/socialSafeArea';

export const SocialSafeAreaOverlay=({profile}:{profile:SocialPlatformProfile})=>{
  const p=socialSafeAreaProfiles[profile];
  const i=p.uiInsets;
  const mask='rgba(255,70,90,0.16)';
  const edge='rgba(255,110,125,0.72)';
  const safe='rgba(80,220,160,0.88)';
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:90,fontFamily:'Inter,system-ui,sans-serif'}}>
    <div style={{position:'absolute',left:0,right:0,top:0,height:i.top,background:mask,borderBottom:`2px solid ${edge}`}}/>
    <div style={{position:'absolute',left:0,right:0,bottom:0,height:i.bottom,background:mask,borderTop:`2px solid ${edge}`}}/>
    <div style={{position:'absolute',left:0,top:i.top,bottom:i.bottom,width:i.left,background:mask,borderRight:`2px solid ${edge}`}}/>
    <div style={{position:'absolute',right:0,top:i.top,bottom:i.bottom,width:i.right,background:mask,borderLeft:`2px solid ${edge}`}}/>
    <div style={{position:'absolute',left:i.left,right:i.right,top:i.top,bottom:i.bottom,border:`3px solid ${safe}`,borderRadius:18}}/>
    <div style={{position:'absolute',left:socialCaptionLane.left,right:socialCaptionLane.right,bottom:socialCaptionLane.bottom,height:socialCaptionLane.reservedHeight,border:'3px dashed rgba(255,214,96,.92)',borderRadius:18,background:'rgba(255,214,96,.06)'}}/>
    <div style={{position:'absolute',left:24,top:24,padding:'10px 14px',borderRadius:12,background:'rgba(4,7,12,.92)',border:'1px solid rgba(255,255,255,.22)',color:'#fff',fontWeight:800,fontSize:20}}>
      {p.label} · SAFE QA
    </div>
    <div style={{position:'absolute',left:socialCaptionLane.left,bottom:socialCaptionLane.bottom+socialCaptionLane.reservedHeight+10,color:'#ffd660',fontWeight:800,fontSize:16}}>CAPTION LANE</div>
  </AbsoluteFill>;
};
