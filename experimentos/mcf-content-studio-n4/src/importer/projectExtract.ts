import type {ProjectExtractionResult,ProjectImportCandidate,ProjectSnapshot} from './types';

const sourceFile=(path:string)=>/\.(?:tsx?|jsx?)$/i.test(path)&&!/(?:^|\/)(?:node_modules|dist|build|out)(?:\/|$)/.test(path);

const riskSignals=(content:string)=>{
  const signals:string[]=[];
  if(/\beval\s*\(/.test(content)||/new\s+Function\s*\(/.test(content)) signals.push('dynamic-code');
  if(/\bfetch\s*\(/.test(content)||/https?:\/\//.test(content)) signals.push('network');
  if(/child_process|execSync|spawnSync|\bexec\s*\(/.test(content)) signals.push('process-execution');
  return signals;
};

const classify=(path:string,content:string):ProjectImportCandidate|null=>{
  const signals:string[]=[];
  if(/<Composition\b|\bComposition\s*[,(]/.test(content)) signals.push('remotion-composition');
  if(/useCurrentFrame|useVideoConfig|interpolate|spring|Sequence|AbsoluteFill/.test(content)) signals.push('remotion-runtime');
  if(/export\s+(?:default\s+)?(?:const|function|class)\s+[A-Z]/.test(content)||/export\s+default\s+function\s+[A-Z]/.test(content)) signals.push('exported-react-component');
  if(/registerRoot/.test(content)) signals.push('remotion-root');

  let kind:ProjectImportCandidate['kind']|null=null;
  if(signals.includes('remotion-composition')||signals.includes('remotion-root')) kind='composition';
  else if(signals.includes('exported-react-component')) kind='component';
  else if(signals.includes('remotion-runtime')) kind='utility';
  if(!kind) return null;

  return {path,kind,signals,riskSignals:riskSignals(content)};
};

export const extractProjectCandidates=(snapshot:ProjectSnapshot):ProjectExtractionResult=>{
  const candidates=snapshot.files
    .filter((file)=>sourceFile(file.path))
    .map((file)=>classify(file.path,file.content??''))
    .filter((candidate):candidate is ProjectImportCandidate=>candidate!==null)
    .sort((a,b)=>a.path.localeCompare(b.path));

  const dependencyNames=Object.keys(snapshot.dependencies);
  const remotionDetected=dependencyNames.some((name)=>name==='remotion'||name.startsWith('@remotion/'))||
    candidates.some((candidate)=>candidate.signals.some((signal)=>signal.startsWith('remotion-')));

  const projectFindings:string[]=[];
  if(!remotionDetected) projectFindings.push('Remotion dependency/signals not detected.');
  if(candidates.length===0) projectFindings.push('No import candidates detected.');
  if(candidates.some((candidate)=>candidate.riskSignals.length>0)) projectFindings.push('One or more candidates require manual security review.');

  return {remotionDetected,candidates,projectFindings};
};
