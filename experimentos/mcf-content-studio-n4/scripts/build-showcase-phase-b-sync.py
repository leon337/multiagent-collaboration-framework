#!/usr/bin/env python3
import argparse
import json
import math
import shutil
import subprocess
from pathlib import Path

def duration_seconds(path: Path) -> float:
    return float(subprocess.check_output([
        "ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=nw=1:nk=1",str(path)
    ], text=True).strip())

def synthesize(text: str, stem: Path, voice: str):
    stem.parent.mkdir(parents=True, exist_ok=True)
    edge = shutil.which("edge-tts")
    if edge:
        mp3 = stem.with_suffix(".mp3")
        result = subprocess.run(
            [edge,"--voice",voice,"--text",text,"--write-media",str(mp3)],
            capture_output=True,text=True,
        )
        if result.returncode == 0 and mp3.is_file() and mp3.stat().st_size > 512:
            return mp3, "edge"
    espeak = shutil.which("espeak")
    if not espeak:
        raise RuntimeError("Neither edge-tts nor espeak is available")
    wav = stem.with_suffix(".wav")
    subprocess.run([espeak,"-v","pt-br","-s","155","-w",str(wav),text],check=True)
    return wav, "espeak"

def build_track(segment_paths, starts, total_frames, fps, output: Path):
    output.parent.mkdir(parents=True, exist_ok=True)
    inputs=[]; filters=[]; labels=[]
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
    ap.add_argument("--source-sync-dir",required=True)
    args=ap.parse_args()
    manifest=json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    out=Path(args.out_dir)
    source_sync=Path(args.source_sync_dir)
    fps=int(manifest["fps"])
    lead=int(manifest["leadInFrames"])
    gap=int(manifest["interCueGapFrames"])
    tail=int(manifest["sceneTailFrames"])
    voice=str(manifest.get("voice") or "pt-BR-AntonioNeural")
    summary={}
    for video_id,video in manifest["videos"].items():
        cursor=0; cues=[]; scenes={}; segments=[]
        segment_paths=[]; starts=[]; providers=[]
        for scene in video["scenes"]:
            scene_start=cursor
            cursor += lead
            scene_segment_ids=[]
            for index,seg in enumerate(scene["segments"]):
                stem=out/"segments"/video_id/seg["id"]
                audio,provider=synthesize(seg["text"],stem,voice)
                providers.append(provider)
                seconds=duration_seconds(audio)
                frames=max(1,math.ceil(seconds*fps))
                start=cursor; end=start+frames
                cues.append({"from":start,"to":end,"text":seg["text"]})
                segments.append({
                    "id":seg["id"],"sceneId":scene["sceneId"],"text":seg["text"],
                    "startFrame":start,"endFrame":end,"durationFrames":frames,
                    "durationSec":round(seconds,6),"audioPath":str(audio),"provider":provider
                })
                scene_segment_ids.append(seg["id"])
                segment_paths.append(audio); starts.append(start)
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
            "version":"1.4","fps":fps,"videoId":video_id,
            "totalFrames":total_frames,"durationSec":round(total_frames/fps,6),
            "cues":cues,"scenes":scenes,"segments":segments,
            "voice":voice,"providers":sorted(set(providers))
        }
        timeline_path=out/"timelines"/f"{video_id}.json"
        timeline_path.parent.mkdir(parents=True,exist_ok=True)
        payload=json.dumps(timeline,ensure_ascii=False,indent=2)+"\n"
        timeline_path.write_text(payload,encoding="utf-8")
        source_path=source_sync/f"{video_id}.json"
        source_path.parent.mkdir(parents=True,exist_ok=True)
        source_path.write_text(payload,encoding="utf-8")
        build_track(segment_paths,starts,total_frames,fps,out/"audio"/f"{video_id}.m4a")
        summary[video_id]={
            "totalFrames":total_frames,
            "durationSec":round(total_frames/fps,3),
            "segments":len(segments),
            "providers":sorted(set(providers)),
            "voice":voice
        }
    (out/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
