import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getContentItem,getContentItems} from '@/lib/content';
import {getVersionHistory} from '@/lib/content-view';
import {StatusPill} from '@/components/StatusPill';
export const dynamic='force-dynamic';
export default async function VideoPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const [item,items]=await Promise.all([getContentItem(slug),getContentItems()]);if(!item) notFound();
  const history=getVersionHistory(items,item);
  return <div className="page watch-page"><div className="breadcrumb"><Link href="/library">Library</Link><span>/</span><span>{item.title}</span></div>
    <section className="watch-head"><div><div className="eyebrow">{item.mission}</div><h1>{item.title}</h1><p>{item.summary}</p></div><div className="watch-meta"><StatusPill status={item.status}/><span>v{item.version}</span><span>{item.aspect}</span>{item.durationSec?<span>{item.durationSec.toFixed(2)}s</span>:null}</div></section>
    <section className="player-shell">{item.videoUrl?<video src={'/api/media/'+item.slug} poster={item.posterUrl} controls playsInline preload="metadata"/>:<div className="player-empty"><div className="play-icon">▶</div><h2>Mídia aguardando storage persistente</h2><p>O registro existe, mas não há URL de mídia disponível nesta fonte.</p></div>}</section>
    <section className="review-status-panel"><div><span className="card-label">HUMAN REVIEW</span><h2>{item.status==='REVIEW'?'Aguardando LEANDRO':item.status}</h2><p>Esta tela não altera o estado do conteúdo. Aprovação e publicação permanecem gates separados.</p></div><StatusPill status={item.status}/></section>
    <section className="detail-grid"><article className="panel"><h3>QA</h3><div className="qa-grid">{Object.entries(item.qa).map(([label,value])=><div key={label}><span>{label}</span><strong className={'qa-'+value.toLowerCase()}>{value}</strong></div>)}</div></article><article className="panel"><h3>Proveniência</h3><dl><div><dt>Issue</dt><dd>{item.issue?'#'+item.issue:'—'}</dd></div><div><dt>PR</dt><dd>{item.pr?'#'+item.pr:'—'}</dd></div><div><dt>Commit</dt><dd className="mono">{item.commit?.slice(0,10)??'—'}</dd></div><div><dt>Run</dt><dd>{item.factoryRun??'—'}</dd></div></dl></article><article className="panel version-panel"><h3>Version History</h3><div className="version-list">{history.map((version)=><Link href={'/videos/'+version.slug} className={version.slug===item.slug?'current':''} key={version.slug}><div><strong>V{version.version}</strong><span>{version.title}</span></div><StatusPill status={version.status}/></Link>)}</div></article></section>
  </div>;
}
