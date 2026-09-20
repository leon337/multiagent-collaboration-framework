import {describe,expect,it} from 'vitest';
import {searchAssets} from '../src/assets/searchAssets';
import {getMotionPreset,isSemanticMotion,motionPresets,resolveMotionStyle} from '../src/motion/presets';
import {resolveSemanticFocus,resolveSemanticFocusPresets} from '../src/motion/semantic';
import {fitTextSize,isAtMinimumTextSize} from '../src/lib/textFit';
import {captionLayoutFor,layoutFor} from '../src/lib/tokens';
import {profileContains,socialCaptionLane,socialCoreContentInsets,socialSafeAreaProfiles} from '../src/lib/socialSafeArea';
import {stickRigVariants} from '../src/components/StickRig';
import {searchComponentManifests} from '../src/registry/search';
import lesson from '../src/templates/runtime-agentico-data-demo.lesson.json';
import {getTechnicalLessonDuration,type TechnicalLessonSpec} from '../src/templates/types';

describe('N4 evolution foundations',()=>{
  it('finds approved assets by semantic usage metadata',()=>{
    expect(searchAssets({usage:'sandbox'}).map((x)=>x.id)).toContain('sandbox-boundary-icon');
    expect(searchAssets({type:'music'}).map((x)=>x.id)).toContain('music-bed');
    expect(searchAssets({type:'sound'}).map((x)=>x.id)).toContain('ui-click');
    expect(searchAssets({type:'video'}).map((x)=>x.id)).toContain('demo-loop');
  });
  it('resolves implemented motion styles deterministically',()=>{
    expect(getMotionPreset('fade')?.status).toBe('IMPLEMENTED');
    expect(resolveMotionStyle('fade',0.5).opacity).toBe(0.5);
  });
  it('implements the complete motion vocabulary',()=>{
    expect(motionPresets.every((preset)=>preset.status==='IMPLEMENTED')).toBe(true);
    for(const id of ['underline','draw-arrow','connector','morph','typewriter','counter','progress'] as const){
      expect(isSemanticMotion(id)).toBe(true);
    }
    expect(resolveSemanticFocus('relation')).toEqual(['dim-others','draw-connector','scale-target']);
    expect(resolveSemanticFocusPresets('model')).toEqual(['dim','camera-zoom']);
    expect(resolveSemanticFocusPresets('relation')).toEqual(['highlight','scale']);
    expect(resolveSemanticFocusPresets('text-entry')).toEqual(['typewriter','underline']);
  });
  it('discovers components by pedagogical intent',()=>{
    expect(searchComponentManifests({intent:'retrieval-practice',status:'APPROVED'}).map((x)=>x.id)).toContain('active-recall');
    expect(searchComponentManifests({intent:'agent-storytelling',status:'APPROVED'}).map((x)=>x.id)).toContain('stick-rig');
    expect(searchComponentManifests({intent:'interaction',status:'APPROVED'}).map((x)=>x.id)).toContain('click-cue');
  });
  it('exposes a reusable character cast from StickRig variants',()=>{expect(stickRigVariants).toEqual(['agent','operator','reviewer','human']);});

  it('reserves a mobile caption lane above social platform chrome',()=>{const caption=captionLayoutFor('9:16');const layout=layoutFor('9:16');expect(caption.fontSize).toBeGreaterThanOrEqual(44);expect(caption.bottom).toBeGreaterThan(socialSafeAreaProfiles['universal-social'].uiInsets.bottom);expect(layout.safeInsets.bottom).toBeGreaterThan(caption.bottom+caption.reservedHeight-80);});

  it('universal social profile contains all platform envelopes',()=>{expect(profileContains('universal-social','youtube-shorts')).toBe(true);expect(profileContains('universal-social','tiktok')).toBe(true);expect(profileContains('universal-social','instagram-reels')).toBe(true);expect(socialCoreContentInsets.right).toBeGreaterThanOrEqual(socialSafeAreaProfiles['universal-social'].uiInsets.right);expect(socialCaptionLane.right).toBeGreaterThanOrEqual(socialSafeAreaProfiles['universal-social'].uiInsets.right);});

  it('fits long text without dropping below the readability floor',()=>{
    const size=fitTextSize({text:'Uma manchete técnica longa que precisa permanecer legível na safe area',preferredPx:76,minPx:52,softCharacterLimit:34});
    expect(size).toBeGreaterThanOrEqual(52); expect(size).toBeLessThan(76);
    expect(isAtMinimumTextSize({text:'x'.repeat(500),preferredPx:76,minPx:52,softCharacterLimit:34})).toBe(true);
  });
  it('derives lesson duration from scene data',()=>{expect(getTechnicalLessonDuration(lesson as TechnicalLessonSpec)).toBe(570);});
});
