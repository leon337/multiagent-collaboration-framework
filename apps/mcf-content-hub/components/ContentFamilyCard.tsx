import Link from 'next/link';
import type {ContentFamily} from '@/lib/content-view';
import {StatusPill} from './StatusPill';
export function ContentFamilyCard({family}:{family:ContentFamily}){const item=family.latest;return <article className="family-card"><Link href={'/videos/'+item.slug} className="family-link"><div className="family-visual"><div className="play-disc">▶</div><div className="family-top"><StatusPill status={item.status}/><span>latest v{item.version}</span></div></div><div className="family-body"><div className="eyebrow">{item.kind.toUpperCase()}</div><h2>{item.title}</h2><p>{item.summary}</p><div className="family-footer"><span>{family.versions.length} {family.versions.length===1?'versão':'versões'}</span><span>Ver conteúdo →</span></div></div></Link></article>;}
