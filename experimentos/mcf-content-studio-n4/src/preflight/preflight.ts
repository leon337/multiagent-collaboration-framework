import type {TechnicalLessonSpec} from '../templates/types';

export type PreflightSeverity='error'|'warning';
export type PreflightFinding={
  code:string;
  severity:PreflightSeverity;
  sceneId?:string;
  message:string;
};

const words=(value:unknown)=>typeof value==='string'?value.trim().split(/\s+/).filter(Boolean).length:0;
const stringArrayLength=(value:unknown)=>Array.isArray(value)?value.filter((x)=>typeof x==='string').length:0;

export const runLessonPreflight=(spec:TechnicalLessonSpec):PreflightFinding[]=>{
  const findings:PreflightFinding[]=[];

  if(spec.lesson.title.length>80){
    findings.push({code:'LESSON_TITLE_LONG',severity:'warning',message:'Lesson title exceeds 80 characters.'});
  }

  const componentVariety=new Set(spec.scenes.map((scene)=>scene.componentId));
  if(spec.scenes.length>=5&&componentVariety.size<3){
    findings.push({code:'LOW_VISUAL_VARIETY',severity:'warning',message:'Five or more scenes use fewer than three distinct components.'});
  }

  const totalFrames=spec.scenes.reduce((sum,scene)=>sum+scene.durationFrames,0);
  const expectedCueEnd=Math.max(0,...spec.narration.cues.map((cue)=>cue.to));
  if(spec.narration.cues.length===0){
    findings.push({code:'AUDIO_EXPECTED_BUT_NO_CUES',severity:'error',message:'Lesson has no narration cues.'});
  }
  if(expectedCueEnd>totalFrames){
    findings.push({code:'NARRATION_EXCEEDS_TIMELINE',severity:'error',message:'Narration extends beyond the lesson timeline.'});
  }

  for(const scene of spec.scenes){
    const p=scene.props;
    const titleWords=words(p.title)+words(p.headline)+words(p.question);
    if(titleWords>14){
      findings.push({code:'SCENE_HEADLINE_DENSE',severity:'warning',sceneId:scene.id,message:'Scene headline/question exceeds 14 words.'});
    }

    const bodyWords=words(p.body)+words(p.definition)+words(p.note)+words(p.summary);
    if(bodyWords>45){
      findings.push({code:'SCENE_BODY_DENSE',severity:'warning',sceneId:scene.id,message:'Scene body exceeds 45 words.'});
    }

    const itemCount=
      stringArrayLength(p.items)+
      stringArrayLength(p.nodes)+
      stringArrayLength(p.options)+
      stringArrayLength(p.messages);

    if(itemCount>7){
      findings.push({code:'TOO_MANY_ITEMS',severity:'warning',sceneId:scene.id,message:'Scene exposes more than seven list-like items.'});
    }

    if(scene.durationFrames<30){
      findings.push({code:'SCENE_TOO_SHORT',severity:'warning',sceneId:scene.id,message:'Scene duration is below one second at 30fps.'});
    }

    const internalLabel=Object.values(p).some((value)=>
      typeof value==='string'&&/(TODO|DEBUG|INTERNAL_ONLY|dev-only)/i.test(value)
    );
    if(internalLabel){
      findings.push({code:'INTERNAL_LABEL_LEAK',severity:'error',sceneId:scene.id,message:'Internal production label may be visible to the audience.'});
    }
  }

  return findings;
};

export const preflightPasses=(findings:PreflightFinding[])=>
  findings.every((finding)=>finding.severity!=='error');
