import type {ContentStatus} from '@/lib/types';
export function StatusPill({status}:{status:ContentStatus}){return <span className={'status status-'+status.toLowerCase()}>{status}</span>;}
