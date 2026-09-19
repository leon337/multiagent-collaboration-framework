import type {TechnicalLessonSpec} from '../templates/types';
import {runLessonPreflight} from './preflight';

/**
 * Boundary contract for external storyboard/preflight systems such as Instavar.
 * This adapter does not claim native Instavar API compatibility.
 */
export const toPreflightPayload=(spec:TechnicalLessonSpec)=>({
  lessonId:spec.lesson.id,
  headline:spec.lesson.title,
  expectedAudio:spec.narration.cues.length>0,
  aspect:spec.visuals.aspect,
  scenes:spec.scenes.map((scene)=>({
    id:scene.id,
    type:scene.componentId,
    durationFrames:scene.durationFrames,
    props:scene.props,
  })),
  narrationManifest:spec.narration.cues,
});

export const validateBeforeExternalPreflight=(spec:TechnicalLessonSpec)=>({
  payload:toPreflightPayload(spec),
  localFindings:runLessonPreflight(spec),
});
