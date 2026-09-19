import type {TechnicalLessonSpec} from '../templates/types';

export const reorderScene=(spec:TechnicalLessonSpec,from:number,to:number):TechnicalLessonSpec=>{
  if(from<0||from>=spec.scenes.length||to<0||to>=spec.scenes.length||from===to) return spec;
  const scenes=[...spec.scenes];
  const [scene]=scenes.splice(from,1);
  scenes.splice(to,0,scene);
  return {...spec,scenes};
};

export const updateSceneDuration=(spec:TechnicalLessonSpec,index:number,durationFrames:number):TechnicalLessonSpec=>{
  if(index<0||index>=spec.scenes.length) return spec;
  const safe=Math.max(1,Math.round(durationFrames));
  return {...spec,scenes:spec.scenes.map((scene,i)=>i===index?{...scene,durationFrames:safe}:scene)};
};

export const updateSceneProps=(spec:TechnicalLessonSpec,index:number,props:Record<string,unknown>):TechnicalLessonSpec=>{
  if(index<0||index>=spec.scenes.length) return spec;
  return {...spec,scenes:spec.scenes.map((scene,i)=>i===index?{...scene,props:{...scene.props,...props}}:scene)};
};

export const serializeLesson=(spec:TechnicalLessonSpec)=>JSON.stringify(spec,null,2)+'\n';
