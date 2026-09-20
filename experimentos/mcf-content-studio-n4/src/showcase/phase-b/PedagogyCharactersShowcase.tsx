import {AbsoluteFill,Sequence,useCurrentFrame} from 'remotion';
import {Title} from '../../components/Title';
import {ActiveRecall} from '../../components/ActiveRecall';
import {Quiz} from '../../components/Quiz';
import {ErrorVsCorrect} from '../../components/ErrorVsCorrect';
import {ProgressiveConcept} from '../../components/ProgressiveConcept';
import {Checkpoint} from '../../components/Checkpoint';
import {StickRig,type StickRigVariant} from '../../components/StickRig';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {pedagogySync} from './synced';

const Scene=({id,children}:{id:keyof typeof pedagogySync.scenes;children:React.ReactNode})=>{
  const scene=pedagogySync.scenes[id]!;
  return <Sequence from={scene.from} durationInFrames={scene.durationFrames}>{children}</Sequence>;
};

const CharacterCycle=()=>{
  const frame=useCurrentFrame();
  const variants:StickRigVariant[]=['agent','operator','reviewer','human'];
  const characterScene=pedagogySync.scenes.characters!;
  const slice=Math.max(1,Math.ceil(characterScene.durationFrames/variants.length));
  const index=Math.min(variants.length-1,Math.floor(frame/slice));
  const variant=variants[index]!;
  const labels={agent:'AGENTE',operator:'OPERADOR',reviewer:'REVISOR',human:'HUMANO'};
  const poses={agent:'talking',operator:'pointing',reviewer:'thinking',human:'celebrating'} as const;
  return <StickRig variant={variant} label={labels[variant]} pose={poses[variant]} action={variant==='operator'?'pointAt':variant==='agent'?'talk':'react'}/>;
};

export const PedagogyCharactersShowcase=()=>{
  const recallScene=pedagogySync.scenes.recall!;
  const quizScene=pedagogySync.scenes.quiz!;
  return <AbsoluteFill>
    <Scene id="intro"><Title eyebrow="N4 SHOWCASE 05" title="PEDAGOGIA + PERSONAGENS" subtitle="A composição também controla como a ideia é aprendida."/></Scene>
    <Scene id="recall"><ActiveRecall question="Quem executa a ação?" answer="O runtime autorizado." revealAfterFrame={Math.max(45,Math.floor(recallScene.durationFrames*.55))}/></Scene>
    <Scene id="quiz"><Quiz question="Qual recurso força uma decisão antes da resposta?" options={["Title","Active Recall","Background"]} correctIndex={1} revealAfterFrame={Math.max(50,Math.floor(quizScene.durationFrames*.6))}/></Scene>
    <Scene id="error"><ErrorVsCorrect title="Erro vs. correto" wrong="Capacidade = permissão" right="Capacidade ≠ permissão"/></Scene>
    <Scene id="progressive"><ProgressiveConcept title="Construção progressiva" concepts={["Fonte","Modelo","Runtime","Gate"]} linkLabel="→"/></Scene>
    <Scene id="checkpoint"><Checkpoint title="Checkpoint cognitivo" known={["Fonte antes da narrativa","Runtime executa"]} next={["Gate humano decide"]}/></Scene>
    <Scene id="characters"><CharacterCycle/></Scene>
    <Scene id="close"><Title eyebrow="N4 LEARNING SYSTEM" title="ASSISTIR NÃO BASTA" subtitle="Recuperar · comparar · decidir · conectar"/></Scene>
    <CaptionOverlay cues={pedagogySync.cues}/>
  </AbsoluteFill>;
};
