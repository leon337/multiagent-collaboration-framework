import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type AvatarBadgeProps=CommonProps&{name?:string;role?:string;initials?:string;status?:string};

export const AvatarBadge=({aspect='9:16',reducedMotion=false,name='Agente N4',role='Direção visual',initials='N4',status='ATIVO'}:AvatarBadgeProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{display:'grid',placeItems:'center'}}>
    <Card style={{width:aspect==='9:16'?'100%':'70%',display:'flex',alignItems:'center',gap:28}}>
      <div style={{width:120,height:120,borderRadius:999,display:'grid',placeItems:'center',background:designTokens.color.accent,color:'white',fontSize:40,fontWeight:900}}>{initials}</div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:40,fontWeight:900}}>{name}</div>
        <div style={{fontSize:26,color:designTokens.color.muted,marginTop:8}}>{role}</div>
        <div style={{display:'inline-block',marginTop:16,padding:'7px 12px',borderRadius:999,background:'rgba(88,214,141,.14)',color:designTokens.color.positive,fontSize:18,fontWeight:850}}>{status}</div>
      </div>
    </Card>
  </SafeFrame>;
