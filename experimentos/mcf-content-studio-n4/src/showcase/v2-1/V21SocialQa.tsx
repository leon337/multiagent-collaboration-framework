import {SocialSafeAreaOverlay} from '../../components/SocialSafeAreaOverlay';
import type {SocialPlatformProfile} from '../../lib/socialSafeArea';
import {EngineShowcaseV21} from './EngineShowcaseV21';
import {MotionShowcaseV21} from './MotionShowcaseV21';
import {EditorShowcaseV21} from './EditorShowcaseV21';
import {UiCodeShowcaseV21} from './UiCodeShowcaseV21';
import {PedagogyShowcaseV21} from './PedagogyShowcaseV21';
import {AssetAudioShowcaseV21} from './AssetAudioShowcaseV21';
import {IntegrationsShowcaseV21} from './IntegrationsShowcaseV21';
import {FactoryTourShowcaseV21} from './FactoryTourShowcaseV21';

const wrap=(Component:()=>React.ReactNode,profile:SocialPlatformProfile)=>()=> <><Component/><SocialSafeAreaOverlay profile={profile}/></>;

export const V21EngineUniversalQa=wrap(EngineShowcaseV21,'universal-social');
export const V21MotionUniversalQa=wrap(MotionShowcaseV21,'universal-social');
export const V21EditorUniversalQa=wrap(EditorShowcaseV21,'universal-social');
export const V21UiCodeUniversalQa=wrap(UiCodeShowcaseV21,'universal-social');
export const V21PedagogyUniversalQa=wrap(PedagogyShowcaseV21,'universal-social');
export const V21AssetAudioUniversalQa=wrap(AssetAudioShowcaseV21,'universal-social');
export const V21IntegrationsUniversalQa=wrap(IntegrationsShowcaseV21,'universal-social');
export const V21FactoryTourUniversalQa=wrap(FactoryTourShowcaseV21,'universal-social');
