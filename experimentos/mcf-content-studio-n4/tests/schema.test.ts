import {readFileSync} from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {describe,expect,it} from 'vitest';
import registry from '../registry/registry.json';
import assets from '../assets/registry.json';
import motion from '../motion/presets.json';
import lesson from '../src/templates/runtime-agentico-data-demo.lesson.json';
import importManifest from '../src/importer/rendercomp-bounce-in-headline.manifest.json';
import figmaBridge from '../figma/bridge.placeholder.json';
import projectExtraction from '../src/importer/project-extraction.fixture.json';

const loadJson=(relative:string)=>JSON.parse(readFileSync(new URL(relative,import.meta.url),'utf8'));
const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);

const cases=[
  ['registry','../../../schemas/content-studio-n4-registry.schema.json',registry],
  ['assets','../../../schemas/content-studio-n4-assets.schema.json',assets],
  ['motion','../../../schemas/content-studio-n4-motion.schema.json',motion],
  ['lesson','../../../schemas/content-studio-n4-lesson.schema.json',lesson],
  ['import','../../../schemas/content-studio-n4-import.schema.json',importManifest],
  ['figma-bridge','../../../schemas/content-studio-n4-figma-bridge.schema.json',figmaBridge],
  ['project-extraction','../../../schemas/content-studio-n4-project-extraction.schema.json',projectExtraction],
] as const;

describe('N4 JSON schemas',()=>{
  for(const [name,path,value] of cases){
    it(`validates ${name}`,()=>{
      const validate=ajv.compile(loadJson(path));
      expect(validate(value),JSON.stringify(validate.errors,null,2)).toBe(true);
    });
  }
});
