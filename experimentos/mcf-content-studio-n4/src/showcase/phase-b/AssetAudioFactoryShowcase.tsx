import {AbsoluteFill,Sequence} from 'remotion';
import {Title} from '../../components/Title';
import {CodePanel} from '../../components/CodePanel';
import {TerminalWindow} from '../../components/TerminalWindow';
import {SafeFrame,Card} from '../../components/shared';
import {CaptionOverlay} from '../../pilot/CaptionOverlay';
import {searchAssets} from '../../assets/searchAssets';
import {assetsAudioSync} from './synced';

const Scene=({id,children}:{id:keyof typeof assetsAudioSync.scenes;children:React.ReactNode})=>{
  const scene=assetsAudioSync.scenes[id];
  return <Sequence from={scene.from} durationInFrames={scene.durationFrames}>{children}</Sequence>;
};

const AssetSearchScene=()=>{
  const assets=searchAssets({theme:'dark'}).slice(0,8);
  return <SafeFrame style={{justifyContent:'center'}}>
    <div style={{fontSize:24,letterSpacing:4,color:'#7c8cff',fontWeight:850}}>ASSET LIBRARY · APPROVED ONLY</div>
    <div style={{fontSize:52,fontWeight:900,marginTop:16}}>BUSCA POR USO, TIPO E TEMA</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:34}}>
      {assets.map((asset)=><Card key={asset.id} style={{padding:18}}>
        <div style={{fontSize:22,fontWeight:850}}>{asset.id}</div>
        <div style={{fontSize:17,color:'#aab4c6',marginTop:8}}>{asset.type} · {asset.source.kind}</div>
      </Card>)}
    </div>
  </SafeFrame>;
};

const ProceduralScene=()=> <SafeFrame style={{justifyContent:'center'}}>
  <div style={{fontSize:24,letterSpacing:4,color:'#7c8cff',fontWeight:850}}>MATERIALIZAÇÃO</div>
  <div style={{fontSize:50,fontWeight:900,marginTop:16}}>ASSETS PROCEDURAIS</div>
  <div style={{display:'grid',gap:16,marginTop:36}}>
    {[
      ['demo-loop','video','ffmpeg-color-loop-v1'],
      ['ui-click','sound','sine-wav-v1'],
      ['ambient-pulse','sound','sine-wav-v1'],
      ['music-bed','music','sine-wav-v1'],
    ].map(([id,type,generator])=><Card key={id} style={{padding:20,display:'flex',justifyContent:'space-between',gap:20}}>
      <strong style={{fontSize:24}}>{id}</strong><span style={{fontSize:18,color:'#aab4c6'}}>{type} · {generator}</span>
    </Card>)}
  </div>
</SafeFrame>;

export const AssetAudioFactoryShowcase=()=> <AbsoluteFill>
  <Scene id="intro"><Title eyebrow="N4 SHOWCASE 06" title="ASSET + AUDIO FACTORY" subtitle="Busca, materialização, mix, ducking e QA dentro do pipeline."/></Scene>
  <Scene id="assets"><AssetSearchScene/></Scene>
  <Scene id="procedural"><ProceduralScene/></Scene>
  <Scene id="mix"><CodePanel title="LessonAudioMix" language="ts" code={"clips: narration + music + sfx + ambient\nducking: narration → music, ambient\nreductionDb: -9\nattackFrames: 6\nreleaseFrames: 15"}/></Scene>
  <Scene id="ducking"><CodePanel title="Ducking rule" language="json" code={'{"trigger":"narration","targets":["music","ambient"],"reductionDb":-9}'}/></Scene>
  <Scene id="qa"><TerminalWindow command="verify-media-audio.py && verify-audio-loudness.py" output="✓ stream · duration · loudness"/></Scene>
  <Scene id="close"><Title eyebrow="N4 AUDIO SYSTEM" title="ÁUDIO É CONTRATO" subtitle="Narração · Música · SFX · Ambiente · Ducking · QA"/></Scene>
  <CaptionOverlay cues={assetsAudioSync.cues}/>
</AbsoluteFill>;
