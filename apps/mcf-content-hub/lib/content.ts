import {list} from '@vercel/blob';
import seed from '@/data/seed-content.json';
import type {ContentItem} from './types';
const MANIFEST='mcf-content-hub/manifest.json';
const byDate=(a:ContentItem,b:ContentItem)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime();
export async function getContentItems():Promise<ContentItem[]>{
  const fallback=(seed as ContentItem[]).sort(byDate);
  const token=process.env.BLOB_READ_WRITE_TOKEN;
  if(!token) return fallback;
  try{
    const result=await list({prefix:MANIFEST,limit:1,token});
    const manifest=result.blobs.find((blob)=>blob.pathname===MANIFEST);
    if(!manifest) return fallback;
    const response=await fetch(manifest.url,{cache:'no-store'});
    if(!response.ok) return fallback;
    const remote=await response.json() as ContentItem[];
    const merged=new Map<string,ContentItem>();
    for(const item of fallback) merged.set(item.slug,item);
    for(const item of remote) merged.set(item.slug,item);
    return [...merged.values()].sort(byDate);
  }catch{return fallback;}
}
export async function getContentItem(slug:string){return (await getContentItems()).find((item)=>item.slug===slug)??null;}
