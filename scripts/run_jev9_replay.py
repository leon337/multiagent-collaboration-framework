#!/usr/bin/env python3
import argparse
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

def call(endpoint, state, timeout=150):
    payload = json.dumps({"state": state}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(endpoint, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    started = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            code = resp.getcode()
        return code, json.loads(body), int((time.time() - started) * 1000), None
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(body)
        except Exception:
            data = None
        return exc.code, data, int((time.time() - started) * 1000), body
    except Exception as exc:
        return 0, None, int((time.time() - started) * 1000), str(exc)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selected", required=True)
    ap.add_argument("--endpoint", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    cases = json.loads(Path(args.selected).read_text(encoding="utf-8"))
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    with out.open("w", encoding="utf-8") as fh:
        for case in cases:
            for lane in range(1, 10):
                total_latency = 0
                ok = False
                last_code = 0
                last_data = None
                last_error = None
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
                    decision = ((answers.get("nextAction") or {}).get("choice"))
                    row = {
                        "caseId": case["id"],
                        "lane": lane,
                        "ok": True,
                        "decision": decision,
                        "latencyMs": total_latency,
                        "answers": answers,
                        "attempts": attempt,
                    }
                else:
                    message = None
                    if isinstance(last_data, dict):
                        message = last_data.get("message") or last_data.get("error")
                    row = {
                        "caseId": case["id"],
                        "lane": lane,
                        "ok": False,
                        "decision": None,
                        "latencyMs": total_latency,
                        "attempts": 3,
                        "http": last_code,
                        "error": message or last_error or f"HTTP {last_code}",
                    }
                fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                fh.flush()
                print(f"{case['id']} lane={lane} decision={row.get('decision')} error={bool(row.get('error'))} latency={total_latency}ms")

if __name__ == "__main__":
    main()
