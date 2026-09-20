#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
from pathlib import Path

def probe(path: Path):
    raw=subprocess.check_output([
        "ffprobe","-v","error",
        "-show_entries","stream=codec_type,duration:format=duration",
        "-of","json",str(path)
    ],text=True)
    return json.loads(raw)

def stream_duration(data,kind):
    for stream in data.get("streams",[]):
        if stream.get("codec_type")==kind and stream.get("duration"):
            return float(stream["duration"])
    return float(data.get("format",{}).get("duration") or 0)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--media",required=True)
    ap.add_argument("--timeline",required=True)
    ap.add_argument("--max-drift-frames",type=float,default=2.0)
    args=ap.parse_args()
    media=Path(args.media)
    timeline=json.loads(Path(args.timeline).read_text(encoding="utf-8"))
    fps=float(timeline["fps"])
    expected=float(timeline["totalFrames"])/fps
    data=probe(media)
    video=stream_duration(data,"video")
    audio=stream_duration(data,"audio")
    tolerance=args.max_drift_frames/fps
    failures=[]
    if abs(video-expected)>tolerance:
        failures.append(f"video-vs-timeline drift={video-expected:+.4f}s")
    if abs(audio-expected)>tolerance:
        failures.append(f"audio-vs-timeline drift={audio-expected:+.4f}s")
    if abs(audio-video)>tolerance:
        failures.append(f"audio-vs-video drift={audio-video:+.4f}s")
    cues=timeline.get("cues",[])
    prev=-1
    for cue in cues:
        if cue["from"]<prev or cue["to"]<=cue["from"]:
            failures.append(f"invalid cue range {cue}")
            break
        prev=cue["to"]
    summary={
        "status":"AV_SYNC_PASS" if not failures else "AV_SYNC_FAIL",
        "media":str(media),"expectedSec":round(expected,4),
        "videoSec":round(video,4),"audioSec":round(audio,4),
        "toleranceSec":round(tolerance,4),"cueCount":len(cues),
        "failures":failures
    }
    print(json.dumps(summary,ensure_ascii=False))
    return 0 if not failures else 2

if __name__=="__main__":
    raise SystemExit(main())

