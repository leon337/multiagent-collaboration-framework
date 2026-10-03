import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createPool} from "./db.mjs";
import {createApi} from "./api.mjs";
import {ensureDemoData} from "./demo-seed.mjs";

const pool=createPool();
const api=createApi(pool);
const publicDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../public");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};

async function serveStatic(req,res){
  if(req.method!=="GET")return false;
  const u=new URL(req.url,"http://localhost");
  const requested=u.pathname==="/"?"/index.html":u.pathname;
  if(requested.includes(".."))return false;
  try{
    const file=await fs.readFile(path.join(publicDir,requested));
    res.writeHead(200,{"content-type":mime[path.extname(requested)]||"application/octet-stream"});
    res.end(file);return true;
  }catch{return false;}
}

const server=http.createServer(async(req,res)=>{
  if(await serveStatic(req,res))return;
  return api(req,res);
});
const port=Number(process.env.PORT||3000);
server.listen(port,async()=>{
  if(process.env.MCF_DEMO_MODE==="1"){await ensureDemoData(pool);console.log("demo data ready");}
  console.log("clinic-scheduling listening on "+port);
});
