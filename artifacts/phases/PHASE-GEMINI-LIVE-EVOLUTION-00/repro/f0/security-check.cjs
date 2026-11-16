/* F0 HTTP / filesystem negative controls. Never reads key content. */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),BASE='http://127.0.0.1:18371';
(async()=>{
 const tests=[];
 function add(id,ok,observed){tests.push({id,pass:!!ok,observed});}
 const status=await fetch(BASE+'/api/status');
 const x=await status.json();
 add('LOOPBACK_SERVER',x.host==='127.0.0.1'&&x.port===18371,{host:x.host,port:x.port});
 for(const target of ['/.private/api-key.json','/server.log','/server.js','/.git/config']){
  const r=await fetch(BASE+target);add('NO_STATIC_'+target,r.status===404,{http:r.status});
 }
 for(const method of ['GET','POST']){
  const r=await fetch(BASE+'/api/status',{method,headers:{Origin:'https://external.invalid'}});
  add('ORIGIN_DENY_'+method,r.status===403,{http:r.status});
 }
 const headers=status.headers;
 add('CSP_ENABLED',String(headers.get('content-security-policy')).includes("default-src 'self'"),{set:!!headers.get('content-security-policy')});
 add('NO_REFERRER',headers.get('referrer-policy')==='no-referrer',{value:headers.get('referrer-policy')});
 const key=path.join(ROOT,'.private/api-key.json');
 add('KEY_FILE_MODE',fs.existsSync(key)&&((fs.statSync(key).mode&0o777)===0o600),{file_mode:fs.existsSync(key)?(fs.statSync(key).mode&0o777).toString(8):null});
 add('KEY_DIR_MODE',(fs.statSync(path.dirname(key)).mode&0o777)===0o700,{dir_mode:(fs.statSync(path.dirname(key)).mode&0o777).toString(8)});
 const ignore=fs.readFileSync(path.join(ROOT,'.gitignore'),'utf8');
 add('GIT_IGNORE_SECRET',ignore.includes('.private/')&&ignore.includes('*.log'),{present:true});
 const server=fs.readFileSync(path.join(ROOT,'server.js'),'utf8');
 add('AUTHENTICATED_BACKEND',false,{reason:'No user authentication middleware: local loopback + origin check only; high-risk for future remote exposure'});
 add('TOKEN_MODEL_BOUND',server.includes('liveConnectConstraints'),{reason:'Ephemeral token currently uses=1, but model/config constraints absent'});
 add('KEY_ENCRYPTED_AT_REST',false,{reason:'0600 plaintext JSON; encryption/vault not yet implemented'});
 const result={checked_at_utc:new Date().toISOString(),tests,pass:tests.filter(x=>x.pass).length,fail:tests.filter(x=>!x.pass).length,classification:'Fails include known security gaps, not necessarily regressions'};
 fs.writeFileSync(path.join(__dirname,'SECURITY-CHECKS.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log('SECURITY_REPORT',JSON.stringify({pass:result.pass,known_gaps:result.fail,failed:tests.filter(x=>!x.pass).map(x=>x.id)}));
})();
