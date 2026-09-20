import fs from 'node:fs/promises';
import path from 'node:path';
import {get,put} from '@vercel/blob';
const args=Object.fromEntries(process.argv.slice(2).map((arg)=>{const i=arg.indexOf('=');return i===-1?[arg.replace(/^--/,''),'true']:[arg.slice(2,i),arg.slice(i+1)];}));
for(const key of ['file','slug','title','version','mission']) if(!args[key]) throw new Error('Missing --'+key+'=...');
const token=process.env.BLOB_READ_WRITE_TOKEN;if(!token) throw new Error('BLOB_READ_WRITE_TOKEN is required.');
const manifestPath='mcf-content-hub/manifest.json';const sourceFile=path.resolve(args.file);const ext=path.extname(sourceFile)||'.mp4';const mediaPath='mcf-content-hub/videos/'+args.slug+'/v'+args.version+ext;const bytes=await fs.readFile(sourceFile);
const media=await put(mediaPath,bytes,{access:'private',allowOverwrite:true,token,contentType:'video/mp4'});
let manifest=[];const current=await get(manifestPath,{access:'private',token,useCache:false});if(current?.statusCode===200){manifest=await new Response(current.stream).json();}
const item={slug:args.slug,title:args.title,summary:args.summary??'MCF Content Studio output',version:args.version,status:'REVIEW',kind:'video',videoUrl:media.url,durationSec:args.duration?Number(args.duration):undefined,aspect:args.aspect??'9:16',createdAt:new Date().toISOString(),mission:args.mission,issue:args.issue?Number(args.issue):undefined,pr:args.pr?Number(args.pr):undefined,commit:args.commit,factoryRun:args.run,qa:{visual:args.visual??'PASS',audio:args.audio??'PASS',captions:args.captions??'PASS',ci:args.ci??'PASS'},tags:(args.tags??'').split(',').map((x)=>x.trim()).filter(Boolean)};
manifest=[item,...manifest.filter((entry)=>entry.slug!==item.slug)];await put(manifestPath,JSON.stringify(manifest,null,2),{access:'private',allowOverwrite:true,token,contentType:'application/json'});
console.log(JSON.stringify({status:'PUBLISHED_TO_REVIEW',mediaUrl:media.url,item},null,2));
