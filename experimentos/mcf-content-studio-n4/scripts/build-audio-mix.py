#!/usr/bin/env python3
import argparse
import json
import subprocess


def narration_intervals(clips, fps):
    return [
        (clip["startFrame"] / fps, (clip["startFrame"] + clip["durationFrames"]) / fps)
        for clip in clips
        if clip["kind"] == "narration"
    ]


def build_filter_graph(spec, asset_map):
    fps = spec["fps"]
    inputs = []
    filters = []
    by_kind = {kind: [] for kind in ("narration", "sfx", "music", "ambient")}

    for index, clip in enumerate(spec["clips"]):
        inputs += ["-i", asset_map[clip["assetId"]]]
        duration = clip["durationFrames"] / fps
        delay_ms = round(clip["startFrame"] / fps * 1000)
        chain = (
            f"[{index}:a]atrim=0:{duration:.6f},asetpts=PTS-STARTPTS,"
            f"volume={clip['gainDb']}dB"
        )
        fade_in = clip.get("fadeInFrames", 0) / fps
        fade_out = clip.get("fadeOutFrames", 0) / fps
        if fade_in > 0:
            chain += f",afade=t=in:st=0:d={fade_in:.6f}"
        if fade_out > 0:
            fade_start = max(0, duration - fade_out)
            chain += f",afade=t=out:st={fade_start:.6f}:d={fade_out:.6f}"
        chain += f",adelay={delay_ms}|{delay_ms}[c{index}]"
        filters.append(chain)
        by_kind[clip["kind"]].append(f"[c{index}]")

    grouped = {}
    for kind, labels in by_kind.items():
        if not labels:
            continue
        output = f"{kind}raw"
        if len(labels) == 1:
            filters.append(f"{labels[0]}anull[{output}]")
        else:
            filters.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0[{output}]")
        grouped[kind] = output

    spans = narration_intervals(spec["clips"], fps)
    for rule in spec.get("ducking", []):
        if rule.get("trigger") != "narration" or not spans:
            continue
        enable = "+".join(f"between(t,{start:.6f},{end:.6f})" for start, end in spans)
        for target in rule.get("targets", []):
            source = grouped.get(target)
            if not source:
                continue
            output = f"{target}ducked"
            filters.append(
                f"[{source}]volume={rule['reductionDb']}dB:enable='{enable}'[{output}]"
            )
            grouped[target] = output

    final_labels = [
        f"[{grouped[kind]}]"
        for kind in ("narration", "sfx", "music", "ambient")
        if kind in grouped
    ]
    if not final_labels:
        raise ValueError("no audio clips")
    if len(final_labels) == 1:
        filters.append(f"{final_labels[0]}anull[aout]")
    else:
        filters.append(
            "".join(final_labels)
            + f"amix=inputs={len(final_labels)}:normalize=0,apad[aout]"
        )

    total_duration = max(
        clip["startFrame"] + clip["durationFrames"] for clip in spec["clips"]
    ) / fps
    return inputs, ";".join(filters), total_duration


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True)
    parser.add_argument("--asset-map", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    with open(args.spec, encoding="utf-8") as handle:
        spec = json.load(handle)
    with open(args.asset_map, encoding="utf-8") as handle:
        asset_map = json.load(handle)

    inputs, graph, total_duration = build_filter_graph(spec, asset_map)
    command = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", graph,
        "-map", "[aout]",
        "-c:a", "aac", "-b:a", "192k",
        "-t", f"{total_duration:.6f}",
        args.output,
    ]
    subprocess.run(command, check=True)
    print(json.dumps({
        "status": "AUDIO_MIX_RENDERED",
        "output": args.output,
        "duration": total_duration,
        "clipCount": len(spec["clips"]),
        "duckingRules": len(spec.get("ducking", [])),
    }))


if __name__ == "__main__":
    main()
