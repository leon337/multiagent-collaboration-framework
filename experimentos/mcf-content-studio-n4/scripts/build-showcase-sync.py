#!/usr/bin/env python3
import argparse
import json
import math
import subprocess
import urllib.request
from pathlib import Path

def sh(cmd):
    return subprocess.check_output(cmd, text=True).strip()

def duration_seconds(path: Path) -> float:
    return float(sh([
        "ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=nw=1:nk=1",str(path)
    ]))

def download(url: str, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.is_file() and dest.stat().st_size > 0:
        return
    req=urllib.request.Request(url,headers={"User-Agent":"MCF-Content-Studio/1.3"})
    with urllib.request.urlopen(req) as src, dest.open("wb") as out:
        out.write(src.read())

def build_track(segment_paths, starts, total_frames, fps, output: Path):
    output.parent.mkdir(parents=True, exist_ok=True)
    inputs=[]
    filters=[]
    labels=[]
    for i,(path,start_frame) in enumerate(zip(segment_paths,starts)):
        inputs += ["-i",str(path)]
        start_ms=round(start_frame/fps*1000)
        label=f"a{i}"
        filters.append(f"[{i}:a]asetpts=PTS-STARTPTS,adelay={start_ms}|{start_ms}[{label}]")
        labels.append(f"[{label}]")
    total_sec=total_frames/fps
    filters.append("".join(labels)+f"amix=inputs={len(labels)}:normalize=0,apad,atrim=0:{total_sec:.6f}[aout]")
    subprocess.run([
        "ffmpeg","-y",*inputs,
        "-filter_complex",";".join(filters),
        "-map","[aout]","-c:a","aac","-b:a","192k",str(output)
    ],check=True)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--manifest",required=True)
    ap.add_argument("--out-dir",required=True)
    args=ap.parse_args()
    manifest=json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    out=Path(args.out_dir)
    fps=int(manifest["fps"])
    lead=int(manifest["leadInFrames"])
    gap=int(manifest["interCueGapFrames"])
    tail=int(manifest["sceneTailFrames"])
    summary={}
    for video_id,video in manifest["videos"].items():
        cursor=0
        cues=[]
        scenes={}
        segments=[]
        segment_paths=[]
        starts=[]
        for scene in video["scenes"]:
            scene_start=cursor
            cursor += lead
            scene_segment_ids=[]
            for index,seg in enumerate(scene["segments"]):
                audio=out/"segments"/video_id/f"{seg['id']}.mp3"
                download(seg["url"],audio)
                seconds=duration_seconds(audio)
                frames=max(1,math.ceil(seconds*fps))
                start=cursor
                end=start+frames
                cues.append({"from":start,"to":end,"text":seg["text"]})
                segments.append({
                    "id":seg["id"],"sceneId":scene["sceneId"],"text":seg["text"],
                    "startFrame":start,"endFrame":end,"durationFrames":frames,
                    "durationSec":round(seconds,6)
                })
                scene_segment_ids.append(seg["id"])
                segment_paths.append(audio)
                starts.append(start)
                cursor=end
                if index < len(scene["segments"])-1:
                    cursor += gap
            cursor += tail
            scenes[scene["sceneId"]]={
                "from":scene_start,"to":cursor,"durationFrames":cursor-scene_start,
                "segmentIds":scene_segment_ids
            }
        total_frames=cursor
        timeline={
            "version":manifest.get("version","1.3"),"fps":fps,"videoId":video_id,
            "totalFrames":total_frames,"durationSec":round(total_frames/fps,6),
            "cues":cues,"scenes":scenes,"segments":segments
        }
        timeline_path=out/"timelines"/f"{video_id}.json"
        timeline_path.parent.mkdir(parents=True,exist_ok=True)
        timeline_path.write_text(json.dumps(timeline,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        build_track(segment_paths,starts,total_frames,fps,out/"audio"/f"{video_id}.m4a")
        summary[video_id]={"totalFrames":total_frames,"durationSec":round(total_frames/fps,3),"segments":len(segments)}
    (out/"summary.json").write_text(json.dumps(summary,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()

