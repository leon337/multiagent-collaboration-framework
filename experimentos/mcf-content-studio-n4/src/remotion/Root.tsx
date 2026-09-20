import {Composition} from 'remotion';
import {TechnicalLessonTemplate} from '../templates/TechnicalLessonTemplate';
import {getTechnicalLessonDuration,type TechnicalLessonSpec} from '../templates/types';
import technicalLessonDemoData from '../templates/runtime-agentico-data-demo.lesson.json';
import architectureLessonData from '../templates/architecture-control-plane.lesson.json';
import uiCodeLessonData from '../templates/ui-code-agent-flow.lesson.json';
import {EditorFactoryShowcase} from '../showcase/EditorFactoryShowcase';
import {editorSync,showcaseEngineSpec,showcaseMotionSpec} from '../showcase/synced';
import {ShowcaseEngineYouTubeQa,ShowcaseEngineTikTokQa,ShowcaseEngineReelsQa,ShowcaseEngineUniversalQa,ShowcaseMotionYouTubeQa,ShowcaseMotionTikTokQa,ShowcaseMotionReelsQa,ShowcaseMotionUniversalQa,ShowcaseEditorYouTubeQa,ShowcaseEditorTikTokQa,ShowcaseEditorReelsQa,ShowcaseEditorUniversalQa} from '../qa/SocialSafeQaCompositions';
import instavarFixture from '../../instavar/proof-walkthrough.fixture.json';
import {fromInstavarVideoSpec,type InstavarVideoSpec} from '../preflight/instavar';
const technicalLessonDemo=technicalLessonDemoData as TechnicalLessonSpec;
const architectureLesson=architectureLessonData as TechnicalLessonSpec;
const uiCodeLesson=uiCodeLessonData as TechnicalLessonSpec;
const showcaseEngine=showcaseEngineSpec;
const showcaseMotion=showcaseMotionSpec;
const instavarBridgeLesson=fromInstavarVideoSpec(instavarFixture as InstavarVideoSpec);
import {RuntimeAgenticoPilot} from '../pilot/RuntimeAgenticoPilot';
import {RUNTIME_AGENTICO_PILOT,RUNTIME_AGENTICO_PILOT_DURATION} from '../pilot/lesson';
import {LongDiagramQa,LongFocusConceptQa,LongTimelineQa} from '../qa/VisualQaCompositions';
import {RegistryComponentQaLandscape,RegistryComponentQaPortrait} from '../qa/RegistryQaCompositions';
import {BounceHeadlinePreviewLandscape,BounceHeadlinePreviewPortrait,BounceHeadlinePreviewReducedMotion} from './PreviewCompositions';
export const RemotionRoot=()=> <>
 <Composition id="RuntimeAgenticoPilot" component={RuntimeAgenticoPilot} durationInFrames={RUNTIME_AGENTICO_PILOT_DURATION} fps={RUNTIME_AGENTICO_PILOT.fps} width={RUNTIME_AGENTICO_PILOT.width} height={RUNTIME_AGENTICO_PILOT.height}/>
 <Composition id="BounceHeadlinePreviewPortrait" component={BounceHeadlinePreviewPortrait} durationInFrames={120} fps={30} width={1080} height={1920}/>
 <Composition id="BounceHeadlinePreviewLandscape" component={BounceHeadlinePreviewLandscape} durationInFrames={120} fps={30} width={1920} height={1080}/>
 <Composition id="BounceHeadlinePreviewReducedMotion" component={BounceHeadlinePreviewReducedMotion} durationInFrames={120} fps={30} width={1080} height={1920}/>
 <Composition id="LongFocusConceptQa" component={LongFocusConceptQa} durationInFrames={180} fps={30} width={1080} height={1920}/>
 <Composition id="LongTimelineQa" component={LongTimelineQa} durationInFrames={180} fps={30} width={1080} height={1920}/>
 <Composition id="LongDiagramQa" component={LongDiagramQa} durationInFrames={180} fps={30} width={1080} height={1920}/>
 <Composition id="RegistryComponentQaPortrait" component={RegistryComponentQaPortrait} durationInFrames={180} fps={30} width={1080} height={1920} defaultProps={{componentId:'focus-concept',reducedMotion:false}}/>
 <Composition id="RegistryComponentQaLandscape" component={RegistryComponentQaLandscape} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={{componentId:'focus-concept',reducedMotion:false}}/>
 <Composition id="TechnicalLessonTemplateDemo" component={TechnicalLessonTemplate} durationInFrames={getTechnicalLessonDuration(technicalLessonDemo)} fps={technicalLessonDemo.timings.fps} width={1080} height={1920} defaultProps={{spec:technicalLessonDemo}}/>
 <Composition id="ArchitectureControlPlaneLesson" component={TechnicalLessonTemplate} durationInFrames={getTechnicalLessonDuration(architectureLesson)} fps={architectureLesson.timings.fps} width={1080} height={1920} defaultProps={{spec:architectureLesson}}/>
 <Composition id="UiCodeAgentFlowLesson" component={TechnicalLessonTemplate} durationInFrames={getTechnicalLessonDuration(uiCodeLesson)} fps={uiCodeLesson.timings.fps} width={1080} height={1920} defaultProps={{spec:uiCodeLesson}}/>
 <Composition id="InstavarBridgeProof" component={TechnicalLessonTemplate} durationInFrames={getTechnicalLessonDuration(instavarBridgeLesson)} fps={instavarBridgeLesson.timings.fps} width={1080} height={1920} defaultProps={{spec:instavarBridgeLesson}}/>
 <Composition id="ShowcaseEngineRegistry" component={TechnicalLessonTemplate} durationInFrames={getTechnicalLessonDuration(showcaseEngine)} fps={showcaseEngine.timings.fps} width={1080} height={1920} defaultProps={{spec:showcaseEngine}}/>
 <Composition id="ShowcaseMotionSystem" component={TechnicalLessonTemplate} durationInFrames={getTechnicalLessonDuration(showcaseMotion)} fps={showcaseMotion.timings.fps} width={1080} height={1920} defaultProps={{spec:showcaseMotion}}/>
 <Composition id="ShowcaseVisualEditor" component={EditorFactoryShowcase} durationInFrames={editorSync.totalFrames} fps={editorSync.fps} width={1080} height={1920}/>
 <Composition id="ShowcaseEngineYouTubeQa" component={ShowcaseEngineYouTubeQa} durationInFrames={getTechnicalLessonDuration(showcaseEngine)} fps={30} width={1080} height={1920}/>
 <Composition id="ShowcaseEngineTikTokQa" component={ShowcaseEngineTikTokQa} durationInFrames={getTechnicalLessonDuration(showcaseEngine)} fps={30} width={1080} height={1920}/>
 <Composition id="ShowcaseEngineReelsQa" component={ShowcaseEngineReelsQa} durationInFrames={getTechnicalLessonDuration(showcaseEngine)} fps={30} width={1080} height={1920}/>
 <Composition id="ShowcaseEngineUniversalQa" component={ShowcaseEngineUniversalQa} durationInFrames={getTechnicalLessonDuration(showcaseEngine)} fps={30} width={1080} height={1920}/>
 <Composition id="ShowcaseMotionYouTubeQa" component={ShowcaseMotionYouTubeQa} durationInFrames={getTechnicalLessonDuration(showcaseMotion)} fps={30} width={1080} height={1920}/>
 <Composition id="ShowcaseMotionTikTokQa" component={ShowcaseMotionTikTokQa} durationInFrames={getTechnicalLessonDuration(showcaseMotion)} fps={30} width={1080} height={1920}/>
 <Composition id="ShowcaseMotionReelsQa" component={ShowcaseMotionReelsQa} durationInFrames={getTechnicalLessonDuration(showcaseMotion)} fps={30} width={1080} height={1920}/>
 <Composition id="ShowcaseMotionUniversalQa" component={ShowcaseMotionUniversalQa} durationInFrames={getTechnicalLessonDuration(showcaseMotion)} fps={30} width={1080} height={1920}/>
 <Composition id="ShowcaseEditorYouTubeQa" component={ShowcaseEditorYouTubeQa} durationInFrames={editorSync.totalFrames} fps={editorSync.fps} width={1080} height={1920}/>
 <Composition id="ShowcaseEditorTikTokQa" component={ShowcaseEditorTikTokQa} durationInFrames={editorSync.totalFrames} fps={editorSync.fps} width={1080} height={1920}/>
 <Composition id="ShowcaseEditorReelsQa" component={ShowcaseEditorReelsQa} durationInFrames={editorSync.totalFrames} fps={editorSync.fps} width={1080} height={1920}/>
 <Composition id="ShowcaseEditorUniversalQa" component={ShowcaseEditorUniversalQa} durationInFrames={editorSync.totalFrames} fps={editorSync.fps} width={1080} height={1920}/>
</>;
