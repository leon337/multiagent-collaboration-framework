import Link from 'next/link';
export function Header(){return <header className="site-header"><Link href="/" className="brand"><span className="brand-mark">M</span><span><b>MCF</b> Content Hub</span></Link><nav><Link href="/">Library</Link><Link href="/factory-runs">Factory Runs</Link></nav><div className="env-pill">{process.env.CONTENT_HUB_ENV??'review'}</div></header>;}
