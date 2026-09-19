import {Composition} from 'remotion';
import {TechnicalLessonTemplate} from '../templates/TechnicalLessonTemplate';
import {getTechnicalLessonDuration} from '../templates/types';
import technicalLessonDemo from '../templates/runtime-agentico-data-demo.lesson.json';
import {RuntimeAgenticoPilot} from '../pilot/RuntimeAgenticoPilot';
import {RUNTIME_AGENTICO_PILOT,RUNTIME_AGENTICO_PILOT_DURATION} from '../pilot/lesson';
import {LongDiagramQa,LongFocusConceptQa,LongTimelineQa} from '../qa/VisualQaCompositions';
import {RegistryComponentQaLandscape,RegistryComponentQaPortrait} from '../qa/RegistryQaCompositions';
import {
  BounceHeadlinePreviewLandscape,
  BounceHeadlinePreviewPortrait,
  BounceHeadlinePreviewReducedMotion,
} from './PreviewCompositions';

export const RemotionRoot=()=> <>
  <Composition id="RuntimeAgenticoPilot" component={RuntimeAgenticoPilot}
    durationInFrames={RUNTIME_AGENTICO_PILOT_DURATION} fps={RUNTIME_AGENTICO_PILOT.fps}
    width={RUNTIME_AGENTICO_PILOT.width} height={RUNTIME_AGENTICO_PILOT.height}/>
  <Composition id="BounceHeadlinePreviewPortrait" component={BounceHeadlinePreviewPortrait}
    durationInFrames={120} fps={30} width={1080} height={1920}/>
  <Composition id="BounceHeadlinePreviewLandscape" component={BounceHeadlinePreviewLandscape}
    durationInFrames={120} fps={30} width={1920} height={1080}/>
  <Composition id="BounceHeadlinePreviewReducedMotion" component={BounceHeadlinePreviewReducedMotion}
    durationInFrames={120} fps={30} width={1080} height={1920}/>
  <Composition id="LongFocusConceptQa" component={LongFocusConceptQa}
    durationInFrames={180} fps={30} width={1080} height={1920}/>
  <Composition id="LongTimelineQa" component={LongTimelineQa}
    durationInFrames={180} fps={30} width={1080} height={1920}/>
  <Composition id="LongDiagramQa" component={LongDiagramQa}
    durationInFrames={180} fps={30} width={1080} height={1920}/>
  <Composition id="RegistryComponentQaPortrait" component={RegistryComponentQaPortrait}
    durationInFrames={180} fps={30} width={1080} height={1920}
    defaultProps={{componentId:'focus-concept',reducedMotion:false}}/>
  <Composition id="RegistryComponentQaLandscape" component={RegistryComponentQaLandscape}
    durationInFrames={180} fps={30} width={1920} height={1080}
    defaultProps={{componentId:'focus-concept',reducedMotion:false}}/>
  <Composition id="TechnicalLessonTemplateDemo" component={TechnicalLessonTemplate}
    durationInFrames={getTechnicalLessonDuration(technicalLessonDemo)}
    fps={technicalLessonDemo.timings.fps}
    width={1080} height={1920}
    defaultProps={{spec:technicalLessonDemo}}/>
</>;
