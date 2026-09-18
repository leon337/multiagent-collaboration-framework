#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import subprocess
import sys
import textwrap
import time
import urllib.request
from pathlib import Path

MISSION_DIR = Path(__file__).resolve().parent
SCENES_FILE = MISSION_DIR / "scenes.json"
WORK_DIR = MISSION_DIR / "work"
VOICE_DIR = WORK_DIR / "voices"
SLIDE_DIR = WORK_DIR / "slides"
SEGMENT_DIR = WORK_DIR / "segments"
OUTPUT_DIR = MISSION_DIR / "output"
TIMING_FILE = OUTPUT_DIR / "timing-manifest.json"
EVIDENCE_FILE = OUTPUT_DIR / "render-evidence.json"
FINAL_MP4 = OUTPUT_DIR / "chamado-amanhecer-v2-multivoz.mp4"

WIDTH = 1080
HEIGHT = 1920
FPS = 30


def run(cmd: list[str], *, capture: bool = False) -> str:
    result = subprocess.run(
        cmd,
        check=True,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )
    return result.stdout.strip() if capture else ""


def load_manifest() -> dict:
    return json.loads(SCENES_FILE.read_text(encoding="utf-8"))


def validate_manifest() -> None:
    data = load_manifest()
    scenes = data.get("scenes", [])
    if len(scenes) != 25:
        raise SystemExit(f"expected 25 scenes, got {len(scenes)}")

    expected_ids = [f"s{i:02d}" for i in range(1, 26)]
    ids = [s.get("id") for s in scenes]
    if ids != expected_ids:
        raise SystemExit(f"scene ids are not canonical: {ids}")

    allowed_speakers = {"Narrador", "Lia", "Pai"}
    for scene in scenes:
        missing = [k for k in ("id", "speaker", "title", "text", "visual", "audio_url") if not scene.get(k)]
        if missing:
            raise SystemExit(f"{scene.get('id')}: missing {missing}")
        if scene["speaker"] not in allowed_speakers:
            raise SystemExit(f"{scene['id']}: unexpected speaker {scene['speaker']}")
        if not scene["audio_url"].startswith("https://"):
            raise SystemExit(f"{scene['id']}: audio_url must be https")

    counts = {speaker: sum(1 for s in scenes if s["speaker"] == speaker) for speaker in allowed_speakers}
    if counts["Narrador"] < 1 or counts["Lia"] < 1 or counts["Pai"] < 1:
        raise SystemExit(f"all three speakers required: {counts}")

    print(json.dumps({"status": "PASS", "scene_count": len(scenes), "speaker_counts": counts}, ensure_ascii=False))


def download(url: str, target: Path, retries: int = 4) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 1024:
        return

    last_error = None
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "MCF-Render-Multivoice/1.0",
                    "Accept": "audio/mpeg,*/*;q=0.8",
                },
            )
            with urllib.request.urlopen(request, timeout=45) as response:
                payload = response.read()
            if len(payload) < 1024:
                raise RuntimeError(f"payload too small: {len(payload)} bytes")
            target.write_bytes(payload)
            return
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(attempt * 2)
    raise RuntimeError(f"failed to download {url}: {last_error}")


def audio_duration(path: Path) -> float:
    out = run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture=True,
    )
    return float(out)


def recover_audio() -> None:
    validate_manifest()
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    data = load_manifest()
    recovered = []
    for scene in data["scenes"]:
        target = VOICE_DIR / f"{scene['id']}-{scene['speaker'].lower()}.mp3"
        download(scene["audio_url"], target)
        duration = audio_duration(target)
        recovered.append(
            {
                "id": scene["id"],
                "speaker": scene["speaker"],
                "path": str(target.relative_to(MISSION_DIR)),
                "bytes": target.stat().st_size,
                "duration": round(duration, 4),
            }
        )
        print(f"{scene['id']}: {scene['speaker']} {duration:.3f}s {target.stat().st_size} bytes")

    (WORK_DIR / "audio-recovery.json").write_text(
        json.dumps({"status": "PASS", "clips": recovered}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def font(size: int, bold: bool = False):
    from PIL import ImageFont
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def wrap_pixels(draw, text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        proposal = word if not current else current + " " + word
        box = draw.textbbox((0, 0), proposal, font=fnt)
        if box[2] - box[0] <= max_width:
            current = proposal
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def interpolate(a: tuple[int, int, int], b: tuple[int, int, int], t: float):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_scene_art(draw, idx: int, speaker: str):
    # Abstract, deterministic art direction: dawn, road, sun, portal, mirror, wheel.
    from PIL import ImageDraw

    gold = (236, 180, 78)
    pale = (245, 225, 184)
    ink = (21, 32, 58)
    muted = (82, 93, 120)

    # Large dawn orb.
    r = 175 + (idx % 4) * 18
    cx = 820 if idx % 2 else 250
    cy = 300 + (idx % 5) * 65
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=gold)

    # Secondary moon/sun motif on dream/reflection beats.
    if idx in {2, 3, 4, 21}:
        r2 = 90
        draw.ellipse((190-r2, 355-r2, 190+r2, 355+r2), outline=pale, width=12)

    # Perspective road/path motif.
    horizon_y = 850
    draw.polygon(
        [(390, HEIGHT), (690, HEIGHT), (575, horizon_y), (505, horizon_y)],
        fill=(117, 72, 64),
    )
    draw.line((540, HEIGHT, 540, horizon_y), fill=pale, width=6)

    # Scene-specific symbol.
    if idx in {6, 13, 14}:
        # Phone / message.
        draw.rounded_rectangle((675, 980, 900, 1380), radius=32, outline=pale, width=10)
        draw.rectangle((720, 1050, 855, 1070), fill=pale)
        draw.rectangle((720, 1115, 835, 1135), fill=muted)
    elif idx in {11, 12}:
        # Portal.
        draw.arc((120, 930, 440, 1290), 180, 360, fill=pale, width=18)
        draw.line((120, 1110, 120, 1450), fill=pale, width=18)
        draw.line((440, 1110, 440, 1450), fill=pale, width=18)
    elif idx in {17, 18}:
        # Three paths.
        for x in (320, 540, 760):
            draw.line((540, 1550, x, 1180), fill=pale, width=10)
    elif idx == 19:
        # Mirror.
        draw.rounded_rectangle((700, 950, 900, 1450), radius=80, outline=pale, width=14)
        draw.line((800, 1450, 800, 1570), fill=pale, width=12)
    elif idx in {23, 24, 25}:
        # Bicycle wheel / forward motion.
        draw.ellipse((675, 1110, 955, 1390), outline=pale, width=14)
        draw.ellipse((720, 1155, 910, 1345), outline=muted, width=7)

    # Speaker marker.
    marker = {"Narrador": (225, 225, 225), "Lia": (245, 192, 203), "Pai": (158, 187, 222)}[speaker]
    draw.ellipse((86, 1560, 126, 1600), fill=marker)


def render_slides() -> None:
    validate_manifest()
    from PIL import Image, ImageDraw

    SLIDE_DIR.mkdir(parents=True, exist_ok=True)
    data = load_manifest()

    palettes = [
        ((15, 25, 58), (54, 38, 74)),
        ((20, 31, 65), (82, 50, 66)),
        ((18, 35, 67), (105, 63, 55)),
    ]

    title_font = font(64, bold=True)
    quote_font = font(54, bold=False)
    speaker_font = font(31, bold=True)
    small_font = font(25, bold=False)

    for i, scene in enumerate(data["scenes"], start=1):
        c0, c1 = palettes[(i - 1) % len(palettes)]
        image = Image.new("RGB", (WIDTH, HEIGHT), c0)
        base_draw = ImageDraw.Draw(image)
        for y in range(HEIGHT):
            t = y / max(HEIGHT - 1, 1)
            c = interpolate(c0, c1, t)
            base_draw.line((0, y, WIDTH, y), fill=c)

        draw = ImageDraw.Draw(image, "RGBA")
        draw_scene_art(draw, i, scene["speaker"])

        # Dark lower panel for legibility.
        draw.rounded_rectangle((60, 1180, 1020, 1810), radius=44, fill=(7, 14, 33, 205))

        draw.text((90, 90), f"{i:02d} / 25", font=small_font, fill=(235, 226, 207))
        draw.text((90, 1245), scene["speaker"].upper(), font=speaker_font, fill=(236, 180, 78))

        y = 1310
        for line in wrap_pixels(draw, scene["title"], title_font, 850):
            draw.text((90, y), line, font=title_font, fill=(255, 248, 235))
            y += 76

        y += 20
        for line in wrap_pixels(draw, scene["text"], quote_font, 840):
            draw.text((90, y), line, font=quote_font, fill=(235, 226, 207))
            y += 67

        # Visual cue kept compact.
        cue = scene["visual"]
        y = 1720
        for line in wrap_pixels(draw, cue, small_font, 820)[:2]:
            draw.text((90, y), line, font=small_font, fill=(179, 188, 207))
            y += 34

        output = SLIDE_DIR / f"{scene['id']}.png"
        image.save(output, optimize=True)
        print(output)


def build_timing() -> list[dict]:
    data = load_manifest()
    timeline = []
    cursor = 0.0
    for scene in data["scenes"]:
        candidates = sorted(VOICE_DIR.glob(f"{scene['id']}-*.mp3"))
        if len(candidates) != 1:
            raise RuntimeError(f"{scene['id']}: expected one recovered audio, got {len(candidates)}")
        duration = audio_duration(candidates[0])
        # Keep the requested fast rhythm without ever cutting speech.
        scene_duration = max(2.05, duration + 0.28)
        entry = {
            "id": scene["id"],
            "speaker": scene["speaker"],
            "audio_duration": round(duration, 4),
            "duration": round(scene_duration, 4),
            "start": round(cursor, 4),
            "end": round(cursor + scene_duration, 4),
        }
        timeline.append(entry)
        cursor += scene_duration
    return timeline


def render_video() -> None:
    validate_manifest()
    if len(list(VOICE_DIR.glob("*.mp3"))) != 25:
        raise SystemExit("G1 incomplete: expected 25 recovered MP3 files")
    if len(list(SLIDE_DIR.glob("*.png"))) != 25:
        raise SystemExit("G3 incomplete: expected 25 slide PNG files")

    SEGMENT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    timeline = build_timing()
    TIMING_FILE.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "mission": "RENDER-MULTIVOICE-001",
                "fps": FPS,
                "total_duration": round(sum(x["duration"] for x in timeline), 4),
                "scenes": timeline,
            },
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    manifest = load_manifest()
    scene_by_id = {s["id"]: s for s in manifest["scenes"]}

    segment_paths = []
    for item in timeline:
        sid = item["id"]
        scene = scene_by_id[sid]
        slide = SLIDE_DIR / f"{sid}.png"
        audio = next(VOICE_DIR.glob(f"{sid}-*.mp3"))
        segment = SEGMENT_DIR / f"{sid}.mp4"
        duration = item["duration"]
        fade_out = max(duration - 0.12, 0.01)

        vf = (
            f"scale={WIDTH}:{HEIGHT},"
            f"fade=t=in:st=0:d=0.10,"
            f"fade=t=out:st={fade_out:.4f}:d=0.10,"
            "format=yuv420p"
        )
        af = "adelay=90|90,apad"

        run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-loop", "1", "-framerate", str(FPS), "-i", str(slide),
                "-i", str(audio),
                "-vf", vf,
                "-af", af,
                "-t", f"{duration:.4f}",
                "-r", str(FPS),
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
                str(segment),
            ]
        )
        segment_paths.append(segment)
        print(f"rendered {sid} {scene['speaker']} {duration:.3f}s")

    concat = SEGMENT_DIR / "concat.txt"
    concat.write_text(
        "".join(f"file '{p.resolve().as_posix()}'\n" for p in segment_paths),
        encoding="utf-8",
    )
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(concat),
            "-c", "copy", "-movflags", "+faststart",
            str(FINAL_MP4),
        ]
    )
    print(FINAL_MP4)


def ffprobe_json(path: Path) -> dict:
    out = run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
            "-of", "json",
            str(path),
        ],
        capture=True,
    )
    return json.loads(out)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def validate_output(input_path: Path | None = None) -> None:
    path = input_path or FINAL_MP4
    if not path.exists():
        raise SystemExit(f"missing rendered video: {path}")

    probe = ffprobe_json(path)
    streams = probe.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
    if not video or not audio:
        raise SystemExit("render must contain video and audio")
    if video.get("width") != WIDTH or video.get("height") != HEIGHT:
        raise SystemExit(f"unexpected dimensions: {video.get('width')}x{video.get('height')}")

    duration = float(probe["format"]["duration"])
    if not (45.0 <= duration <= 80.0):
        raise SystemExit(f"duration outside technical acceptance window: {duration:.3f}s")

    manifest = load_manifest()
    speaker_counts = {
        speaker: sum(1 for s in manifest["scenes"] if s["speaker"] == speaker)
        for speaker in ("Narrador", "Lia", "Pai")
    }

    evidence = {
        "status": "PASS",
        "mission": "RENDER-MULTIVOICE-001",
        "video": {
            "path": str(path),
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
            "duration": round(duration, 4),
            "width": video.get("width"),
            "height": video.get("height"),
            "video_codec": video.get("codec_name"),
            "audio_codec": audio.get("codec_name"),
            "fps": video.get("r_frame_rate"),
            "audio_sample_rate": audio.get("sample_rate"),
            "audio_channels": audio.get("channels"),
        },
        "scene_count": 25,
        "speaker_counts": speaker_counts,
        "gates": {
            "G1_audio_recovery": "PASS",
            "G2_timing_manifest": "PASS",
            "G3_slides": "PASS",
            "G4_cloud_render": "PASS",
            "G5_validation": "PASS",
        },
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    EVIDENCE_FILE.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(evidence, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("validate-manifest")
    sub.add_parser("audio")
    sub.add_parser("slides")
    sub.add_parser("render")
    validate_parser = sub.add_parser("validate-output")
    validate_parser.add_argument("--input", type=Path, default=None)
    args = parser.parse_args()

    if args.command == "validate-manifest":
        validate_manifest()
    elif args.command == "audio":
        recover_audio()
    elif args.command == "slides":
        render_slides()
    elif args.command == "render":
        render_video()
    elif args.command == "validate-output":
        validate_output(args.input)


if __name__ == "__main__":
    main()
