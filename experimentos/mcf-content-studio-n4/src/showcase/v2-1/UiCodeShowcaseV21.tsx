import {AbsoluteFill,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {uiCodeSync} from '../phase-b/synced';
import {Chip,MiniCode,Panel,Stage,StatusDot,reveal,v21} from './shared';

const cues=uiCodeSync.cues;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

const WindowShell=({title,children,footer}:{title:string;children:React.ReactNode;footer?:React.ReactNode})=>
  <Panel style={{height:'100%',padding:0,overflow:'hidden',display:'grid',gridTemplateRows:'62px 1fr '+(footer?'66px':'0px'),background:'#fff'}}>
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 18px',borderBottom:'1px solid '+v21.line,background:'#f3f7ff'}}>
      <span style={{color:'#ff6b82'}}>●</span><span style={{color:'#f2b84b'}}>●</span><span style={{color:'#10b981'}}>●</span>
      <div style={{fontSize:16,fontWeight:850,color:v21.muted,marginLeft:10}}>{title}</div>
    </div>
    <div style={{minHeight:0}}>{children}</div>
    {footer?<div style={{display:'flex',alignItems:'center',padding:'0 18px',borderTop:'1px solid '+v21.line,background:'#fbfdff'}}>{footer}</div>:null}
  </Panel>;

const Intro=()=>{
  const f=useCurrentFrame(); const p=reveal(f,0,24);
  const tiles=[
    ['BROWSER','Review Queue'],['TERMINAL','pnpm verify'],['GITHUB','PR #280'],
    ['VSCODE','TechnicalLessonTemplate'],['CHAT','agent + tool'],['MOBILE','review on phone']
  ];
  return <Stage kicker="N4 SHOWCASE 04 · UI + CODE" title="INTERFACE É COMPONENTE EXECUTÁVEL" subtitle="A mesma linguagem representa produto, terminal, código e conversa sem depender de screenshot frágil." proof={['STATE','ACTION','RESULT']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gridTemplateRows:'repeat(3,1fr)',gap:14}}>
      {tiles.map(([a,b],i)=>{
        const q=interpolate(p,[i*.08,Math.min(1,i*.08+.5)],[0,1],clamp);
        return <Panel key={a} style={{padding:22,display:'grid',alignContent:'space-between',background:i===0?'linear-gradient(145deg,#fff,#eaf2ff)':'rgba(255,255,255,.9)',opacity:q,transform:`translateY(${(1-q)*14}px)`}}>
          <Chip tone={i%3===0?'blue':i%3===1?'violet':'green'}>{a}</Chip>
          <div style={{fontSize:27,fontWeight:950,lineHeight:1.05}}>{b}</div>
          <div style={{height:6,borderRadius:99,background:['#245cff','#7257ff','#10b981'][i%3],opacity:.35}}/>
        </Panel>;
      })}
    </div>
  </Stage>;
};

const Browser=()=>{
  const f=useCurrentFrame(); const select=f>Math.max(12,Math.floor(uiCodeSync.scenes.browser!.durationFrames*.45));
  const rows=[
    ['N4 Factory Tour','REVIEW','82s'],
    ['Integrations','REVIEW','58s'],
    ['Asset + Audio','REVIEW','54s']
  ];
  return <Stage kicker="01 · BROWSER WINDOW" title="O PRODUTO MOSTRA ESTADO E CONSEQUÊNCIA" subtitle="A cena não descreve a Review Queue: ela demonstra seleção, status e painel de detalhe." proof={['QUEUE','SELECT','DETAIL']}>
    <WindowShell title="mcf-content-hub / review" footer={<><StatusDot label="manifest loaded"/><div style={{marginLeft:'auto'}}><Chip tone="green">3 items</Chip></div></>}>
      <div style={{height:'100%',display:'grid',gridTemplateColumns:'1.12fr .88fr',gap:14,padding:16,background:'#f8fbff'}}>
        <Panel style={{padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:26,fontWeight:950}}>Review Queue</div><Chip>latest batch</Chip>
          </div>
          <div style={{display:'grid',gap:10,marginTop:16}}>
            {rows.map((r,i)=><div key={r[0]} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:12,alignItems:'center',padding:'15px 14px',borderRadius:16,border:'1px solid '+(select&&i===0?v21.blue:v21.line),background:select&&i===0?'#eef3ff':'white',boxShadow:select&&i===0?'0 12px 32px rgba(36,92,255,.12)':'none'}}>
              <strong style={{fontSize:17}}>{r[0]}</strong><Chip tone="violet">{r[1]}</Chip><span style={{fontSize:14,color:v21.muted}}>{r[2]}</span>
            </div>)}
          </div>
        </Panel>
        <Panel style={{padding:18,display:'grid',gridTemplateRows:'auto auto 1fr auto',gap:14}}>
          <div style={{fontSize:14,letterSpacing:2,fontWeight:900,color:v21.muted}}>DETAIL</div>
          <div style={{fontSize:24,fontWeight:950}}>{select?'N4 Factory Tour':'Select an item'}</div>
          <div style={{display:'grid',gap:10,alignContent:'start'}}>
            <StatusDot label={select?'visual PASS':'waiting'} ok={select}/>
            <StatusDot label={select?'audio PASS':'waiting'} ok={select}/>
            <StatusDot label={select?'A/V sync PASS':'waiting'} ok={select}/>
          </div>
          <div style={{height:58,borderRadius:16,display:'grid',placeItems:'center',background:select?v21.blue:'#e8eef9',color:select?'white':v21.muted,fontWeight:900}}>WATCH</div>
        </Panel>
      </div>
    </WindowShell>
  </Stage>;
};

const Terminal=()=>{
  const f=useCurrentFrame(); const total=uiCodeSync.scenes.terminal!.durationFrames;
  const command="pnpm verify"; const count=Math.min(command.length,Math.floor(f/3));
  const show1=f>total*.34,show2=f>total*.52,show3=f>total*.69,showDone=f>total*.84;
  return <Stage kicker="02 · TERMINAL WINDOW" title="COMANDO → EXECUÇÃO → PROVA" subtitle="O viewer acompanha o processo; não recebe apenas o estado final." proof={['COMMAND','RUN','PASS']}>
    <WindowShell title="terminal — mcf-content-studio" footer={<div style={{display:'flex',gap:12}}><Chip>exit 0</Chip>{showDone?<Chip tone="green">verified</Chip>:<Chip tone="amber">running</Chip>}</div>}>
      <div style={{height:'100%',background:'linear-gradient(145deg,#13213d,#09152d)',padding:30,color:'#e7f1ff',fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>
        <div style={{fontSize:25}}><span style={{color:'#64d6ff'}}>$</span> {command.slice(0,count)}<span style={{opacity:f%20<10?1:.2}}>▍</span></div>
        <div style={{display:'grid',gap:16,marginTop:34,fontSize:21}}>
          {show1?<div><span style={{color:'#64d6ff'}}>●</span> typecheck <span style={{color:'#78e6b7'}}>PASS</span></div>:null}
          {show2?<div><span style={{color:'#64d6ff'}}>●</span> tests <span style={{color:'#78e6b7'}}>PASS</span></div>:null}
          {show3?<div><span style={{color:'#64d6ff'}}>●</span> build <span style={{color:'#78e6b7'}}>PASS</span></div>:null}
          {showDone?<div style={{marginTop:18,padding:18,borderRadius:16,background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.4)',color:'#78e6b7'}}>✓ verification complete · 0 failures</div>:null}
        </div>
      </div>
    </WindowShell>
  </Stage>;
};

const GitHub=()=>{
  const f=useCurrentFrame(); const p=reveal(f,6,30);
  return <Stage kicker="03 · GITHUB WINDOW" title="PR, CHECKS E ESTADO NA MESMA CENA" subtitle="A evidência rastreável entra no vídeo como interface, não como legenda abstrata." proof={['PR #280','CHECKS','DRAFT']}>
    <WindowShell title="github.com/leon337/multiagent-collaboration-framework/pull/280" footer={<><Chip tone="violet">DRAFT</Chip><div style={{marginLeft:'auto'}}><Chip tone="green">mergeable</Chip></div></>}>
      <div style={{height:'100%',display:'grid',gridTemplateRows:'116px 1fr',padding:18,gap:14,background:'#f8fbff'}}>
        <Panel style={{padding:18,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div><div style={{fontSize:28,fontWeight:950}}>N4 Showcase Pack</div><div style={{fontSize:16,color:v21.muted,marginTop:6}}>PR #280 · head 6fbf623…</div></div>
          <div style={{display:'flex',gap:8}}><Chip tone="violet">DRAFT</Chip><Chip>86 files</Chip></div>
        </Panel>
        <div style={{display:'grid',gridTemplateColumns:'1fr .9fr',gap:14,minHeight:0}}>
          <Panel style={{padding:18}}>
            <div style={{fontSize:15,letterSpacing:2,fontWeight:900,color:v21.muted}}>CHANGED FILES</div>
            {['UiCodeSimulationShowcase.tsx','Content Hub V2','FactoryTourShowcase.tsx','creative-qa workflow'].map((x,i)=><div key={x} style={{marginTop:11,padding:'13px 12px',borderRadius:14,background:i===3?'#edf3ff':'#fbfdff',border:'1px solid '+(i===3?'#b8caff':v21.line),fontSize:16,fontWeight:i===3?900:700,opacity:interpolate(p,[i*.12,Math.min(1,i*.12+.5)],[0,1],clamp)}}>{x}</div>)}
          </Panel>
          <Panel style={{padding:18}}>
            <div style={{fontSize:15,letterSpacing:2,fontWeight:900,color:v21.muted}}>CHECKS</div>
            <div style={{display:'grid',gap:14,marginTop:18}}>
              <StatusDot label="N4 Validation"/>
              <StatusDot label="Audio Review"/>
              <StatusDot label="Content Hub"/>
              <StatusDot label="Creative QA"/>
            </div>
          </Panel>
        </div>
      </div>
    </WindowShell>
  </Stage>;
};

const VSCode=()=>{
  const f=useCurrentFrame(); const total=uiCodeSync.scenes.vscode!.durationFrames; const idx=Math.min(4,Math.floor(f/Math.max(1,total/5)));
  const lines=[
    "export const TechnicalLessonTemplate = ({spec}) => {",
    "  const scenes = spec.scenes.map((scene) => {",
    "    const Component = registry.resolve(scene.componentId);",
    "    return <Component {...scene.props} />;",
    "  });",
    "  return <>{scenes}</>;",
    "};"
  ];
  return <Stage kicker="04 · VS CODE WINDOW" title="CÓDIGO LEGÍVEL, COM FOCO E CONTEXTO" subtitle="Explorer, arquivo ativo e linha destacada permanecem separados e legíveis." proof={['FILE','LINE','BEHAVIOR']}>
    <WindowShell title="VS Code — TechnicalLessonTemplate.tsx" footer={<><Chip>TypeScript</Chip><div style={{marginLeft:'auto'}}><Chip tone="green">0 problems</Chip></div></>}>
      <div style={{height:'100%',display:'grid',gridTemplateColumns:'210px 1fr',background:'#fbfdff'}}>
        <div style={{borderRight:'1px solid '+v21.line,padding:16,background:'#f1f6ff'}}>
          <div style={{fontSize:13,letterSpacing:2,fontWeight:900,color:v21.muted}}>EXPLORER</div>
          {['src/','  templates/','    TechnicalLessonTemplate.tsx','  registry/','  components/'].map((x,i)=><div key={x+i} style={{fontFamily:'ui-monospace,monospace',fontSize:14,marginTop:14,color:i===2?v21.blue:v21.ink,fontWeight:i===2?900:650}}>{x}</div>)}
        </div>
        <div style={{padding:22,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',fontSize:18,lineHeight:1.65,overflow:'hidden'}}>
          {lines.map((line,i)=><div key={line+i} style={{display:'grid',gridTemplateColumns:'36px 1fr',padding:'4px 10px',borderRadius:10,background:i===idx?'#e9f1ff':'transparent',borderLeft:i===idx?'4px solid '+v21.blue:'4px solid transparent'}}>
            <span style={{color:'#9aacca'}}>{i+1}</span><span style={{whiteSpace:'pre'}}>{line}</span>
          </div>)}
        </div>
      </div>
    </WindowShell>
  </Stage>;
};

const Chat=()=>{
  const f=useCurrentFrame(); const total=uiCodeSync.scenes.chat!.durationFrames;
  const steps=[
    ['USER','valide o showcase.','blue'],
    ['AGENT','consulto a fonte antes de afirmar.','violet'],
    ['TOOL','workflow 35502529491 → SUCCESS','green'],
    ['AGENT','evidência registrada.','violet']
  ] as const;
  const shown=Math.min(steps.length,1+Math.floor(f/Math.max(1,total/steps.length)));
  return <Stage kicker="05 · CHAT + TOOL" title="A CONVERSA MOSTRA QUEM DISSE E QUEM PROVOU" subtitle="Usuário, agente e ferramenta têm papéis visuais distintos." proof={['REQUEST','TOOL CALL','EVIDENCE']}>
    <WindowShell title="MCF agent trace" footer={<><Chip>source: GitHub</Chip><div style={{marginLeft:'auto'}}>{shown===4?<Chip tone="green">evidence bound</Chip>:<Chip tone="amber">resolving</Chip>}</div></>}>
      <div style={{height:'100%',padding:22,display:'grid',alignContent:'center',gap:14,background:'#f8fbff'}}>
        {steps.slice(0,shown).map(([role,msg,tone],i)=><div key={role+msg} style={{display:'grid',gridTemplateColumns:'92px 1fr',gap:12,alignItems:'start',opacity:reveal(f,i*Math.max(1,total/steps.length),14)}}>
          <Chip tone={tone as 'blue'|'violet'|'green'}>{role}</Chip>
          <Panel style={{padding:16,background:role==='TOOL'?'#eafbf4':'white',borderColor:role==='TOOL'?'#b9efd9':v21.line}}>
            <div style={{fontSize:20,lineHeight:1.4,fontWeight:role==='TOOL'?850:700}}>{msg}</div>
          </Panel>
        </div>)}
      </div>
    </WindowShell>
  </Stage>;
};

const Mobile=()=>{
  const f=useCurrentFrame(); const total=uiCodeSync.scenes.mobile!.durationFrames;
  const tapped=f>total*.43;
  return <Stage kicker="06 · MOBILE WINDOW" title="O MESMO PRODUTO, OUTRO VIEWPORT" subtitle="A cena mostra navegação e estado mobile em vez de deixar um telefone vazio." proof={['LIST','TAP','DETAIL']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'.78fr 1.22fr',gap:18,alignItems:'center'}}>
      <Panel style={{padding:22,display:'grid',gap:14,alignContent:'center'}}>
        <Chip>MOBILE FLOW</Chip>
        <div style={{fontSize:35,fontWeight:950,lineHeight:1.05}}>Review Queue → Watch</div>
        <div style={{fontSize:20,color:v21.muted,lineHeight:1.45}}>O tap muda o estado do produto e preserva o mesmo vocabulário visual.</div>
        <StatusDot label={tapped?'detail open':'queue visible'}/>
      </Panel>
      <div style={{height:'100%',display:'grid',placeItems:'center'}}>
        <div style={{width:420,height:760,borderRadius:56,border:'10px solid #d4e1ff',background:'white',boxShadow:'0 34px 90px rgba(36,92,255,.18)',padding:18,boxSizing:'border-box',position:'relative',overflow:'hidden'}}>
          <div style={{width:110,height:24,borderRadius:99,background:'#e8efff',margin:'0 auto 18px'}}/>
          {!tapped?<>
            <div style={{fontSize:28,fontWeight:950}}>Review Queue</div>
            <div style={{display:'grid',gap:12,marginTop:20}}>
              {['Factory Tour','Integrations','Motion System'].map((x,i)=><div key={x} style={{padding:16,borderRadius:18,background:i===0?'#edf3ff':'#f8fbff',border:'1px solid '+(i===0?'#b7c8ff':v21.line)}}>
                <div style={{fontSize:18,fontWeight:900}}>{x}</div><div style={{marginTop:8}}><Chip tone="violet">REVIEW</Chip></div>
              </div>)}
            </div>
            <div style={{position:'absolute',left:160,top:190,fontSize:40}}>☝</div>
          </>:<>
            <Chip tone="green">WATCH</Chip>
            <div style={{fontSize:28,fontWeight:950,marginTop:18}}>N4 Factory Tour</div>
            <div style={{height:280,borderRadius:26,background:'linear-gradient(145deg,#182b50,#245cff)',marginTop:22,display:'grid',placeItems:'center',color:'white',fontSize:56}}>▶</div>
            <div style={{display:'grid',gap:10,marginTop:18}}><StatusDot label="visual PASS"/><StatusDot label="audio PASS"/><StatusDot label="sync PASS"/></div>
          </>}
        </div>
      </div>
    </div>
  </Stage>;
};

const Close=()=>{
  return <Stage kicker="N4 VIDEO ENGINE" title="UMA GRAMÁTICA. SEIS SUPERFÍCIES." subtitle="Browser, Terminal, GitHub, VS Code, Chat e Mobile viram cenas controladas por dados." proof={['COMPONENT','STATE','REUSE']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gridTemplateRows:'repeat(2,1fr)',gap:14}}>
      {['Browser','Terminal','GitHub','VS Code','Chat','Mobile'].map((x,i)=><Panel key={x} style={{padding:20,display:'grid',alignContent:'space-between',background:i%2?'linear-gradient(145deg,#fff,#f2efff)':'linear-gradient(145deg,#fff,#eef4ff)'}}>
        <Chip tone={i%2?'violet':'blue'}>{String(i+1).padStart(2,'0')}</Chip><div style={{fontSize:27,fontWeight:950}}>{x}</div><div style={{fontSize:15,color:v21.muted}}>controlled props</div>
      </Panel>)}
    </div>
  </Stage>;
};

const Scene=({id,children}:{id:keyof typeof uiCodeSync.scenes;children:React.ReactNode})=>{
  const s=uiCodeSync.scenes[id]!;
  return <Sequence from={s.from} durationInFrames={s.durationFrames}>{children}</Sequence>;
};

export const UiCodeShowcaseV21=()=> <AbsoluteFill>
  <Scene id="intro"><Intro/></Scene>
  <Scene id="browser"><Browser/></Scene>
  <Scene id="terminal"><Terminal/></Scene>
  <Scene id="github"><GitHub/></Scene>
  <Scene id="vscode"><VSCode/></Scene>
  <Scene id="chat"><Chat/></Scene>
  <Scene id="mobile"><Mobile/></Scene>
  <Scene id="close"><Close/></Scene>
  <CaptionOverlay cues={cues}/>
</AbsoluteFill>;
