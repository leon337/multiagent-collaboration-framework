import {Img,staticFile} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type ScreenshotFrameProps=CommonProps&{
  title?:string;
  src?:string;
  caption?:string;
};

export const ScreenshotFrame=({aspect='9:16',reducedMotion=false,title='Screenshot',src='',caption='Imagem enquadrada como evidência visual.'}:ScreenshotFrameProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'18px 24px',background:designTokens.color.surfaceStrong,fontSize:24,fontWeight:800}}>{title}</div>
      <div style={{minHeight:aspect==='9:16'?720:480,display:'grid',placeItems:'center',background:'#05070c'}}>
        {src
          ? <Img src={src.startsWith('/')?staticFile(src.slice(1)):src} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
          : <div style={{width:'82%',height:'72%',border:`2px dashed ${designTokens.color.line}`,borderRadius:24,display:'grid',placeItems:'center',color:designTokens.color.muted,fontSize:28}}>SCREENSHOT / MEDIA</div>}
      </div>
      <div style={{padding:'18px 24px',fontSize:24,lineHeight:1.4,color:designTokens.color.muted}}>{caption}</div>
    </Card>
  </SafeFrame>;
};
