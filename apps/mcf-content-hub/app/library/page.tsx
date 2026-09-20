import {getContentItems} from '@/lib/content';
import {getContentFamilies} from '@/lib/content-view';
import {ContentFamilyCard} from '@/components/ContentFamilyCard';
export const dynamic='force-dynamic';
export default async function Library(){
  const families=getContentFamilies(await getContentItems());
  return <div className="page"><section className="page-head"><div><span>LIBRARY</span><h1>Conteúdo organizado por família</h1><p>A versão mais recente aparece primeiro; o histórico fica preservado dentro de cada conteúdo.</p></div></section><section className="family-grid">{families.map((family)=><ContentFamilyCard family={family} key={family.key}/>)}</section></div>;
}
