#!/usr/bin/env python3
import argparse
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

def call(endpoint, state, timeout=150):
    payload = json.dumps({"state": state}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    started = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            code = resp.getcode()
        elapsed = int((time.time() - started) * 1000)
        data = json.loads(body)
        return code, data, elapsed, None
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        elapsed = int((time.time() - started) * 1000)
        try:
            data = json.loads(body)
        except Exception:
            data = None
        return exc.code, data, elapsed, body
    except Exception as exc:
        elapsed = int((time.time() - started) * 1000)
        return 0, None, elapsed, str(exc)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases", required=True)
    ap.add_argument("--endpoint", required=True)
    ap.add_argument("--shard", type=int, required=True)
    ap.add_argument("--shards", type=int, default=5)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    cases = json.loads(Path(args.cases).read_text(encoding="utf-8"))
    total = len(cases)
    per = (total + args.shards - 1) // args.shards
    start = args.shard * per
    end = min(total, start + per)
    selected = cases[start:end]
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    with out.open("w", encoding="utf-8") as fh:
        for idx, case in enumerate(selected, 1):
            total_latency = 0
            last_code = 0
            last_data = None
            last_error = None
            ok = False
            for attempt in range(1, 4):
                code, data, latency, err = call(args.endpoint, case["state"])
                total_latency += latency
                last_code, last_data, last_error = code, data, err
                if code == 200 and isinstance(data, dict) and data.get("ok") is True:
                    ok = True
                    break
                time.sleep(attempt * 2)

            if ok:
                answers = last_data.get("answers") or {}
                actual = ((answers.get("nextAction") or {}).get("choice"))
                row = {
                    "id": case["id"],
                    "family": case["family"],
                    "oracle": case["oracle"],
                    "actual": actual,
                    "match": actual == case["oracle"],
                    "latencyMs": total_latency,
                    "state": case["state"],
                    "answers": answers,
                    "attempts": attempt,
                }
            else:
                message = None
                if isinstance(last_data, dict):
                    message = last_data.get("message") or last_data.get("error")
                row = {
                    "id": case["id"],
                    "family": case["family"],
                    "oracle": case["oracle"],
                    "actual": None,
                    "match": False,
                    "latencyMs": total_latency,
                    "state": case["state"],
                    "attempts": 3,
                    "error": message or last_error or f"HTTP {last_code}",
                    "http": last_code,
                }
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
            fh.flush()
            print(f"shard={args.shard} {idx}/{len(selected)} {case['id']} oracle={case['oracle']} actual={row.get('actual')} error={bool(row.get('error'))} latency={total_latency}ms")

if __name__ == "__main__":
    main()
