export type ContentStatus='DRAFT'|'REVIEW'|'APPROVED'|'PUBLISHED';
export type QaStatus={visual:'PASS'|'PENDING'|'FAIL';audio:'PASS'|'PENDING'|'FAIL';captions:'PASS'|'PENDING'|'FAIL';ci:'PASS'|'PENDING'|'FAIL'};
export type ContentItem={slug:string;title:string;summary:string;version:string;status:ContentStatus;kind:'video'|'explainer';videoUrl?:string;posterUrl?:string;durationSec?:number;aspect:'9:16'|'16:9'|'mixed';createdAt:string;mission:string;issue?:number;pr?:number;commit?:string;factoryRun?:string;qa:QaStatus;tags:string[]};
