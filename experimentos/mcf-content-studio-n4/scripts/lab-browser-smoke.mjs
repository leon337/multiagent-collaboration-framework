import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('out',{recursive:true});
const server=spawn('pnpm',['exec','vite','--host','127.0.0.1','--port','5190'],{
  stdio:['ignore','pipe','pipe'],
  env:{...process.env,CI:'1'},
});

const waitForServer=async()=>{
  const deadline=Date.now()+30000;
  while(Date.now()<deadline){
    try{
      const response=await fetch('http://127.0.0.1:5190');
      if(response.ok) return;
    }catch{}
    await new Promise((resolve)=>setTimeout(resolve,300));
  }
  throw new Error('Vite server did not become ready');
};

const browser=await chromium.launch({headless:true});
const report={generatedAt:new Date().toISOString(),cases:[]};

try{
  await waitForServer();
  for(const testCase of [
    {name:'desktop',viewport:{width:1440,height:900}},
    {name:'mobile',viewport:{width:390,height:844}},
  ]){
    const page=await browser.newPage({viewport:testCase.viewport});
    const started=performance.now();
    await page.goto('http://127.0.0.1:5190',{waitUntil:'domcontentloaded'});
    await page.getByText('MCF Video Lab',{exact:false}).waitFor({state:'visible'});
    await page.locator('.lab-player-wrap').waitFor({state:'visible'});
    const readyMs=Math.round(performance.now()-started);

    const countText=await page.locator('.lab-count').innerText();
    await page.getByLabel('Editabilidade').selectOption('editable');
    await page.getByRole('button',{name:'16:9'}).click();
    await page.getByText('reduced motion').locator('input').check();
    await page.getByRole('button',{name:'Preparar still'}).click();
    await page.getByLabel('Still command').waitFor({state:'visible'});
    const stillCommand=await page.getByLabel('Still command').inputValue();
    if(!stillCommand.includes('remotion still')) throw new Error('Still pipeline command was not generated');

    const layout=await page.evaluate(()=>{
      const root=document.documentElement;
      const all=[...document.querySelectorAll('*')];
      const offenders=all
        .map((el)=>({tag:el.tagName,className:typeof el.className==='string'?el.className:'',scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}))
        .filter((item)=>item.scrollWidth>item.clientWidth+1)
        .sort((a,b)=>(b.scrollWidth-b.clientWidth)-(a.scrollWidth-a.clientWidth))
        .slice(0,12);
      return {scrollWidth:root.scrollWidth,clientWidth:root.clientWidth,overflow:root.scrollWidth>window.innerWidth+1,offenders};
    });

    await page.getByRole('button',{name:'Aula'}).click();
    await page.getByLabel('Lesson authoring').waitFor({state:'visible'});
    await page.getByLabel('Duração em frames').fill('165');
    const exportText=await page.getByLabel('Lesson JSON export').inputValue();
    if(!exportText.includes('"durationFrames": 165')) throw new Error('Lesson authoring did not update exported JSON');
    const lessonMode=await page.locator('.lab-player-wrap').getAttribute('data-lab-mode');
    if(lessonMode!=='lesson') throw new Error('Lesson preview mode did not activate');

    const screenshot=`out/lab-${testCase.name}.png`;
    await page.screenshot({path:screenshot,fullPage:true});
    report.cases.push({name:testCase.name,viewport:testCase.viewport,readyMs,countText,overflow:layout.overflow,layout,screenshot,stillCommand,lessonMode});

    if(testCase.name==='mobile'&&layout.overflow){
      throw new Error('Mobile horizontal overflow detected: '+JSON.stringify(layout));
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

writeFileSync('out/lab-browser-smoke.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
