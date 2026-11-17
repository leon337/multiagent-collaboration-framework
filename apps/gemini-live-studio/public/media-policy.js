/* Gemini Live Studio F2.1 — opt-in visual media lifecycle.
 * No automatic re-acquisition, persistence, or background transmission.
 * Isolated from the voice/audio pipeline. */
(function(global){
 'use strict';
 function createMediaController(deps){
  const {requestConsent,requestCamera,requestScreen,isConnected,onStart,onStop,onError}=deps||{};
  if([requestConsent,requestCamera,requestScreen,isConnected,onStart,onStop].some(f=>typeof f!=='function'))
   throw Error('Media controller requires explicit consent and lifecycle callbacks');
  const streams={camera:null,screen:null};
  let pending=null,epoch=0;
  const stopTracks=stream=>{
   for(const track of stream?.getTracks?.()||[]){
    try{track.onended=null;track.stop();}catch{}
   }
  };
  function stop(kind,expectedStream){
   if(kind!=='camera'&&kind!=='screen')return;
   // Abort any pending request of that kind, even before browser permission resolves.
   if(pending===kind){epoch++;pending=null;}
   const active=streams[kind];
   if(expectedStream&&expectedStream!==active)return;
   if(!active)return;
   streams[kind]=null;
   stopTracks(active);
   onStop(kind);
  }
  function stopAll(){
   epoch++;pending=null;
   stop('camera');stop('screen');
  }
  async function start(kind){
   if(kind!=='camera'&&kind!=='screen')return false;
   if(pending||streams[kind]||!isConnected())return false;
   pending=kind;
   const myEpoch=++epoch;
   let candidate=null;
   try{
    const accepted=await requestConsent(kind);
    if(!accepted||epoch!==myEpoch||!isConnected())return false;
    candidate=kind==='camera'?await requestCamera():await requestScreen();
    if(!candidate||!candidate.getVideoTracks?.().some(t=>t.readyState==='live'))
     throw Error('Nenhuma faixa visual ativa foi concedida.');
    if(epoch!==myEpoch||!isConnected()){stopTracks(candidate);return false;}
    // Keep just one image source. Switch after successfully acquiring the new one,
    // so denial of access does not silently cancel an existing visual source.
    const other=kind==='camera'?'screen':'camera';
    stop(other);
    const owned=candidate;
    streams[kind]=owned;
    for(const track of owned.getTracks()){
     track.onended=()=>{if(streams[kind]===owned)stop(kind,owned);};
    }
    onStart(kind,owned);
    candidate=null;
    return true;
   }catch(err){
    if(candidate)stopTracks(candidate);
    if(epoch===myEpoch&&typeof onError==='function')onError(kind,err);
    return false;
   }finally{
    if(pending===kind&&epoch===myEpoch)pending=null;
   }
  }
  return Object.freeze({
   start,stop,stopAll,
   getActive:kind=>streams[kind]||null,
   getPending:()=>pending,
   isSharing:()=>!!(streams.camera||streams.screen)
  });
 }
 global.MCFMediaPolicy=Object.freeze({createMediaController});
})(typeof window!=='undefined'?window:globalThis);
