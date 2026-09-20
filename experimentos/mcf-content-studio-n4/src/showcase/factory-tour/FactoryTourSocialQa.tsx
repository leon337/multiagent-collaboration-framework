import {SocialSafeAreaOverlay} from '../../components/SocialSafeAreaOverlay';
import type {SocialPlatformProfile} from '../../lib/socialSafeArea';
import {FactoryTourShowcase} from './FactoryTourShowcase';

const wrap=(profile:SocialPlatformProfile)=>()=> <><FactoryTourShowcase/><SocialSafeAreaOverlay profile={profile}/></>;

export const FactoryTourYouTubeQa=wrap('youtube-shorts');
export const FactoryTourTikTokQa=wrap('tiktok');
export const FactoryTourReelsQa=wrap('instagram-reels');
export const FactoryTourUniversalQa=wrap('universal-social');
