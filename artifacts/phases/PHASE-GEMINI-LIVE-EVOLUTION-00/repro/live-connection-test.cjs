const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
(async()=>{
const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
for(const model of ['gemini-3.8-live-extended-thinking']){
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',x=>errors.push(x.message));
 await page.goto('http://127.0.0.1:18371/',{waitUntil:'networkidle2'});
 await page.select('#model',model);
 await page.click('#connect');
 let connected=false;for(let i=0;i<40;i++){await new Promise(ok=>setTimeout(ok,300));connected=await page.$eval('#connectionStatus',e=>e.textContent.includes('Sessão ao vivo'));if(connected)break;}
 const status=await page.$eval('#connectionStatus',e=>e.textContent.trim());
 const events=await page.$$eval('#events .event',xs=>xs.slice(0,6).map(x=>x.textContent.slice(0,180)));
 console.log(JSON.stringify({model,connected,status,events,pageErrors:errors},null,2));
 if(connected)await page.click('#disconnect');
 await page.close();
}
await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});