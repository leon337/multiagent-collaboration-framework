#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
from pathlib import Path


def probe(path: Path) -> dict:
    completed = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "stream=index,codec_type,codec_name,channels:format=duration",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fail closed when a lesson expected to contain narration has no encoded audio stream."
    )
    parser.add_argument("media")
    parser.add_argument("--min-duration", type=float, default=0.5)
    args = parser.parse_args()

    path = Path(args.media)
    if not path.is_file() or path.stat().st_size == 0:
        print(f"AUDIO_QA_FAIL: media missing or empty: {path}", file=sys.stderr)
        return 2

    data = probe(path)
    audio = [stream for stream in data.get("streams", []) if stream.get("codec_type") == "audio"]
    if not audio:
        print("AUDIO_QA_FAIL: expected encoded audio stream but none was found", file=sys.stderr)
        return 3

    duration = float(data.get("format", {}).get("duration") or 0)
    if duration < args.min_duration:
        print(f"AUDIO_QA_FAIL: media duration {duration:.3f}s is below minimum", file=sys.stderr)
        return 4

    summary = {
        "status": "AUDIO_STREAM_PRESENT",
        "media": str(path),
        "duration": duration,
        "audioStreams": [
            {
                "index": stream.get("index"),
                "codec": stream.get("codec_name"),
                "channels": stream.get("channels"),
            }
            for stream in audio
        ],
    }
    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
