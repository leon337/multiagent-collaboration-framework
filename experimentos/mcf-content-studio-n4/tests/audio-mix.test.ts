import {describe,expect,it} from 'vitest';
import {hasNarrationDucking,validateAudioMix,type LessonAudioMix} from '../src/audio/mix';

const mix:LessonAudioMix={
  fps:30,
  clips:[
    {id:'n1',kind:'narration',assetId:'narration-main',startFrame:0,durationFrames:300,gainDb:0},
    {id:'m1',kind:'music',assetId:'music-bed',startFrame:0,durationFrames:300,gainDb:-14,fadeInFrames:15,fadeOutFrames:30},
    {id:'s1',kind:'sfx',assetId:'sfx-impact',startFrame:120,durationFrames:24,gainDb:-6},
  ],
  ducking:[{trigger:'narration',targets:['music','ambient'],reductionDb:-9,attackFrames:6,releaseFrames:15}],
};

describe('N4 lesson audio mix contract',()=>{
  it('accepts narration + music + sfx with narration-driven ducking',()=>{
    expect(validateAudioMix(mix)).toEqual([]);
    expect(hasNarrationDucking(mix)).toBe(true);
  });

  it('fails closed on invalid ducking gain',()=>{
    expect(validateAudioMix({...mix,ducking:[{...mix.ducking[0],reductionDb:3}]})).toContain('DUCKING_REDUCTION_MUST_BE_NEGATIVE');
  });
});
