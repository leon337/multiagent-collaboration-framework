import type {ShowcaseSync} from '../synced';
import uiCodeData from './sync/ui-code.json';
import pedagogyData from './sync/pedagogy.json';
import assetsAudioData from './sync/assets-audio.json';
import integrationsData from './sync/integrations.json';

export const uiCodeSync=uiCodeData as ShowcaseSync;
export const pedagogySync=pedagogyData as ShowcaseSync;
export const assetsAudioSync=assetsAudioData as ShowcaseSync;
export const integrationsSync=integrationsData as ShowcaseSync;
