import {Composition} from 'remotion';
import {RuntimeAgenticoPilot} from '../pilot/RuntimeAgenticoPilot';
import {RUNTIME_AGENTICO_PILOT,RUNTIME_AGENTICO_PILOT_DURATION} from '../pilot/lesson';

export const RemotionRoot=()=> <>
  <Composition
    id="RuntimeAgenticoPilot"
    component={RuntimeAgenticoPilot}
    durationInFrames={RUNTIME_AGENTICO_PILOT_DURATION}
    fps={RUNTIME_AGENTICO_PILOT.fps}
    width={RUNTIME_AGENTICO_PILOT.width}
    height={RUNTIME_AGENTICO_PILOT.height}
  />
</>;
