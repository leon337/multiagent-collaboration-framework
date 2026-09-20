import {useCurrentFrame} from 'remotion';

export const LightTechBackdrop=({reducedMotion=false}:{reducedMotion?:boolean})=>{
  const frame=useCurrentFrame();
  const drift=reducedMotion?0:Math.sin(frame/42)*10;
  const drift2=reducedMotion?0:Math.cos(frame/55)*12;
  return <>
    <div style={{
      position:'absolute',inset:0,
      background:'linear-gradient(135deg,#ffffff 0%,#f8fbff 30%,#edf4ff 68%,#dfeaff 100%)'
    }}/>
    <div style={{
      position:'absolute',left:-210+drift,top:-250,width:580,height:580,borderRadius:'50%',
      background:'radial-gradient(circle at 66% 68%,rgba(93,177,255,.9),rgba(62,96,255,.8) 38%,rgba(62,96,255,.08) 72%,transparent 74%)',
      filter:'blur(.2px)'
    }}/>
    <div style={{
      position:'absolute',right:-240+drift2,bottom:-250,width:620,height:620,borderRadius:'50%',
      background:'radial-gradient(circle at 30% 30%,rgba(89,213,255,.96),rgba(93,72,255,.86) 48%,rgba(93,72,255,.09) 73%,transparent 75%)'
    }}/>
    <div style={{
      position:'absolute',right:-120,top:120,width:650,height:760,opacity:.55,
      backgroundImage:'linear-gradient(rgba(66,118,255,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(66,118,255,.13) 1px,transparent 1px)',
      backgroundSize:'52px 52px',
      transform:'perspective(700px) rotateX(58deg) rotateZ(-18deg)',
      transformOrigin:'center'
    }}/>
    <div style={{
      position:'absolute',left:70,top:720,width:150,height:150,opacity:.42,
      backgroundImage:'radial-gradient(circle,#4b78ff 2px,transparent 2px)',
      backgroundSize:'20px 20px'
    }}/>
    <div style={{
      position:'absolute',inset:0,
      background:'radial-gradient(circle at 50% 38%,rgba(255,255,255,.05),rgba(255,255,255,.62) 67%,rgba(255,255,255,.86) 100%)'
    }}/>
  </>;
};
