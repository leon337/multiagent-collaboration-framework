import {readFileSync} from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {describe,expect,it} from 'vitest';
import registry from '../registry/registry.json';
import importManifest from '../src/importer/rendercomp-bounce-in-headline.manifest.json';

const loadJson=(relative:string)=>JSON.parse(readFileSync(new URL(relative,import.meta.url),'utf8'));
const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);

describe('N4 JSON schemas',()=>{
  it('validates the live registry against the canonical schema',()=>{
    const schema=loadJson('../../../schemas/content-studio-n4-registry.schema.json');
    const validate=ajv.compile(schema);
    expect(validate(registry),JSON.stringify(validate.errors,null,2)).toBe(true);
  });

  it('validates the approved external import manifest',()=>{
    const schema=loadJson('../../../schemas/content-studio-n4-import.schema.json');
    const validate=ajv.compile(schema);
    expect(validate(importManifest),JSON.stringify(validate.errors,null,2)).toBe(true);
  });
});
