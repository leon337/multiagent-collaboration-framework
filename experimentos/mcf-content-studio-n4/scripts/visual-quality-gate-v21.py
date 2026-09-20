#!/usr/bin/env python3
import argparse
import json
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

SAMPLES=(0.10,0.25,0.50,0.75,0.90)

def ffprobe_duration(path: Path) -> float:
    return float(subprocess.check_output([
        "ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=nw=1:nk=1",str(path)
    ],text=True).strip())

def extract(path: Path, sec: float, out: Path):
    subprocess.run([
        "ffmpeg","-y","-ss",f"{sec:.4f}","-i",str(path),
        "-frames:v","1","-vf","scale=540:-2",str(out)
    ],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

def ahash(im: Image.Image, size=16):
    g=im.convert("L").resize((size,size))
    vals=list(g.getdata())
    avg=sum(vals)/len(vals)
    bits=0
    for v in vals:
        bits=(bits<<1)|(1 if v>=avg else 0)
    return bits

def hamming(a:int,b:int)->int:
    return (a^b).bit_count()

def metrics(im: Image.Image):
    rgb=im.convert("RGB")
    w,h=rgb.size
    # Action zone: ignore top/bottom browser/player chrome and caption lane.
    crop=rgb.crop((int(w*.07),int(h*.12),int(w*.93),int(h*.82)))
    px=list(crop.getdata())
    n=max(1,len(px))
    fg=0
    near_white=0
    for r,g,b in px:
        mx=max(r,g,b); mn=min(r,g,b)
        sat=(mx-mn)/max(1,mx)
        lum=.2126*r+.7152*g+.0722*b
        # "Ink" means enough chroma or darkness to be meaningful against Light Tech.
        if sat>.09 or lum<226:
            fg+=1
        if lum>246 and sat<.045:
            near_white+=1
    gray=crop.convert("L")
    dx=ImageChops.difference(gray,gray.transform(gray.size,Image.AFFINE,(1,0,1,0,1,0)))
    dy=ImageChops.difference(gray,gray.transform(gray.size,Image.AFFINE,(1,0,0,0,1,1)))
    edge=ImageChops.lighter(dx,dy)
    hist=edge.histogram()
    edge_pixels=sum(hist[18:])
    return {
        "foregroundRatio":round(fg/n,4),
        "nearWhiteRatio":round(near_white/n,4),
        "edgeRatio":round(edge_pixels/n,4),
        "meanLuma":round(ImageStat.Stat(gray).mean[0],2),
    }

def contact_sheet(frames, labels, out):
    ims=[Image.open(p).convert("RGB") for p in frames]
    thumb_w=270
    thumb_h=480
    cards=[]
    for im,label in zip(ims,labels):
        im.thumbnail((thumb_w,thumb_h))
        card=Image.new("RGB",(thumb_w+20,thumb_h+52),(244,248,255))
        card.paste(im,((thumb_w+20-im.width)//2,8))
        d=ImageDraw.Draw(card)
        d.text((10,thumb_h+20),label,fill=(8,24,54))
        cards.append(card)
    cols=5
    rows=math.ceil(len(cards)/cols)
    sheet=Image.new("RGB",(cols*(thumb_w+20),rows*(thumb_h+52)),(226,235,251))
    for i,card in enumerate(cards):
        sheet.paste(card,((i%cols)*(thumb_w+20),(i//cols)*(thumb_h+52)))
    sheet.save(out,quality=92)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--media",nargs="+",required=True)
    ap.add_argument("--out-dir",required=True)
    ap.add_argument("--min-foreground",type=float,default=.115)
    ap.add_argument("--min-edge",type=float,default=.020)
    ap.add_argument("--max-near-white",type=float,default=.84)
    ap.add_argument("--min-diversity",type=int,default=18)
    args=ap.parse_args()

    out=Path(args.out_dir)
    out.mkdir(parents=True,exist_ok=True)
    results=[]
    failures=[]

    for item in args.media:
        path=Path(item)
        duration=ffprobe_duration(path)
        frame_paths=[]
        frame_metrics=[]
        hashes=[]
        labels=[]
        stem=path.stem
        sample_dir=out/stem
        sample_dir.mkdir(parents=True,exist_ok=True)
        for pct in SAMPLES:
            sec=max(.05,min(duration-.05,duration*pct))
            fp=sample_dir/f"{round(pct*100):02d}.jpg"
            extract(path,sec,fp)
            im=Image.open(fp)
            m=metrics(im)
            m.update({"pct":pct,"sec":round(sec,3),"frame":str(fp)})
            frame_metrics.append(m)
            hashes.append(ahash(im))
            frame_paths.append(fp)
            labels.append(f"{stem} · {round(pct*100)}%")

            low_information=(m["foregroundRatio"]<args.min_foreground and m["edgeRatio"]<args.min_edge)
            if low_information or m["nearWhiteRatio"]>args.max_near_white:
                failures.append({
                    "video":stem,"pct":pct,"reason":"low_visual_density",
                    "metrics":m,
                })

        pairwise=[hamming(hashes[i],hashes[j]) for i in range(len(hashes)) for j in range(i+1,len(hashes))]
        avg_div=round(sum(pairwise)/max(1,len(pairwise)),2)
        if avg_div<args.min_diversity:
            failures.append({"video":stem,"reason":"low_temporal_diversity","averageHashDistance":avg_div})
        sheet=out/f"{stem}-contact-sheet.jpg"
        contact_sheet(frame_paths,labels,sheet)
        results.append({
            "video":stem,"durationSec":round(duration,3),
            "averageHashDistance":avg_div,
            "samples":frame_metrics,
            "contactSheet":str(sheet),
        })

    payload={"version":"2.1","status":"FAIL" if failures else "PASS","videos":results,"failures":failures}
    (out/"visual-quality-report.json").write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(payload,indent=2))
    if failures:
        raise SystemExit(1)

if __name__=="__main__":
    main()
