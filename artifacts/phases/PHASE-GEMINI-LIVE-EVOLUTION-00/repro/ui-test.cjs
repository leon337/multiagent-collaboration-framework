const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
(async()=>{
 const b=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.setViewport({width:1440,height:900});
 await p.goto('http://127.0.0.1:18371/',{waitUntil:'networkidle2'});
 const assert=(v,m)=>{if(!v)throw Error('FALHOU: '+m);console.log('PASS:',m)};
 assert((await p.$eval('#keyChip',e=>e.textContent)).includes('não configurada'),'status API não configurada');
 await p.click('[data-view="features"]');
 assert(await p.$eval('#view-features',e=>e.classList.contains('active')),'navegação Laboratório');
 await p.click('[data-view="live"]');
 await p.select('#model','gemini-3.8-live');
 assert(await p.$eval('#affective',e=>e.disabled),'incompatibilidade affective no 3.8');
 assert(await p.$eval('#thinking',e=>e.disabled),'thinking level bloqueado no 3.8');
 await p.select('#model','gemini-2.5-flash-native-audio-preview-12-2025');
 assert(!(await p.$eval('#affective',e=>e.disabled)),'affective ativável no 2.5');
 assert(await p.$eval('#uploadImage',e=>e.disabled),'envio de imagem restrito antes da sessão');
 await p.click('#keyButton');
 assert(await p.$eval('#keyDialog',e=>e.open),'diálogo de chave separado');
 await p.click('#closeKey');
 assert(!(await p.$eval('#keyDialog',e=>e.open)),'fechar diálogo');
 await p.click('#connect');
 await new Promise(r=>setTimeout(r,500));
 assert(await p.$eval('#keyDialog',e=>e.open),'conexão sem chave solicita cadastro');
 await p.click('#closeKey');
 await p.click('[data-view="history"]');
 assert(await p.$eval('#events',e=>e.textContent.includes('Cadastre sua chave')),'erro informativo nos eventos');
 assert(errors.length===0,'sem exceções JavaScript: '+errors.join(' / '));
 console.log('E2E_UI_PASS');
 }finally{await b.close();}
})().catch(e=>{console.error(e.message);process.exit(1)});
