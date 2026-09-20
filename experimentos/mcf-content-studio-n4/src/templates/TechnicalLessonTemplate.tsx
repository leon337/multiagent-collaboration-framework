import type {CSSProperties} from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {labEntries} from '../registry/registry';
import {CaptionOverlay} from '../pilot/CaptionOverlay';
import {isSemanticMotion,motionProgress,resolveMotionStyle} from '../motion/presets';
import {SemanticFocusLayer,SemanticMotionLayer} from '../motion/semantic';
import type {TechnicalLessonScene,TechnicalLessonSpec} from './types';

const Progress=()=>{const frame=useCurrentFrame();const {durationInFrames}=useVideoConfig();const p=Math.max(0,Math.min(1,frame/Math.max(1,durationInFrames-1)));
 return <div style={{position:'absolute',left:0,right:0,bottom:0,height:8,background:'rgba(45,91,255,.10)',zIndex:40}}><div style={{height:'100%',width:`${p*100}%`,background:'linear-gradient(90deg,#2d5bff,#63c8ff)'}}/></div>;};

const SceneMotion=({scene,reducedMotion,children}:{scene:TechnicalLessonScene;reducedMotion:boolean;children:React.ReactNode})=>{
 const frame=useCurrentFrame();if(!scene.motionPreset)return <>{children}</>;
 if(isSemanticMotion(scene.motionPreset))return <SemanticMotionLayer id={scene.motionPreset} reducedMotion={reducedMotion}>{children}</SemanticMotionLayer>;
 const p=motionProgress(frame,0,18,reducedMotion);return <AbsoluteFill style={resolveMotionStyle(scene.motionPreset,p) as CSSProperties}>{children}</AbsoluteFill>;
};
const SceneTransform=({scene,children}:{scene:TechnicalLessonScene;children:React.ReactNode})=>{
 const l=scene.layout;if(!l)return <>{children}</>;
 return <AbsoluteFill style={{transform:`translate(${l.x*100}%,${l.y*100}%) scale(${l.scale}) rotate(${l.rotationDeg}deg)`,transformOrigin:'center center'}}>{children}</AbsoluteFill>;
};

export const TechnicalLessonTemplate=({spec}:{spec:TechnicalLessonSpec})=>{let cursor=0;const scenes=spec.scenes.map((scene)=>{const from=cursor;cursor+=scene.durationFrames;
 const entry=labEntries.find((item)=>item.id===scene.componentId);if(!entry)throw new Error(`Unknown lesson component: ${scene.componentId}`);
 if(entry.status!=='APPROVED')throw new Error(`Component ${scene.componentId} is not APPROVED`);
 if(!entry.supportedAspects.includes(spec.visuals.aspect))throw new Error(`Component ${scene.componentId} does not support ${spec.visuals.aspect}`);
 const Component=entry.component;const props={...entry.defaultProps,...scene.props,aspect:spec.visuals.aspect,reducedMotion:spec.visuals.reducedMotion};
 const body=<SceneTransform scene={scene}><SceneMotion scene={scene} reducedMotion={spec.visuals.reducedMotion}><Component {...props}/></SceneMotion></SceneTransform>;
 return <Sequence key={scene.id} from={from} durationInFrames={scene.durationFrames} premountFor={15}>{scene.focusIntent?<SemanticFocusLayer intent={scene.focusIntent} reducedMotion={spec.visuals.reducedMotion}>{body}</SemanticFocusLayer>:body}</Sequence>;});
 return <AbsoluteFill style={{background:spec.theme.background}}>{scenes}<CaptionOverlay cues={spec.narration.cues}/><Progress/></AbsoluteFill>;};
