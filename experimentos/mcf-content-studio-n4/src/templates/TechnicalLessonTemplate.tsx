import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {labEntries} from '../registry/registry';
import {CaptionOverlay} from '../pilot/CaptionOverlay';
import type {TechnicalLessonSpec} from './types';

const Progress=()=>{
  const frame=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  const p=Math.max(0,Math.min(1,frame/Math.max(1,durationInFrames-1)));
  return <div style={{position:'absolute',left:0,right:0,bottom:0,height:8,background:'rgba(255,255,255,.12)',zIndex:40}}>
    <div style={{height:'100%',width:`${p*100}%`,background:'#7c8cff'}}/>
  </div>;
};

export const TechnicalLessonTemplate=({spec}:{spec:TechnicalLessonSpec})=>{
  let cursor=0;
  const scenes=spec.scenes.map((scene)=>{
    const from=cursor;
    cursor+=scene.durationFrames;
    const entry=labEntries.find((item)=>item.id===scene.componentId);
    if(!entry) throw new Error(`Unknown lesson component: ${scene.componentId}`);
    const manifestStatus=(entry.status as string);
    if(manifestStatus!=='APPROVED') throw new Error(`Component ${scene.componentId} is not APPROVED`);
    if(!entry.supportedAspects.includes(spec.visuals.aspect)) throw new Error(`Component ${scene.componentId} does not support ${spec.visuals.aspect}`);
    const Component=entry.component;
    const props={...entry.defaultProps,...scene.props,aspect:spec.visuals.aspect,reducedMotion:spec.visuals.reducedMotion};
    return <Sequence key={scene.id} from={from} durationInFrames={scene.durationFrames} premountFor={15}>
      <Component {...props}/>
    </Sequence>;
  });

  return <AbsoluteFill style={{background:spec.theme.background}}>
    {scenes}
    <CaptionOverlay cues={spec.narration.cues}/>
    <Progress/>
  </AbsoluteFill>;
};
