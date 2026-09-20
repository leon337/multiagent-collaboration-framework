import Link from 'next/link';
import {getContentItems} from '@/lib/content';
import {getContentFamilies,getFactoryRuns,getReviewBatches} from '@/lib/content-view';
import {StatusPill} from '@/components/StatusPill';
export const dynamic='force-dynamic';
export default async function Home(){
  const items=await getContentItems();
  const batches=getReviewBatches(items);
  const families=getContentFamilies(items);
  const runs=getFactoryRuns(items);
  const current=batches[0];
  const queueCount=batches.reduce((total,batch)=>total+batch.items.length,0);
  const approved=items.filter((item)=>item.status==='APPROVED').length;
  const published=items.filter((item)=>item.status==='PUBLISHED').length;
  return <div className="page overview-page">
    <section className="overview-head"><div><div className="eyebrow">MCF CONTENT HUB</div><h1>Review & Delivery Console</h1><p>Uma superfície para revisar, rastrear e versionar outputs do Content Studio sem confundir review com publicação.</p></div><div className="metric-strip"><div><strong>{items.length}</strong><span>outputs</span></div><div><strong>{queueCount}</strong><span>na fila</span></div><div><strong>{approved}</strong><span>aprovados</span></div><div><strong>{published}</strong><span>publicados</span></div></div></section>
    {!process.env.BLOB_READ_WRITE_TOKEN&&<section className="notice"><strong>Manifesto remoto indisponível.</strong><span>Esta visualização está usando o seed local; nenhum estado é promovido por isso.</span></section>}
    <section className="overview-grid">
      <article className="focus-card review-focus"><div className="card-label">PRECISA DA SUA REVISÃO</div>{current?<><div className="focus-title-row"><div><h2>V{current.version} · {current.items.length} outputs</h2><p className="mono subtle">{current.mission}</p></div><StatusPill status="REVIEW"/></div><div className="review-preview">{current.items.slice(0,4).map((item)=><span key={item.slug}>{item.title.replace(/^N4 (Factory )?Showcase — /,'')}</span>)}</div><Link className="primary-action" href="/review">Abrir Review Queue →</Link></>:<><h2>Nenhum item aguardando revisão</h2><p>Quando uma factory run chegar a REVIEW, ela aparecerá aqui.</p></>}</article>
      <article className="focus-card"><div className="card-label">LATEST FACTORY RUN</div>{runs[0]?<><h2>{runs[0].run}</h2><p className="subtle">{runs[0].items.length} outputs neste batch</p><div className="pipeline compact">{runs[0].stages.map((stage)=><div key={stage.key} className={'stage stage-'+stage.state.toLowerCase()}><i/>{stage.label}</div>)}</div><Link className="secondary-action" href="/factory-runs">Ver Factory Runs →</Link></>:<p>Nenhuma execução registrada.</p>}</article>
    </section>
    <section className="section-head"><div><span>LIBRARY</span><h2>Conteúdo por família</h2></div><Link className="text-link" href="/library">Abrir biblioteca completa →</Link></section>
    <section className="family-summary">{families.slice(0,4).map((family)=><Link href={'/videos/'+family.latest.slug} className="summary-row" key={family.key}><div><strong>{family.latest.title}</strong><span>{family.versions.length} {family.versions.length===1?'versão':'versões'}</span></div><div><StatusPill status={family.latest.status}/><span>v{family.latest.version}</span></div></Link>)}</section>
  </div>;
}
