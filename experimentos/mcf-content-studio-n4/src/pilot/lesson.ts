export const RUNTIME_AGENTICO_PILOT = {
  id:'runtime-agentico-n4-pilot',
  title:'Runtime agêntico moderno',
  fps:30,
  width:1080,
  height:1920,
  scenes:[
    {id:'map',from:0,duration:90},
    {id:'model',from:90,duration:150},
    {id:'access',from:240,duration:150},
    {id:'agent',from:390,duration:150},
    {id:'session',from:540,duration:180},
    {id:'state-events-artifacts',from:720,duration:210},
    {id:'runtime',from:930,duration:180},
    {id:'permission',from:1110,duration:150},
    {id:'application',from:1260,duration:150},
    {id:'recall',from:1410,duration:180},
    {id:'rebuild',from:1590,duration:240},
    {id:'summary',from:1830,duration:180},
  ],
} as const;

export const RUNTIME_AGENTICO_PILOT_DURATION =
  RUNTIME_AGENTICO_PILOT.scenes.at(-1)!.from +
  RUNTIME_AGENTICO_PILOT.scenes.at(-1)!.duration;
