export type AudioTrackKind='narration'|'sfx'|'music'|'ambient';

export type AudioClip={
  id:string;
  kind:AudioTrackKind;
  assetId:string;
  startFrame:number;
  durationFrames:number;
  gainDb:number;
  fadeInFrames?:number;
  fadeOutFrames?:number;
};

export type DuckingRule={
  trigger:'narration';
  targets:Array<'music'|'ambient'>;
  reductionDb:number;
  attackFrames:number;
  releaseFrames:number;
};

export type LessonAudioMix={
  fps:number;
  clips:AudioClip[];
  ducking:DuckingRule[];
};

export const validateAudioMix=(mix:LessonAudioMix)=>{
  const findings:string[]=[];
  if(mix.fps<1) findings.push('AUDIO_FPS_INVALID');
  const ids=new Set<string>();
  for(const clip of mix.clips){
    if(ids.has(clip.id)) findings.push(`AUDIO_CLIP_ID_DUPLICATE:${clip.id}`);
    ids.add(clip.id);
    if(clip.startFrame<0) findings.push(`AUDIO_START_NEGATIVE:${clip.id}`);
    if(clip.durationFrames<1) findings.push(`AUDIO_DURATION_INVALID:${clip.id}`);
    if(clip.gainDb>6) findings.push(`AUDIO_GAIN_TOO_HIGH:${clip.id}`);
    if((clip.fadeInFrames??0)>clip.durationFrames) findings.push(`AUDIO_FADE_IN_EXCEEDS_CLIP:${clip.id}`);
    if((clip.fadeOutFrames??0)>clip.durationFrames) findings.push(`AUDIO_FADE_OUT_EXCEEDS_CLIP:${clip.id}`);
  }
  for(const rule of mix.ducking){
    if(rule.reductionDb>=0) findings.push('DUCKING_REDUCTION_MUST_BE_NEGATIVE');
    if(rule.attackFrames<0||rule.releaseFrames<0) findings.push('DUCKING_TIMING_INVALID');
  }
  return findings;
};

export const hasNarrationDucking=(mix:LessonAudioMix)=>
  mix.ducking.some((rule)=>rule.trigger==='narration'&&rule.targets.includes('music')&&rule.reductionDb<0);
