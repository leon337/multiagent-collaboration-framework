import {AbsoluteFill,Sequence} from 'remotion';
import {Title} from '../../components/Title';
import {BrowserWindow} from '../../components/BrowserWindow';
import {TerminalWindow} from '../../components/TerminalWindow';
import {GitHubWindow} from '../../components/GitHubWindow';
import {VSCodeWindow} from '../../components/VSCodeWindow';
import {ChatWindow} from '../../components/ChatWindow';
import {MobileWindow} from '../../components/MobileWindow';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {uiCodeSync} from './synced';

const Scene=({id,children}:{id:keyof typeof uiCodeSync.scenes;children:React.ReactNode})=>{
  const scene=uiCodeSync.scenes[id]!;
  return <Sequence from={scene.from} durationInFrames={scene.durationFrames}>{children}</Sequence>;
};

export const UiCodeSimulationShowcase=()=> <AbsoluteFill>
  <Scene id="intro"><Title eyebrow="N4 SHOWCASE 04" title="UI + CODE SIMULATION" subtitle="Interfaces editáveis. Código legível. Nenhum screenshot frágil."/></Scene>
  <Scene id="browser"><BrowserWindow url="mcf.local/content-hub/review" headline="Review Queue" body="Produto web simulado com texto, hierarquia e estado controlados por props."/></Scene>
  <Scene id="terminal"><TerminalWindow command="pnpm verify" output="✓ typecheck · tests · build"/></Scene>
  <Scene id="github"><GitHubWindow repo="leon337/multiagent-collaboration-framework" pr="PR #280" status="DRAFT" summary="Estado de revisão transformado em componente rastreável."/></Scene>
  <Scene id="vscode"><VSCodeWindow file="TechnicalLessonTemplate.tsx" code={"export const TechnicalLessonTemplate = ({spec}) => {\n  return renderScenes(spec.scenes);\n};"}/></Scene>
  <Scene id="chat"><ChatWindow title="Agente + Tool" messages={["Usuário: valide o showcase.","Agente: consulto a fonte antes de afirmar.","Tool: workflow SUCCESS.","Agente: evidência registrada."]}/></Scene>
  <Scene id="mobile"><MobileWindow app="MCF CONTENT HUB" title="Review Queue" body="A mesma linguagem visual pode representar um fluxo mobile sem capturar uma tela externa."/></Scene>
  <Scene id="close"><Title eyebrow="N4 VIDEO ENGINE" title="INTERFACE É COMPONENTE" subtitle="Browser · Terminal · GitHub · VSCode · Chat · Mobile"/></Scene>
  <CaptionOverlay cues={uiCodeSync.cues}/>
</AbsoluteFill>;
