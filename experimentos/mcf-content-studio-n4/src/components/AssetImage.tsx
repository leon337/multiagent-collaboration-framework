import {Img,staticFile} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type AssetImageProps=CommonProps&{src?:string;title?:string;caption?:string;fit?:'contain'|'cover'};

export const AssetImage=({aspect='9:16',reducedMotion=false,src='assets/n4/runtime-node-icon.svg',title='Asset visual',caption='Asset versionado e renderizado sem dependência de rede.',fit='contain'}:AssetImageProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{display:'grid',gap:24}}>
      <div style={{fontSize:36,fontWeight:850}}>{title}</div>
      <div style={{height:aspect==='9:16'?620:430,display:'grid',placeItems:'center',background:'#05070c',borderRadius:20,overflow:'hidden'}}>
        <Img src={staticFile(src)} style={{width:'88%',height:'88%',objectFit:fit}}/>
      </div>
      <div style={{fontSize:26,lineHeight:1.45,color:designTokens.color.muted}}>{caption}</div>
    </Card>
  </SafeFrame>;
