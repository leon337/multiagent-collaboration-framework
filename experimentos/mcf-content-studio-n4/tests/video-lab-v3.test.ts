import {describe,expect,it} from 'vitest';
import lesson from '../src/templates/runtime-agentico-data-demo.lesson.json';
import type {TechnicalLessonSpec} from '../src/templates/types';
import {updateSceneComponent,updateSceneMotion} from '../src/authoring/lessonOps';
import {normalizeSceneLayout,snapSceneLayout} from '../src/authoring/VisualAuthoring';
import {rankTemplates} from '../src/authoring/templateSearch';
const spec=lesson as TechnicalLessonSpec;
describe('Video Lab V3 authoring operations',()=>{
 it('changes scene component without creating a bespoke composition',()=>{expect(updateSceneComponent(spec,1,'definition').scenes[1]?.componentId).toBe('definition');});
 it('stores a motion preset at scene level',()=>{expect(updateSceneMotion(spec,1,'underline').scenes[1]?.motionPreset).toBe('underline');});
 it('normalizes and snaps direct canvas transforms',()=>{expect(snapSceneLayout(normalizeSceneLayout({x:.123,y:-.127,scale:1.08,rotationDeg:22,snap:true}))).toMatchObject({x:.1,y:-.15,scale:1.1,rotationDeg:15,snap:true});});
 it('ranks templates by semantic fit instead of relying on memory order',()=>{const ranked=rankTemplates({type:'architecture',nodes:5,aspect:'9:16',learning:true,intent:'architecture'});expect(ranked.length).toBeGreaterThan(0);expect(ranked[0]!.score).toBeGreaterThan(0);expect(ranked[0]!.reasons).toContain('type');expect(ranked[0]!.reasons).toContain('intent');});
});
