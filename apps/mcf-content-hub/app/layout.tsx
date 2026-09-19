import type {Metadata} from 'next';
import './globals.css';
import {Header} from '@/components/Header';
export const metadata:Metadata={title:'MCF Content Hub',description:'Review, versioning and delivery surface for MCF Content Studio outputs.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Header/><main>{children}</main></body></html>;}
