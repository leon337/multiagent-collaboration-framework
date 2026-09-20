import {useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {progressAt} from '../lib/motion';
import {Card,SafeFrame} from './shared';

export type ComparisonProps=CommonProps&{title?:string;leftTitle?:string;leftBody?:string;rightTitle?:string;rightBody?:string};
export const Comparison=({aspect='9:16',reducedMotion=false,title='Compare',leftTitle='Antes',leftBody='Fluxo manual',rightTitle='Depois',rightBody='Engine reutilizável'}:ComparisonProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{fontSize:aspect==='9:16'?46:52,fontWeight:850,marginBottom:28}}>{title}</div>
    <div style={{display:'grid',gridTemplateColumns:aspect==='9:16'?'1fr':'1fr 1fr',gap:20}}>
      <Card><div style={{fontSize:26,color:designTokens.color.negative,fontWeight:800}}>{leftTitle}</div><div style={{fontSize:30,lineHeight:1.35,marginTop:16}}>{leftBody}</div></Card>
      <Card><div style={{fontSize:26,color:designTokens.color.positive,fontWeight:800}}>{rightTitle}</div><div style={{fontSize:30,lineHeight:1.35,marginTop:16}}>{rightBody}</div></Card>
    </div>
  </SafeFrame>;

export type CalloutProps=CommonProps&{label?:string;title?:string;body?:string;accent?:string};
export const Callout=({aspect='9:16',reducedMotion=false,label='IMPORTANTE',title='Regra operacional',body='Animação serve à compreensão.',accent=designTokens.color.accent}:CalloutProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{borderLeft:`10px solid ${accent}`}}>
      <div style={{fontSize:22,letterSpacing:4,color:accent,fontWeight:800}}>{label}</div>
      <div style={{fontSize:aspect==='9:16'?52:58,fontWeight:850,lineHeight:1.06,marginTop:16}}>{title}</div>
      <div style={{fontSize:30,lineHeight:1.4,color:designTokens.color.muted,marginTop:22}}>{body}</div>
    </Card>
  </SafeFrame>;

export type TreeDiagramProps=CommonProps&{title?:string;root?:string;children?:string[]};
export const TreeDiagram=({aspect='9:16',reducedMotion=false,title='Árvore',root='ENGINE',children=['Templates','Components','Assets']}:TreeDiagramProps)=> {
  const frame=useCurrentFrame(); const p=progressAt(frame,8,45,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{fontSize:42,fontWeight:850,marginBottom:34}}>{title}</div>
    <Card style={{textAlign:'center'}}>
      <div style={{fontSize:34,fontWeight:850,color:designTokens.color.accent}}>{root}</div>
      <div style={{height:54,width:3,background:designTokens.color.accent,margin:'14px auto',transform:`scaleY(${p})`,transformOrigin:'top'}}/>
      <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(3,Math.max(1,children.length))},1fr)`,gap:14}}>
        {children.map((item,i)=><div key={item} style={{padding:18,border:`1px solid ${designTokens.color.line}`,borderRadius:16,opacity:reducedMotion?1:Math.max(0,Math.min(1,p*1.35-i*.12)),fontSize:24}}>{item}</div>)}
      </div>
    </Card>
  </SafeFrame>;
};

export type BarChartProps=CommonProps&{title?:string;items?:Array<{label:string;value:number}>;max?:number};
export const BarChart=({aspect='9:16',reducedMotion=false,title='Métrica',items=[{label:'Components',value:45},{label:'Templates',value:6},{label:'Motion',value:19}],max=50}:BarChartProps)=>{
  const frame=useCurrentFrame(); const p=progressAt(frame,8,50,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card>
      <div style={{fontSize:42,fontWeight:850,marginBottom:30}}>{title}</div>
      <div style={{display:'grid',gap:20}}>{items.map(item=><div key={item.label}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:22,marginBottom:8}}><span>{item.label}</span><strong>{Math.round(item.value*p)}</strong></div>
        <div style={{height:22,borderRadius:11,background:designTokens.color.surfaceStrong,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,item.value/Math.max(1,max)*100*p)}%`,background:designTokens.color.accent}}/></div>
      </div>)}</div>
    </Card>
  </SafeFrame>;
};

export type VideoClipProps=CommonProps&{title?:string;src?:string;caption?:string};
export const VideoClip=({aspect='9:16',reducedMotion=false,title='Video clip',src='',caption='Asset de vídeo reutilizável'}:VideoClipProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{padding:0,overflow:'hidden'}}>
      <div style={{aspectRatio:'16 / 9',display:'grid',placeItems:'center',background:'linear-gradient(135deg,#111827,#202a46)',position:'relative'}}>
        {src?<video src={src} muted playsInline style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{fontSize:72}}>▶</div>}
      </div>
      <div style={{padding:28}}><strong style={{fontSize:28}}>{title}</strong><div style={{fontSize:22,color:designTokens.color.muted,marginTop:8}}>{caption}</div></div>
    </Card>
  </SafeFrame>;

export type SoundCueProps=CommonProps&{label?:string;kind?:'sfx'|'music'|'ambient';gainDb?:number};
export const SoundCue=({aspect='9:16',reducedMotion=false,label='Impact',kind='sfx',gainDb=-6}:SoundCueProps)=>{
  const frame=useCurrentFrame(); const p=progressAt(frame,0,36,reducedMotion);
  const bars=Array.from({length:20},(_,i)=>.25+.75*Math.abs(Math.sin(i*.8+p*4)));
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><strong style={{fontSize:34}}>{label}</strong><span style={{color:designTokens.color.accent}}>{kind} · {gainDb} dB</span></div>
      <div style={{display:'flex',alignItems:'center',height:140,gap:7,marginTop:26}}>{bars.map((h,i)=><div key={i} style={{flex:1,height:`${h*100}%`,borderRadius:7,background:designTokens.color.accent,opacity:.45+.55*p}}/>)}</div>
    </Card>
  </SafeFrame>;
};

export type TypingCueProps=CommonProps&{text?:string;prefix?:string;speedFrames?:number};
export const TypingCue=({aspect='9:16',reducedMotion=false,text='pnpm test',prefix='$ ',speedFrames=3}:TypingCueProps)=>{
  const frame=useCurrentFrame(); const count=reducedMotion?text.length:Math.min(text.length,Math.floor(frame/Math.max(1,speedFrames)));
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{background:'linear-gradient(145deg,#13213d,#0d1830)',borderColor:'#7f9bd2'}}><div style={{fontFamily:'ui-monospace, monospace',fontSize:aspect==='9:16'?34:40,color:'#eef5ff'}}>{prefix}{text.slice(0,count)}<span style={{opacity:frame%20<10?1:.15}}>▌</span></div></Card>
  </SafeFrame>;
};

export type ScrollCueProps=CommonProps&{title?:string;lines?:string[];visibleLines?:number};
export const ScrollCue=({aspect='9:16',reducedMotion=false,title='Scroll',lines=['source','storyboard','spec','components','motion','render','review'],visibleLines=4}:ScrollCueProps)=>{
  const frame=useCurrentFrame(); const max=Math.max(0,lines.length-visibleLines); const offset=reducedMotion?max:Math.round(progressAt(frame,10,70,false)*max);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}><Card>
    <div style={{fontSize:30,fontWeight:800,marginBottom:18}}>{title}</div>
    <div style={{display:'grid',gap:10}}>{lines.slice(offset,offset+visibleLines).map((line,i)=><div key={line+i} style={{padding:16,borderRadius:12,background:designTokens.color.surfaceStrong,fontSize:25}}>{line}</div>)}</div>
  </Card></SafeFrame>;
};

export type SelectionCueProps=CommonProps&{text?:string;selection?:string};
export const SelectionCue=({aspect='9:16',reducedMotion=false,text='const runtime = authorize(tool)',selection='authorize'}:SelectionCueProps)=>{
  const frame=useCurrentFrame(); const on=reducedMotion||frame>24; const parts=text.split(selection);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}><Card style={{background:'linear-gradient(145deg,#13213d,#0d1830)',borderColor:'#7f9bd2'}}>
    <div style={{fontFamily:'ui-monospace, monospace',fontSize:aspect==='9:16'?30:36,lineHeight:1.5,color:'#eef5ff'}}>{parts[0]}<span style={{background:on?designTokens.color.accent:'transparent',color:on?'#07142f':'#eef5ff',padding:'2px 4px',borderRadius:5}}>{selection}</span>{parts.slice(1).join(selection)}</div>
  </Card></SafeFrame>;
};

export type ClickCueProps=CommonProps&{label?:string;x?:number;y?:number};
export const ClickCue=({aspect='9:16',reducedMotion=false,label='Clique',x=50,y=50}:ClickCueProps)=>{
  const frame=useCurrentFrame(); const p=progressAt(frame,10,36,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{position:'relative'}}>
    <div style={{position:'absolute',left:`${x}%`,top:`${y}%`,transform:'translate(-50%,-50%)'}}>
      <div style={{position:'absolute',width:90*p,height:90*p,left:-45*p,top:-45*p,border:`4px solid ${designTokens.color.accent}`,borderRadius:'50%',opacity:1-p}}/>
      <div style={{fontSize:54,transform:`scale(${.9+.1*p})`}}>☝</div><div style={{fontSize:20,marginTop:6}}>{label}</div>
    </div>
  </SafeFrame>;
};
