import {get} from '@vercel/blob';
import {getContentItem} from '@/lib/content';

export const dynamic='force-dynamic';

export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const item=await getContentItem(slug);
  const token=process.env.BLOB_READ_WRITE_TOKEN;
  if(!item?.videoUrl||!token) return new Response('Media not available',{status:404});
  const result=await get(item.videoUrl,{access:'private',token,useCache:false});
  if(result?.statusCode!==200) return new Response('Media not found',{status:404});
  return new Response(result.stream,{
    headers:{
      'Content-Type':result.blob.contentType||'video/mp4',
      'Cache-Control':'private, no-store',
      'X-Content-Type-Options':'nosniff'
    }
  });
}
