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
    inputs=[];filters=[];labels=[]
    for i,(path,start_frame) in enumerate(zip(segment_paths,starts)):
        inputs += ["-i",str(path)]
        start_ms=round(start_frame/fps*1000)
        label=f"a{i}"
        filters.append(f"[{i}:a]asetpts=PTS-STARTPTS,adelay={start_ms}|{start_ms}[{label}]")
        labels.append(f"[{label}]")
    total_sec=total_frames/fps
    filters.append("".join(labels)+f"amix=inputs={len(labels)}:normalize=0,apad,atrim=0:{total_sec:.6f}[aout]")
    output.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run([
        "ffmpeg","-y",*inputs,
        "-filter_complex",";".join(filters),
        "-map","[aout]","-c:a","aac","-b:a","192k",str(output)
    ],check=True)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--manifest",required=True)
    ap.add_argument("--out-dir",required=True)
    ap.add_argument("--source-sync",required=True)
    args=ap.parse_args()

    manifest=json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    out=Path(args.out_dir)
    fps=int(manifest["fps"])
    lead=int(manifest["leadInFrames"])
    gap=int(manifest["interCueGapFrames"])
    tail=int(manifest["sceneTailFrames"])
    voice=str(manifest.get("voice") or "pt-BR-AntonioNeural")

    cursor=0
    cues=[]; scenes={}; segments=[]; segment_paths=[]; starts=[]; providers=[]
    for index,scene in enumerate(manifest["scenes"],start=1):
        scene_start=cursor
        cursor += lead
        seg_id=f"tour-{index:02d}"
        audio,provider=synthesize(scene["text"],out/"segments"/seg_id,voice)
        providers.append(provider)
        seconds=duration_seconds(audio)
        frames=max(1,math.ceil(seconds*fps))
        start=cursor; end=start+frames
        cues.append({"from":start,"to":end,"text":scene["text"]})
        segments.append({
            "id":seg_id,"sceneId":scene["sceneId"],"text":scene["text"],
            "startFrame":start,"endFrame":end,"durationFrames":frames,
            "durationSec":round(seconds,6),"audioPath":str(audio),"provider":provider
        })
        segment_paths.append(audio);starts.append(start)
        cursor=end+tail
        scenes[scene["sceneId"]]={
            "from":scene_start,"to":cursor,"durationFrames":cursor-scene_start,
            "segmentIds":[seg_id]
        }
        if index < len(manifest["scenes"]):
            cursor += gap

    total_frames=cursor
    duration=total_frames/fps
    if not (60 <= duration <= 90):
        raise RuntimeError(f"Factory Tour duration must be 60-90 seconds, got {duration:.3f}s")

    timeline={
        "version":"1.0","fps":fps,"videoId":"factory-tour",
        "totalFrames":total_frames,"durationSec":round(duration,6),
        "cues":cues,"scenes":scenes,"segments":segments,
        "voice":voice,"providers":sorted(set(providers))
    }
    payload=json.dumps(timeline,ensure_ascii=False,indent=2)+"\n"
    (out/"timeline.json").parent.mkdir(parents=True,exist_ok=True)
    (out/"timeline.json").write_text(payload,encoding="utf-8")
    Path(args.source_sync).write_text(payload,encoding="utf-8")
    build_track(segment_paths,starts,total_frames,fps,out/"factory-tour-narration.m4a")

    summary={
        "durationSec":round(duration,3),
        "totalFrames":total_frames,
        "segments":len(segments),
        "providers":sorted(set(providers)),
        "voice":voice
    }
    (out/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
