import type {CSSProperties,PropsWithChildren,ReactNode} from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';
import {designTokens} from '../../lib/tokens';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

export const v21={
  bg:'#f5f9ff',
  ink:'#06152f',
  muted:'#61769a',
  blue:'#245cff',
  cyan:'#48c7ff',
  violet:'#7257ff',
  green:'#10b981',
  red:'#f04468',
  amber:'#f2b84b',
  line:'#cbdcff',
  panel:'rgba(255,255,255,.92)',
};

export const reveal=(frame:number,start=0,duration=18)=>interpolate(frame,[start,start+duration],[0,1],clamp);

export const V21Canvas=({children,accent=v21.blue,style}:{children:ReactNode;accent?:string;style?:CSSProperties})=>{
  const frame=useCurrentFrame();
  const drift=Math.sin(frame/52)*16;
  return <AbsoluteFill style={{
    background:'linear-gradient(145deg,#ffffff 0%,#f7faff 42%,#edf4ff 100%)',
    color:v21.ink,fontFamily:'Inter,ui-sans-serif,system-ui,sans-serif',overflow:'hidden',...style,
  }}>
    <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(67,103,180,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(67,103,180,.08) 1px,transparent 1px)',backgroundSize:'54px 54px',opacity:.42}}/>
    <div style={{position:'absolute',left:-250+drift,top:-270,width:660,height:660,borderRadius:'50%',background:'radial-gradient(circle at 65% 65%,rgba(104,190,255,.72),rgba(83,92,255,.32) 46%,transparent 72%)'}}/>
    <div style={{position:'absolute',right:-300-drift,bottom:-280,width:760,height:760,borderRadius:'50%',background:'radial-gradient(circle at 30% 30%,rgba(89,224,255,.55),rgba(116,81,255,.30) 48%,transparent 74%)'}}/>
    <div style={{position:'absolute',right:34,top:150,width:240,height:240,opacity:.36,backgroundImage:'radial-gradient(circle,'+accent+' 2px,transparent 2px)',backgroundSize:'22px 22px'}}/>
    <div style={{position:'relative',zIndex:2,width:'100%',height:'100%'}}>{children}</div>
  </AbsoluteFill>;
};

export const Stage=({kicker,title,subtitle,children,accent=v21.blue,proof,compact=false}:{kicker:string;title:string;subtitle?:string;children:ReactNode;accent?:string;proof?:[string,string,string];compact?:boolean})=>{
  const frame=useCurrentFrame();
  const p=reveal(frame,0,16);
  return <V21Canvas accent={accent}>
    <div style={{position:'absolute',left:54,right:54,top:78,bottom:116,display:'grid',gridTemplateRows:compact?'128px 1fr 88px':'174px 1fr 88px',gap:20}}>
      <div style={{opacity:p,transform:`translateY(${(1-p)*20}px)`}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{fontSize:20,letterSpacing:5,fontWeight:950,color:accent}}>{kicker}</div>
          <div style={{height:2,width:96,background:`linear-gradient(90deg,${accent},transparent)`}}/>
        </div>
        <div style={{fontSize:compact?48:58,lineHeight:.98,letterSpacing:-2,fontWeight:950,marginTop:12,maxWidth:920}}>{title}</div>
        {subtitle?<div style={{fontSize:22,lineHeight:1.35,color:v21.muted,marginTop:10,maxWidth:880,fontWeight:600}}>{subtitle}</div>:null}
      </div>
      <div style={{minHeight:0}}>{children}</div>
      <ProofRail values={proof??['SOURCE','ACTION','RESULT']} accent={accent}/>
    </div>
  </V21Canvas>;
};

export const ProofRail=({values,accent=v21.blue}:{values:[string,string,string];accent?:string})=>{
  const frame=useCurrentFrame();
  const p=reveal(frame,8,20);
  return <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,alignItems:'center',opacity:p}}>
    {values.map((v,i)=><div key={v+i} style={{height:58,border:'1px solid '+v21.line,borderRadius:18,background:'rgba(255,255,255,.78)',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:'0 10px 30px rgba(48,83,156,.07)'}}>
      <span style={{width:10,height:10,borderRadius:99,background:i===2?v21.green:accent,boxShadow:`0 0 0 6px ${i===2?'rgba(16,185,129,.10)':'rgba(36,92,255,.09)'}`}}/>
      <span style={{fontSize:15,fontWeight:900,letterSpacing:1.8,color:i===2?'#087a59':'#49628f'}}>{v}</span>
    </div>)}
  </div>;
};

export const Panel=({children,style,accent}:{children:ReactNode;style?:CSSProperties;accent?:string})=><div style={{
  background:v21.panel,border:'1px solid '+(accent??v21.line),borderRadius:28,
  boxShadow:'0 24px 60px rgba(39,76,154,.12)',backdropFilter:'blur(14px)',boxSizing:'border-box',...style,
}}>{children}</div>;

export const Chip=({children,tone='blue',style}:{children:ReactNode;tone?:'blue'|'green'|'violet'|'amber'|'red';style?:CSSProperties})=>{
  const map={blue:[v21.blue,'#eaf0ff'],green:[v21.green,'#e9fbf4'],violet:[v21.violet,'#f0ecff'],amber:[v21.amber,'#fff7e5'],red:[v21.red,'#fff0f4']} as const;
  const [fg,bg]=map[tone];
  return <span style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 13px',borderRadius:999,background:bg,color:fg,fontWeight:850,fontSize:15,border:'1px solid '+fg+'24',...style}}>{children}</span>;
};

export const Node=({label,value,accent=v21.blue,active=false,style}:{label:string;value?:string|number;accent?:string;active?:boolean;style?:CSSProperties})=><Panel accent={active?accent:undefined} style={{padding:20,textAlign:'center',background:active?'linear-gradient(145deg,#fff,#eef4ff)':v21.panel,boxShadow:active?'0 28px 72px rgba(36,92,255,.20)':'0 18px 42px rgba(39,76,154,.10)',...style}}>
  <div style={{fontSize:14,letterSpacing:2.2,fontWeight:900,color:accent}}>{label}</div>
  {value!==undefined?<div style={{fontSize:34,fontWeight:950,marginTop:8}}>{value}</div>:null}
</Panel>;

export const StatusDot=({ok=true,label}:{ok?:boolean;label:string})=><div style={{display:'flex',alignItems:'center',gap:10}}>
  <span style={{width:12,height:12,borderRadius:99,background:ok?v21.green:v21.red,boxShadow:`0 0 0 6px ${ok?'rgba(16,185,129,.10)':'rgba(240,68,104,.10)'}`}}/>
  <span style={{fontSize:18,fontWeight:800,color:ok?'#0a7d5a':'#a92c4b'}}>{label}</span>
</div>;

export const AnimatedLine=({from,to,accent=v21.blue,progress=1}:{from:[number,number];to:[number,number];accent?:string;progress?:number})=>{
  const dx=to[0]-from[0],dy=to[1]-from[1];
  const len=Math.hypot(dx,dy);
  const angle=Math.atan2(dy,dx)*180/Math.PI;
  return <div style={{position:'absolute',left:from[0],top:from[1],width:len*progress,height:3,background:`linear-gradient(90deg,${accent},${v21.cyan})`,transform:`rotate(${angle}deg)`,transformOrigin:'0 50%',borderRadius:99,boxShadow:'0 0 16px rgba(36,92,255,.25)'}}/>;
};

export const MiniCode=({lines,activeLine=0,style}:{lines:string[];activeLine?:number;style?:CSSProperties})=><Panel style={{background:'linear-gradient(145deg,#13213d,#0b1730)',borderColor:'#6687c6',padding:18,...style}}>
  <div style={{display:'flex',gap:7,marginBottom:16}}><span>●</span><span>●</span><span>●</span></div>
  <div style={{fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',fontSize:18,lineHeight:1.55,color:'#d9e6ff'}}>
    {lines.map((line,i)=><div key={line+i} style={{padding:'4px 8px',borderRadius:8,background:i===activeLine?'rgba(72,199,255,.13)':'transparent',borderLeft:i===activeLine?'3px solid '+v21.cyan:'3px solid transparent',whiteSpace:'pre-wrap'}}>{line}</div>)}
  </div>
</Panel>;

export const TimelineTrack=({label,segments,accent=v21.blue,play=0}:{label:string;segments:number[];accent?:string;play?:number})=><div style={{display:'grid',gridTemplateColumns:'110px 1fr',gap:12,alignItems:'center'}}>
  <div style={{fontSize:14,fontWeight:850,color:v21.muted}}>{label}</div>
  <div style={{display:'flex',gap:6,height:22,position:'relative'}}>
    {segments.map((w,i)=><div key={i} style={{flex:w,borderRadius:7,background:i%2?accent+'99':accent+'55',border:'1px solid '+accent+'44'}}/>)}
    <div style={{position:'absolute',left:`${Math.min(100,Math.max(0,play*100))}%`,top:-5,bottom:-5,width:3,background:v21.red,borderRadius:99,boxShadow:'0 0 12px rgba(240,68,104,.35)'}}/>
  </div>
</div>;
