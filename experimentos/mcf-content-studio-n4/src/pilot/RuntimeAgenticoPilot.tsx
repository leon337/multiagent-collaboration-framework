import {AbsoluteFill,Sequence} from 'remotion';
import {
  ActiveRecall,
  AnimatedArrow,
  AnimatedTimeline,
  ArchitectureNode,
  ChapterProgress,
  ErrorVsCorrect,
  FocusConcept,
  ProgressiveDiagram,
  TerminalWindow,
} from '../components';
import {LessonProgressBar} from './LessonProgressBar';
import {CaptionOverlay} from './CaptionOverlay';
import {runtimeAgenticoNarration} from './narration';

const Scene=({from,duration,children}:{from:number;duration:number;children:React.ReactNode})=>
  <Sequence from={from} durationInFrames={duration} premountFor={15}>{children}</Sequence>;

export const RuntimeAgenticoPilot=()=> <AbsoluteFill style={{background:'#080c14'}}>
  <Scene from={0} duration={90}>
    <ChapterProgress chapters={['Modelo','Agente','Sessão','Execução','Governança']} activeIndex={0}/>
  </Scene>

  <Scene from={90} duration={150}>
    <FocusConcept eyebrow="01 • MODELO" title="O modelo decide" body="Contexto entra. Texto, dados ou uma decisão de tool use saem."/>
  </Scene>

  <Scene from={240} duration={150}>
    <ErrorVsCorrect title="Inteligência não é acesso" wrong="Raciocínio = acesso ao sistema" right="Raciocínio ≠ arquivos, rede ou credenciais"/>
  </Scene>

  <Scene from={390} duration={150}>
    <ArchitectureNode label="AGENTE" subtitle="modelo + instruções + tools + policy"/>
  </Scene>

  <Scene from={540} duration={180}>
    <AnimatedTimeline title="A sessão mantém continuidade" items={['turno 1','tool call','turno 2','checkpoint']}/>
  </Scene>

  <Scene from={720} duration={210}>
    <ProgressiveDiagram title="Três papéis diferentes" nodes={['Estado\ncontinuidade','Eventos\nevidência','Artefatos\nproduto']}/>
  </Scene>

  <Scene from={930} duration={180}>
    <TerminalWindow command="pnpm test" output="✓ runtime executou • 128 testes passaram"/>
  </Scene>

  <Scene from={1110} duration={150}>
    <ErrorVsCorrect title="Sandbox" wrong="Capacidade = permissão" right="Capacidade ≠ permissão"/>
  </Scene>

  <Scene from={1260} duration={150}>
    <ArchitectureNode label="APLICAÇÃO" subtitle="sessões + policy + approval + observabilidade"/>
  </Scene>

  <Scene from={1410} duration={180}>
    <ActiveRecall question="Quem executa o comando de verdade?" answer="O ambiente / runtime autorizado." revealAfterFrame={70}/>
  </Scene>

  <Scene from={1590} duration={240}>
    <ProgressiveDiagram title="Reconstruindo a arquitetura" nodes={['Usuário','Aplicação','Agente','Modelo','Ambiente','Sandbox']}/>
  </Scene>

  <Scene from={1830} duration={180}>
    <ProgressiveDiagram title="Seis verbos para lembrar" nodes={['decide','organiza','persiste','executa','limita','governa']}/>
  </Scene>

  <LessonProgressBar/>
  <CaptionOverlay cues={runtimeAgenticoNarration.cues}/>
</AbsoluteFill>;
