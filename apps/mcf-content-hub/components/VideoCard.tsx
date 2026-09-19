import Link from 'next/link';
import type {ContentItem} from '@/lib/types';
import {StatusPill} from './StatusPill';
const check=(value:string)=>value==='PASS'?'✓':'○';
export function VideoCard({item}:{item:ContentItem}){return <Link href={'/videos/'+item.slug} className="video-card"><div className="thumb">{item.posterUrl?<img src={item.posterUrl} alt="" />:<div className="thumb-fallback"><span>▶</span><small>{item.aspect}</small></div>}<div className="thumb-top"><StatusPill status={item.status}/><span>v{item.version}</span></div></div><div className="card-body"><div className="eyebrow">{item.kind.toUpperCase()} · {item.factoryRun??'factory run'}</div><h3>{item.title}</h3><p>{item.summary}</p><div className="qa-row"><span>{check(item.qa.visual)} visual</span><span>{check(item.qa.audio)} áudio</span><span>{check(item.qa.captions)} captions</span><span>{check(item.qa.ci)} CI</span></div></div></Link>;}
