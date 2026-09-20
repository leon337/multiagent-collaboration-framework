import {TechnicalLessonTemplate} from '../templates/TechnicalLessonTemplate';
import type {TechnicalLessonSpec} from '../templates/types';
import {showcaseEngineSpec,showcaseMotionSpec} from '../showcase/synced';
import {EditorFactoryShowcase} from '../showcase/EditorFactoryShowcase';
import {SocialSafeAreaOverlay} from '../components/SocialSafeAreaOverlay';
import type {SocialPlatformProfile} from '../lib/socialSafeArea';

const engine=showcaseEngineSpec;
const motion=showcaseMotionSpec;

const lessonQa=(spec:TechnicalLessonSpec,profile:SocialPlatformProfile)=>()=> <><TechnicalLessonTemplate spec={spec}/><SocialSafeAreaOverlay profile={profile}/></>;
const editorQa=(profile:SocialPlatformProfile)=>()=> <><EditorFactoryShowcase/><SocialSafeAreaOverlay profile={profile}/></>;

export const ShowcaseEngineYouTubeQa=lessonQa(engine,'youtube-shorts');
export const ShowcaseEngineTikTokQa=lessonQa(engine,'tiktok');
export const ShowcaseEngineReelsQa=lessonQa(engine,'instagram-reels');
export const ShowcaseEngineUniversalQa=lessonQa(engine,'universal-social');

export const ShowcaseMotionYouTubeQa=lessonQa(motion,'youtube-shorts');
export const ShowcaseMotionTikTokQa=lessonQa(motion,'tiktok');
export const ShowcaseMotionReelsQa=lessonQa(motion,'instagram-reels');
export const ShowcaseMotionUniversalQa=lessonQa(motion,'universal-social');

export const ShowcaseEditorYouTubeQa=editorQa('youtube-shorts');
export const ShowcaseEditorTikTokQa=editorQa('tiktok');
export const ShowcaseEditorReelsQa=editorQa('instagram-reels');
export const ShowcaseEditorUniversalQa=editorQa('universal-social');
