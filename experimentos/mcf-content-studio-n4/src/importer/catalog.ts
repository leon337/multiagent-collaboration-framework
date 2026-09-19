import type {ProjectSnapshot} from './types';
export type ImportAdapterId='single-component'|'remotion-project'|'remotion-elements-package';
export type ImportAdapterDecision={adapter:ImportAdapterId;confidence:'high'|'medium';reasons:string[]};
export const importAdapterCatalog=[
 {id:'single-component' as const,purpose:'Adaptar uma peça React/Remotion isolada para o contrato N4.',trust:'review-required'},
 {id:'remotion-project' as const,purpose:'Extrair candidatos de um projeto Remotion sem copiar o projeto inteiro.',trust:'review-required'},
 {id:'remotion-elements-package' as const,purpose:'Inspecionar pacotes/blocos Remotion Elements antes de promover peças úteis.',trust:'review-required'},
];
export const selectImportAdapter=(snapshot:ProjectSnapshot):ImportAdapterDecision=>{
 const deps=Object.keys(snapshot.dependencies);
 if(deps.some(name=>name.startsWith('@remotion/')&&name!=='@remotion/player'))return {adapter:'remotion-elements-package',confidence:'high',reasons:['@remotion package detected']};
 const sourceFiles=snapshot.files.filter(file=>/\.(tsx?|jsx?)$/i.test(file.path));
 if(sourceFiles.length<=2)return {adapter:'single-component',confidence:'medium',reasons:['small source surface']};
 return {adapter:'remotion-project',confidence:'high',reasons:['multi-file project surface']};
};
