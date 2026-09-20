import type {TechnicalLessonSpec} from '../templates/types';
import engineBaseData from './showcase-engine.lesson.json';
import motionBaseData from './showcase-motion.lesson.json';
import engineSyncData from './sync/engine.json';
import motionSyncData from './sync/motion.json';
import editorSyncData from './sync/editor.json';

export type SyncCue={from:number;to:number;text:string};
export type SyncScene={from:number;to:number;durationFrames:number;segmentIds:string[]};
export type ShowcaseSync={
  version:string;fps:number;videoId:string;totalFrames:number;durationSec:number;
  cues:SyncCue[];scenes:Record<string,SyncScene>;
};

const applyLessonSync=(base:TechnicalLessonSpec,sync:ShowcaseSync):TechnicalLessonSpec=>({
  ...base,
  scenes:base.scenes.map((scene)=>{
    const timing=sync.scenes[scene.id];
    if(!timing) throw new Error(`Missing sync scene timing: ${scene.id}`);
    return {...scene,durationFrames:timing.durationFrames};
  }),
  narration:{cues:sync.cues},
  timings:{fps:sync.fps},
});

export const engineSync=engineSyncData as ShowcaseSync;
export const motionSync=motionSyncData as ShowcaseSync;
export const editorSync=editorSyncData as ShowcaseSync;

export const showcaseEngineSpec=applyLessonSync(engineBaseData as TechnicalLessonSpec,engineSync);
export const showcaseMotionSpec=applyLessonSync(motionBaseData as TechnicalLessonSpec,motionSync);

