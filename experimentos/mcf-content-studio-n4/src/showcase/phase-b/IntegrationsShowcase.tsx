import {AbsoluteFill,Sequence} from 'remotion';
import {Title} from '../../components/Title';
import {CodePanel} from '../../components/CodePanel';
import {SafeFrame,Card} from '../../components/shared';
import {BounceHeadlineN4} from '../../components/BounceHeadlineN4';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import adobeFixture from '../../../adobe/mcf-video-engine.bridge.json';
import instavarFixture from '../../../instavar/proof-walkthrough.fixture.json';
import importManifest from '../../importer/rendercomp-bounce-in-headline.manifest.json';
import {toN4Handoff,validateAdobeExpressBridge,type AdobeExpressBridgeSpec} from '../../adobe/bridge';
import {fromInstavarVideoSpec,type InstavarVideoSpec} from '../../preflight/instavar';
import {decideImport} from '../../importer/policy';
import type {ImportManifest} from '../../importer/types';
import {integrationsSync} from './synced';

const Scene=({id,children}:{id:keyof typeof integrationsSync.scenes;children:React.ReactNode})=>{
  const scene=integrationsSync.scenes[id]!;
  return <Sequence from={scene.from} durationInFrames={scene.durationFrames}>{children}</Sequence>;
};

const adobe=adobeFixture as AdobeExpressBridgeSpec;
const adobeFindings=validateAdobeExpressBridge(adobe);
const handoff=toN4Handoff(adobe);
const instavar=fromInstavarVideoSpec(instavarFixture as InstavarVideoSpec);
const importDecision=decideImport(importManifest as ImportManifest);

const Evidence=({label,title,rows}:{label:string;title:string;rows:string[]})=> <SafeFrame style={{justifyContent:'center'}}>
  <div style={{fontSize:24,letterSpacing:4,color:'#7c8cff',fontWeight:850}}>{label}</div>
  <div style={{fontSize:50,fontWeight:900,marginTop:16}}>{title}</div>
  <div style={{display:'grid',gap:16,marginTop:34}}>{rows.map(row=><Card key={row} style={{padding:20,fontSize:23}}>{row}</Card>)}</div>
</SafeFrame>;

export const IntegrationsShowcase=()=> <AbsoluteFill>
  <Scene id="intro"><Title eyebrow="N4 SHOWCASE 07" title="INTEGRAÇÕES GOVERNADAS" subtitle="Handoff com proveniência, limites e revisão explícita."/></Scene>
  <Scene id="adobe"><Evidence label="ADOBE EXPRESS → N4" title="VISUAL REFERENCE + TARGET TOKENS" rows={['handoff: '+adobe.handoffMode,'target: '+handoff.componentId+' · '+handoff.aspect,'validation findings: '+adobeFindings.length]}/></Scene>
  <Scene id="limits"><Evidence label="NON-CLAIMS" title="O BRIDGE DECLARA OS LIMITES" rows={["node introspection: false","token introspection: false","pixel-perfect parity: non-claim"]}/></Scene>
  <Scene id="instavar"><CodePanel title="Instavar VideoSpec 1.0 → N4" language="json" code={'aspect: '+instavar.visuals.aspect+'\ncomponents: '+instavar.scenes.map(s=>s.componentId).join(' → ')+'\nducking: true'}/></Scene>
  <Scene id="importer"><Evidence label="EXTERNAL IMPORTER" title="ADAPTAR ANTES DE PROMOVER" rows={['decision: '+importDecision,'revision: '+importManifest.source.revision.slice(0,10),'license: '+importManifest.license.id,'status: '+importManifest.status]}/></Scene>
  <Scene id="adapted"><BounceHeadlineN4 headline="IMPORT GOVERNADO"/></Scene>
  <Scene id="explain"><Evidence label="EXPLAIN COMPANION" title="SAÍDA PARALELA, NÃO SUBSTITUTA" rows={["status verificado: FINISHED","diretamente assistível","não substitui currículo, merge, deploy ou gate"]}/></Scene>
  <Scene id="close"><Title eyebrow="N4 INTEGRATION POLICY" title="ORIGEM → LIMITE → ADAPTAÇÃO → REVIEW" subtitle="Integração é rastreabilidade, não atalho."/></Scene>
  <CaptionOverlay cues={integrationsSync.cues}/>
</AbsoluteFill>;
