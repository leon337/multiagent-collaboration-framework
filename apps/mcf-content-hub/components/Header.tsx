import Link from 'next/link';
const nav=[['/','Overview'],['/review','Review Queue'],['/library','Library'],['/factory-runs','Factory Runs']] as const;
export function Header(){return <header className="site-header"><div className="header-inner"><Link href="/" className="brand"><span className="brand-mark">M</span><span><b>MCF</b> Content Hub</span></Link><nav aria-label="Navegação principal">{nav.map(([href,label])=><Link href={href} key={href}>{label}</Link>)}</nav><div className="env-pill">{process.env.CONTENT_HUB_ENV??'review'}</div></div></header>;}
