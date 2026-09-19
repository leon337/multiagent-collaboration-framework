import type {AspectRatio} from '../lib/types';
import type {MotionPresetId} from '../motion/presets';

export type LessonCaptionCue={from:number;to:number;text:string};
export type TechnicalLessonScene={
  id:string;
  componentId:string;
  durationFrames:number;
  props:Record<string,unknown>;
  motionPreset?:MotionPresetId;
};
export type TechnicalLessonSpec={
  lesson:{id:string;title:string;summary?:string};
  chapters:string[];
  scenes:TechnicalLessonScene[];
  narration:{cues:LessonCaptionCue[]};
  visuals:{aspect:AspectRatio;reducedMotion:boolean};
  theme:{id:string;background:string;accent:string};
  assets:string[];
  timings:{fps:number};
};

export const getTechnicalLessonDuration=(spec:TechnicalLessonSpec)=>
  spec.scenes.reduce((sum,scene)=>sum+scene.durationFrames,0);
