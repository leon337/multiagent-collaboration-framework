export type SocialPlatformProfile='youtube-shorts'|'tiktok'|'instagram-reels'|'universal-social';

export type Insets={top:number;right:number;bottom:number;left:number};

export type SocialSafeAreaProfile={
  id:SocialPlatformProfile;
  label:string;
  frame:{width:1080;height:1920};
  uiInsets:Insets;
  note:string;
};

// Internal conservative layout envelopes for current short-form UI.
// These are MCF production guards, not claims of permanent platform pixel contracts.
// Platform chrome changes; therefore the universal profile intentionally contains all three.
export const socialSafeAreaProfiles:Record<SocialPlatformProfile,SocialSafeAreaProfile>={
  'youtube-shorts':{
    id:'youtube-shorts',label:'YouTube Shorts',frame:{width:1080,height:1920},
    uiInsets:{top:140,right:200,bottom:340,left:100},
    note:'MCF conservative envelope for Shorts review.'
  },
  'tiktok':{
    id:'tiktok',label:'TikTok',frame:{width:1080,height:1920},
    uiInsets:{top:120,right:220,bottom:400,left:120},
    note:'MCF conservative envelope for TikTok review.'
  },
  'instagram-reels':{
    id:'instagram-reels',label:'Instagram Reels',frame:{width:1080,height:1920},
    uiInsets:{top:160,right:200,bottom:400,left:110},
    note:'MCF conservative envelope for Reels review.'
  },
  'universal-social':{
    id:'universal-social',label:'Universal Social',frame:{width:1080,height:1920},
    uiInsets:{top:160,right:220,bottom:420,left:120},
    note:'Intersection-safe MCF profile for Shorts + TikTok + Reels.'
  },
};

export const socialCoreContentInsets:Insets={top:180,right:240,bottom:650,left:140};

export const socialCaptionLane={
  left:140,
  right:240,
  bottom:460,
  maxWidth:700,
  fontSize:44,
  lineHeight:1.2,
  paddingY:22,
  paddingX:28,
  reservedHeight:170,
} as const;

export const profileContains=(container:SocialPlatformProfile,child:Exclude<SocialPlatformProfile,'universal-social'>)=>{
  const a=socialSafeAreaProfiles[container].uiInsets;
  const b=socialSafeAreaProfiles[child].uiInsets;
  return a.top>=b.top&&a.right>=b.right&&a.bottom>=b.bottom&&a.left>=b.left;
};
