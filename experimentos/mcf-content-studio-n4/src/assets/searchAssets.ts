import assetData from '../../assets/registry.json';

export type AssetEntry=(typeof assetData.assets)[number];
export type AssetQuery={
  usage?:string;
  style?:string;
  orientation?:AssetEntry['orientation'];
  theme?:string;
  type?:AssetEntry['type'];
};

export const assets=assetData.assets;

export const searchAssets=(query:AssetQuery={})=>assets.filter((asset)=>{
  if(query.usage&&!asset.usage.includes(query.usage)) return false;
  if(query.style&&asset.style!==query.style) return false;
  if(query.orientation&&asset.orientation!=='any'&&asset.orientation!==query.orientation) return false;
  if(query.theme&&asset.theme!==query.theme) return false;
  if(query.type&&asset.type!==query.type) return false;
  return asset.status==='APPROVED';
});
