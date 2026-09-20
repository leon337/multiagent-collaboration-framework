import Link from 'next/link';
import {getContentItems} from '@/lib/content';
import {getReviewBatches} from '@/lib/content-view';
import {StatusPill} from '@/components/StatusPill';
export const dynamic='force-dynamic';
export default async function ReviewQueue(){
  const batches=getReviewBatches(await getContentItems());
  return <div className="page"><section className="page-head"><div><span>REVIEW QUEUE</span><h1>O que precisa de decisão humana</h1><p>Esta fila é somente de revisão. Nada aqui aprova, publica ou encerra HUMAN_GATE automaticamente.</p></div></section>
    <div className="review-stack">{batches.length?batches.map((batch,index)=><section className="review-batch" key={batch.key}><div className="review-batch-head"><div><div className="card-label">{index===0?'PRÓXIMO GATE':'AGUARDANDO REVISÃO'}</div><h2>V{batch.version}</h2><p className="mono subtle">{batch.mission}</p></div><StatusPill status="REVIEW"/></div><div className="review-items">{batch.items.map((item,position)=><Link href={'/videos/'+item.slug} className="review-item" key={item.slug}><span className="review-index">{String(position+1).padStart(2,'0')}</span><div><strong>{item.title}</strong><small>{item.durationSec?Math.round(item.durationSec)+'s · ':''}{item.aspect} · v{item.version}</small></div><span aria-hidden="true">→</span></Link>)}</div></section>):<section className="empty-state"><h2>Fila vazia</h2><p>Nenhum conteúdo está em REVIEW neste momento.</p></section>}</div>
  </div>;
}
