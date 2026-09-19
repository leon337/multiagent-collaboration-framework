export type FitTextOptions={
  text:string;
  preferredPx:number;
  minPx:number;
  softCharacterLimit:number;
};

export const fitTextSize=({text,preferredPx,minPx,softCharacterLimit}:FitTextOptions)=>{
  const normalized=text.trim().replace(/\s+/g,' ');
  if(!normalized || normalized.length<=softCharacterLimit) return preferredPx;
  const ratio=softCharacterLimit/normalized.length;
  const scaled=Math.round(preferredPx*Math.sqrt(Math.max(0.25,ratio)));
  return Math.max(minPx,Math.min(preferredPx,scaled));
};

export const isAtMinimumTextSize=(options:FitTextOptions)=>
  fitTextSize(options)<=options.minPx;
