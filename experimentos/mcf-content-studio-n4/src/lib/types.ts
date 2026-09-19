import type {ComponentType} from 'react';

export type AspectRatio = '9:16' | '16:9';
export type RegistryStatus = 'DISCOVERED' | 'REVIEWED' | 'ADAPTED' | 'APPROVED' | 'DEPRECATED';
export type Complexity = 'low' | 'medium' | 'high';
export type ComponentCategory =
  | 'concept' | 'diagram' | 'timeline' | 'learning' | 'architecture'
  | 'progress' | 'ui' | 'code' | 'media' | 'motion' | 'typography' | 'layout' | 'fx' | 'character';

export type CommonProps = {aspect?: AspectRatio; reducedMotion?: boolean};

export type LayoutContext = {
  aspect: AspectRatio;
  width: number;
  height: number;
  fps: number;
  safeInsets: {top:number;right:number;bottom:number;left:number};
  reducedMotion: boolean;
};

export type ComponentManifest = {
  id: string;
  displayName: string;
  version: string;
  category: ComponentCategory;
  pedagogicalPurpose: string;
  supportedAspects: AspectRatio[];
  defaultProps: Record<string, unknown>;
  editableProps: string[];
  duration: {minFrames:number;recommendedFrames:number};
  safeArea: 'required' | 'decorative-only';
  reducedMotion: 'supported' | 'not-applicable';
  origin: {kind:'mcf'|'external';source:string};
  license: {id:string;evidence:string};
  dependencies: string[];
  status: RegistryStatus;
  supportsAudioSync: boolean;
  complexity: Complexity;
  tags: string[];
  intents: string[];
};

export type N4Component = ComponentType<Record<string, unknown>>;
