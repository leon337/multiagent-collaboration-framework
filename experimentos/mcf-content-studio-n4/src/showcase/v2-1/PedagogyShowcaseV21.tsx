import {AbsoluteFill,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {pedagogySync} from '../phase-b/synced';
import {Chip,Node,Panel,Stage,StatusDot,reveal,v21} from './shared';

const cues=pedagogySync.cues;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

const Intro=()=>{
  const f=useCurrentFrame(); const p=reveal(f,0,24);
  const steps=[['ASK','recall'],['COMPARE','quiz'],['CONNECT','concepts'],['DECIDE','checkpoint']];
  return <Stage kicker="N4 SHOWCASE 05 · PEDAGOGIA" title="A CENA TAMBÉM CONTROLA COMO A IDEIA É APRENDIDA" subtitle="O viewer não recebe só conteúdo: ele recupera, compara, conecta e decide." proof={['PROMPT','RESPONSE','LEARNING']}>
    <Panel style={{height:'100%',position:'relative',padding:26}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,alignItems:'center',height:'100%'}}>
        {steps.map(([a,b],i)=><div key={a} style={{display:'grid',alignContent:'center',gap:14,opacity:interpolate(p,[i*.12,Math.min(1,i*.12+.5)],[0,1],clamp),transform:\`translateY(\${(1-p)*12}px)\`}}>
          <Node label={a} value={b} accent={[v21.blue,v21.violet,v21.cyan,v21.green][i]} active/>
          {i<3?<div style={{fontSize:42,textAlign:'center',color:v21.blue}}>→</div>:null}
        </div>)}
      </div>
    </Panel>
  </Stage>;
};

const Recall=()=>{
  const f=useCurrentFrame(); const total=pedagogySync.scenes.recall.durationFrames;
  const revealAnswer=f>Math.max(20,total*.55);
  return <Stage kicker="01 · ACTIVE RECALL" title="PRIMEIRO RECUPERA. DEPOIS REVELA." subtitle="A pausa cria uma decisão cognitiva antes da resposta." proof={['QUESTION','THINK','REVEAL']}>
    <div style={{height:'100%',display:'grid',gridTemplateRows:'1fr 1fr',gap:18}}>
      <Panel style={{padding:28,display:'grid',gridTemplateColumns:'.7fr 1.3fr',gap:20,alignItems:'center'}}>
        <div><Chip>QUESTION</Chip><div style={{fontSize:28,fontWeight:950,lineHeight:1.1,marginTop:16}}>Quem executa a ação?</div></div>
        <div style={{height:150,borderRadius:24,border:'2px dashed #b8c9ef',background:'#f8fbff',display:'grid',placeItems:'center',fontSize:21,color:v21.muted}}>{revealAnswer?'':'pense antes de revelar…'}</div>
      </Panel>
      <Panel style={{padding:28,display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center',opacity:revealAnswer?1:.16,transform:\`translateY(\${revealAnswer?0:18}px)\`,borderColor:revealAnswer?'#a5e6cd':v21.line,background:revealAnswer?'#effbf6':'white'}}>
        <div><Chip tone="green">ANSWER</Chip><div style={{fontSize:34,fontWeight:950,marginTop:16}}>O runtime autorizado.</div></div>
        <div style={{fontSize:64,color:v21.green}}>✓</div>
      </Panel>
    </div>
  </Stage>;
};

const Quiz=()=>{
  const f=useCurrentFrame(); const total=pedagogySync.scenes.quiz.durationFrames; const revealAns=f>total*.58;
  const options=['Title','Active Recall','Background'];
  return <Stage kicker="02 · QUIZ" title="UMA ESCOLHA TORNA O MODELO VISÍVEL" subtitle="O estado muda quando a resposta correta é revelada." proof={['OPTIONS','SELECT','FEEDBACK']}>
    <Panel style={{height:'100%',padding:28,display:'grid',gridTemplateRows:'auto 1fr auto',gap:18}}>
      <div style={{fontSize:28,fontWeight:950}}>Qual recurso força uma decisão antes da resposta?</div>
      <div style={{display:'grid',gap:14,alignContent:'center'}}>
        {options.map((x,i)=>{const active=revealAns&&i===1; return <div key={x} style={{display:'grid',gridTemplateColumns:'56px 1fr auto',alignItems:'center',gap:14,padding:'18px 20px',borderRadius:20,border:'2px solid '+(active?v21.green:v21.line),background:active?'#ecfbf5':'#fbfdff',opacity:revealAns&&!active?.44:1}}>
          <div style={{width:46,height:46,borderRadius:99,display:'grid',placeItems:'center',background:active?v21.green:'#edf3ff',color:active?'white':v21.ink,fontWeight:950}}>{String.fromCharCode(65+i)}</div>
          <div style={{fontSize:23,fontWeight:850}}>{x}</div>
          {active?<Chip tone="green">CORRETA</Chip>:null}
        </div>})}
      </div>
      <StatusDot label={revealAns?'feedback imediato':'aguardando escolha'}/>
    </Panel>
  </Stage>;
};

const ErrorCorrect=()=>{
  const f=useCurrentFrame(); const p=reveal(f,8,32);
  return <Stage kicker="03 · CONTRASTE" title="O ERRO E O MODELO CORRETO DIVIDEM A TELA" subtitle="A comparação reduz ambiguidade porque o viewer vê a diferença no mesmo instante." proof={['WRONG','COMPARE','RIGHT']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
      <Panel style={{padding:26,borderColor:'#ffc6d2',background:'#fff8fa',transform:\`translateX(\${(1-p)*-26}px)\`}}>
        <Chip tone="red">EVITE</Chip>
        <div style={{fontSize:44,fontWeight:950,lineHeight:1.05,marginTop:34}}>Capacidade = permissão</div>
        <div style={{marginTop:34,fontSize:80,color:v21.red}}>×</div>
        <div style={{fontSize:19,color:v21.muted}}>Confunde o que pode existir com o que pode ser executado.</div>
      </Panel>
      <Panel style={{padding:26,borderColor:'#a7e6cd',background:'#f0fbf6',transform:\`translateX(\${(1-p)*26}px)\`}}>
        <Chip tone="green">PREFIRA</Chip>
        <div style={{fontSize:44,fontWeight:950,lineHeight:1.05,marginTop:34}}>Capacidade ≠ permissão</div>
        <div style={{marginTop:34,fontSize:80,color:v21.green}}>✓</div>
        <div style={{fontSize:19,color:v21.muted}}>A aplicação governa o uso mesmo quando a capacidade existe.</div>
      </Panel>
    </div>
  </Stage>;
};

const Progressive=()=>{
  const f=useCurrentFrame(); const total=pedagogySync.scenes.progressive.durationFrames;
  const concepts=['FONTE','MODELO','RUNTIME','GATE'];
  const active=Math.min(concepts.length-1,Math.floor(f/Math.max(1,total/concepts.length)));
  return <Stage kicker="04 · PROGRESSÃO" title="UM CONCEITO ENTRA DE CADA VEZ" subtitle="A sequência preserva a relação causal sem despejar tudo no primeiro frame." proof={['SOURCE','RUNTIME','GATE']}>
    <Panel style={{height:'100%',position:'relative',padding:30,display:'grid',alignItems:'center'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:18}}>
        {concepts.map((c,i)=><div key={c} style={{display:'grid',gap:18,alignContent:'center'}}>
          <Node label={'0'+(i+1)} value={c} active={i<=active} accent={i===3?v21.green:i===2?v21.violet:v21.blue} style={{opacity:i<=active?1:.22,transform:\`scale(\${i===active?1.06:1})\`}}/>
          {i<3?<div style={{fontSize:36,textAlign:'center',color:i<active?v21.green:'#b9c7e6'}}>→</div>:null}
        </div>)}
      </div>
      <div style={{position:'absolute',left:30,right:30,bottom:28,height:9,borderRadius:99,background:'#e9effb',overflow:'hidden'}}><div style={{height:'100%',width:\`\${(active+1)/4*100}%\`,background:'linear-gradient(90deg,#245cff,#48c7ff,#10b981)'}}/></div>
    </Panel>
  </Stage>;
};

const Checkpoint=()=>{
  const f=useCurrentFrame(); const p=reveal(f,8,30);
  return <Stage kicker="05 · CHECKPOINT" title="O VIEWER ENXERGA O QUE JÁ SABE E O QUE AINDA FALTA" subtitle="O estado de aprendizagem vira parte explícita da composição." proof={['KNOWN','NEXT','DECIDE']}>
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
      <Panel style={{padding:26,transform:\`translateY(\${(1-p)*16}px)\`}}>
        <Chip tone="green">VOCÊ JÁ SABE</Chip>
        {['Fonte antes da narrativa','Runtime executa'].map(x=><div key={x} style={{display:'flex',gap:14,alignItems:'center',fontSize:23,fontWeight:850,marginTop:24}}><span style={{color:v21.green}}>✓</span>{x}</div>)}
      </Panel>
      <Panel style={{padding:26,transform:\`translateY(\${(1-p)*-16}px)\`}}>
        <Chip>AGORA FALTA</Chip>
        <div style={{display:'flex',gap:14,alignItems:'center',fontSize:25,fontWeight:950,marginTop:24}}><span style={{color:v21.blue}}>○</span>Gate humano decide</div>
        <div style={{marginTop:34,padding:18,borderRadius:18,background:'#eef3ff',fontSize:18,color:v21.muted,lineHeight:1.45}}>A automação para antes da promoção quando a revisão humana ainda está aberta.</div>
      </Panel>
    </div>
  </Stage>;
};

const Characters=()=>{
  const f=useCurrentFrame(); const total=pedagogySync.scenes.characters.durationFrames;
  const active=Math.min(3,Math.floor(f/Math.max(1,total/4)));
  const people=[
    ['AGENTE','propõe',v21.blue],['OPERADOR','executa',v21.violet],['REVISOR','verifica',v21.cyan],['HUMANO','decide',v21.green]
  ];
  return <Stage kicker="06 · PERSONAGENS" title="PAPÉIS DISTINTOS, RESPONSABILIDADES DISTINTAS" subtitle="Os personagens ajudam a separar proposta, execução, revisão e decisão." proof={['AGENT','REVIEW','HUMAN']}>
    <Panel style={{height:'100%',position:'relative',padding:30}}>
      <Node label="HUMAN_GATE" value="decision" accent={v21.green} active style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:300}}/>
      {people.map(([a,b,c],i)=>{
        const pos=[[60,80],[620,80],[60,520],[620,520]][i];
        return <Panel key={String(a)} style={{position:'absolute',left:pos[0],top:pos[1],width:280,padding:22,borderColor:i===active?String(c):v21.line,background:i===active?'#fff':'rgba(255,255,255,.82)',boxShadow:i===active?'0 24px 58px rgba(36,92,255,.17)':'0 14px 34px rgba(39,76,154,.08)',opacity:i<=active?1:.35}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:String(c)+'22',display:'grid',placeItems:'center',fontSize:32}}>◉</div>
          <div style={{fontSize:22,fontWeight:950,marginTop:14}}>{a}</div>
          <div style={{fontSize:17,color:v21.muted,marginTop:6}}>{b}</div>
        </Panel>
      })}
    </Panel>
  </Stage>;
};

const Close=()=>{
  return <Stage kicker="N4 LEARNING SYSTEM" title="ASSISTIR É SÓ O COMEÇO" subtitle="Recuperar, comparar, conectar e decidir transforma o vídeo em experiência de aprendizagem." proof={['RECALL','COMPARE','DECIDE']}>
    <Panel style={{height:'100%',padding:30,display:'grid',alignItems:'center'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        {[['RECUPERAR','?'],['COMPARAR','↔'],['CONECTAR','⤴'],['DECIDIR','✓']].map(([a,b],i)=><div key={a} style={{display:'grid',gap:18,alignContent:'center',textAlign:'center'}}>
          <div style={{width:120,height:120,borderRadius:34,margin:'0 auto',display:'grid',placeItems:'center',background:['#eaf0ff','#f0ecff','#eafaff','#e9fbf4'][i],color:[v21.blue,v21.violet,'#1685b2',v21.green][i],fontSize:52,fontWeight:950}}>{b}</div>
          <div style={{fontSize:18,fontWeight:950}}>{a}</div>
        </div>)}
      </div>
    </Panel>
  </Stage>;
};

const Scene=({id,children}:{id:keyof typeof pedagogySync.scenes;children:React.ReactNode})=>{
  const s=pedagogySync.scenes[id]!;
  return <Sequence from={s.from} durationInFrames={s.durationFrames}>{children}</Sequence>;
};

export const PedagogyShowcaseV21=()=> <AbsoluteFill>
  <Scene id="intro"><Intro/></Scene>
  <Scene id="recall"><Recall/></Scene>
  <Scene id="quiz"><Quiz/></Scene>
  <Scene id="error"><ErrorCorrect/></Scene>
  <Scene id="progressive"><Progressive/></Scene>
  <Scene id="checkpoint"><Checkpoint/></Scene>
  <Scene id="characters"><Characters/></Scene>
  <Scene id="close"><Close/></Scene>
  <CaptionOverlay cues={cues}/>
</AbsoluteFill>;
