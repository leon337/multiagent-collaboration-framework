import {SocialSafeAreaOverlay} from '../../components/SocialSafeAreaOverlay';
import type {SocialPlatformProfile} from '../../lib/socialSafeArea';
import {UiCodeSimulationShowcase} from './UiCodeSimulationShowcase';
import {PedagogyCharactersShowcase} from './PedagogyCharactersShowcase';
import {AssetAudioFactoryShowcase} from './AssetAudioFactoryShowcase';
import {IntegrationsShowcase} from './IntegrationsShowcase';

const wrap=(Component:()=>React.ReactNode,profile:SocialPlatformProfile)=>()=> <><Component/><SocialSafeAreaOverlay profile={profile}/></>;

export const ShowcaseUiCodeYouTubeQa=wrap(UiCodeSimulationShowcase,'youtube-shorts');
export const ShowcaseUiCodeTikTokQa=wrap(UiCodeSimulationShowcase,'tiktok');
export const ShowcaseUiCodeReelsQa=wrap(UiCodeSimulationShowcase,'instagram-reels');
export const ShowcaseUiCodeUniversalQa=wrap(UiCodeSimulationShowcase,'universal-social');

export const ShowcasePedagogyYouTubeQa=wrap(PedagogyCharactersShowcase,'youtube-shorts');
export const ShowcasePedagogyTikTokQa=wrap(PedagogyCharactersShowcase,'tiktok');
export const ShowcasePedagogyReelsQa=wrap(PedagogyCharactersShowcase,'instagram-reels');
export const ShowcasePedagogyUniversalQa=wrap(PedagogyCharactersShowcase,'universal-social');

export const ShowcaseAssetsAudioYouTubeQa=wrap(AssetAudioFactoryShowcase,'youtube-shorts');
export const ShowcaseAssetsAudioTikTokQa=wrap(AssetAudioFactoryShowcase,'tiktok');
export const ShowcaseAssetsAudioReelsQa=wrap(AssetAudioFactoryShowcase,'instagram-reels');
export const ShowcaseAssetsAudioUniversalQa=wrap(AssetAudioFactoryShowcase,'universal-social');

export const ShowcaseIntegrationsYouTubeQa=wrap(IntegrationsShowcase,'youtube-shorts');
export const ShowcaseIntegrationsTikTokQa=wrap(IntegrationsShowcase,'tiktok');
export const ShowcaseIntegrationsReelsQa=wrap(IntegrationsShowcase,'instagram-reels');
export const ShowcaseIntegrationsUniversalQa=wrap(IntegrationsShowcase,'universal-social');
