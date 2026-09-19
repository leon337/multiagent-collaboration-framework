import type {ComponentType} from 'react';
import registryData from '../../registry/registry.json';
import {
  ActiveRecall,AnimatedArrow,AnimatedTimeline,ArchitectureNode,BounceHeadlineN4,
  BrowserWindow,ChapterProgress,ErrorVsCorrect,FocusConcept,ProgressiveDiagram,TerminalWindow,
  Title,Subtitle,Keyword,Caption,Stack,Grid,SplitScreen,FocusArea,Quiz,Definition,
  ProgressiveConcept,BuildArchitecture,Checkpoint,CodePanel,DiffViewer,GitHubWindow,
  VSCodeWindow,ChatWindow,MobileWindow,CursorCue,HighlightCue,
} from '../components';
import type {ComponentManifest} from '../lib/types';
import type {LabEntry,LabTemplate} from '../lab/types';

const componentMap: Record<string, ComponentType<any>> = {
  'focus-concept':FocusConcept,
  'progressive-diagram':ProgressiveDiagram,
  'animated-timeline':AnimatedTimeline,
  'active-recall':ActiveRecall,
  'error-vs-correct':ErrorVsCorrect,
  'architecture-node':ArchitectureNode,
  'animated-arrow':AnimatedArrow,
  'chapter-progress':ChapterProgress,
  'bounce-headline-n4':BounceHeadlineN4,
  'browser-window':BrowserWindow,
  'terminal-window':TerminalWindow,
  'title':Title,
  'subtitle':Subtitle,
  'keyword':Keyword,
  'caption':Caption,
  'stack':Stack,
  'grid':Grid,
  'split-screen':SplitScreen,
  'focus-area':FocusArea,
  'quiz':Quiz,
  'definition':Definition,
  'progressive-concept':ProgressiveConcept,
  'build-architecture':BuildArchitecture,
  'checkpoint':Checkpoint,
  'code-panel':CodePanel,
  'diff-viewer':DiffViewer,
  'github-window':GitHubWindow,
  'vscode-window':VSCodeWindow,
  'chat-window':ChatWindow,
  'mobile-window':MobileWindow,
  'cursor-cue':CursorCue,
  'highlight-cue':HighlightCue,
};

export const componentManifests=registryData.components as ComponentManifest[];

export const labEntries:LabEntry[]=componentManifests.map((manifest)=>{
  const component=componentMap[manifest.id];
  if(!component) throw new Error(`Registry component "${manifest.id}" has no implementation`);
  return {
    id:manifest.id,
    name:manifest.displayName,
    category:manifest.category,
    status:manifest.status,
    supportedAspects:manifest.supportedAspects,
    durationInFrames:manifest.duration.recommendedFrames,
    defaultProps:manifest.defaultProps,
    editableProps:manifest.editableProps,
    component,
  };
});

export const labTemplates:LabTemplate[]=registryData.templates.map((template)=>({
  id:template.id,
  name:template.displayName,
  purpose:template.purpose,
  supportedAspects:template.supportedAspects as LabTemplate['supportedAspects'],
  componentIds:template.componentIds,
  status:template.status,
}));

export const registryVersion=registryData.registryVersion;
