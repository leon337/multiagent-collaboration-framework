import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createPool} from "./db.mjs";
import {createApi} from "./api.mjs";

const pool=createPool();
const api=createApi(pool);
const publicDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../public");

function serveStatic(req,res){
  if(req.method!=="GET")return false;
  const pathname=new URL(req.url,"http://localhost").pathname;
  const file=pathname==="/"?"index.html":pathname.replace(/^\//,"");
  const target=path.resolve(publicDir,file);
  if(!target.startsWith(publicDir+path.sep))return false;
  if(!fs.existsSync(target)||!fs.statSync(target).isFile())return false;
  const ext=path.extname(target);
  const type={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json"}[ext]||"application/octet-stream";
  res.writeHead(200,{"content-type":type});
  fs.createReadStream(target).pipe(res);
  return true;
}

const server=http.createServer((req,res)=>{
  if(serveStatic(req,res))return;
  return api(req,res);
});
server.listen(Number(process.env.PORT||3000),()=>console.log("clinic-scheduling listening"));
