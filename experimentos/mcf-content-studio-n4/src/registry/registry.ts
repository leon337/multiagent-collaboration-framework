import type {ComponentType} from 'react';
import registryData from '../../registry/registry.json';
import {
  ActiveRecall,
  AnimatedArrow,
  AnimatedTimeline,
  ArchitectureNode,
  BounceHeadlineN4,
  BrowserWindow,
  ChapterProgress,
  ErrorVsCorrect,
  FocusConcept,
  ProgressiveDiagram,
  TerminalWindow,
} from '../components';
import type {ComponentManifest} from '../lib/types';
import type {LabEntry} from '../lab/types';

const componentMap: Record<string, ComponentType<any>> = {
  'focus-concept': FocusConcept,
  'progressive-diagram': ProgressiveDiagram,
  'animated-timeline': AnimatedTimeline,
  'active-recall': ActiveRecall,
  'error-vs-correct': ErrorVsCorrect,
  'architecture-node': ArchitectureNode,
  'animated-arrow': AnimatedArrow,
  'chapter-progress': ChapterProgress,
  'bounce-headline-n4': BounceHeadlineN4,
  'browser-window': BrowserWindow,
  'terminal-window': TerminalWindow,
};

export const componentManifests = registryData.components as ComponentManifest[];

export const labEntries: LabEntry[] = componentManifests.map((manifest) => {
  const component = componentMap[manifest.id];
  if (!component) throw new Error(`Registry component "${manifest.id}" has no implementation`);

  return {
    id: manifest.id,
    name: manifest.displayName,
    category: manifest.category,
    durationInFrames: manifest.duration.recommendedFrames,
    defaultProps: manifest.defaultProps,
    editableProps: manifest.editableProps,
    component,
  };
});

export const registryVersion = registryData.registryVersion;
