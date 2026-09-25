#!/usr/bin/env python3
import hashlib
import json
import os
import re
import shlex
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

SERIAL = "9a179f5d"
TARGET_ACCOUNT = "eiasophia25@gmail.com"
TARGET_COUNT = 50
MIN_FREE_GIB = 5.0
REPORT = Path("/home/leo/.cache/mcf-phone-drive-cleanup-001-report.json")

def proc(cmd, timeout=30):
    return subprocess.run(cmd, text=True, capture_output=True, timeout=timeout)

def choose_adb():
    candidates = [
        ["adb"],
        ["sudo", "-n", "-u", "leo", "env", "HOME=/home/leo", "adb"],
    ]
    for base in candidates:
        r = proc(base + ["-s", SERIAL, "get-state"], timeout=10)
        if r.returncode == 0 and "device" in r.stdout:
            return base
    raise RuntimeError("ADB_DEVICE_UNAVAILABLE")

ADB = choose_adb()

def adb(*args, timeout=30):
    return proc(ADB + ["-s", SERIAL] + list(args), timeout=timeout)

def shell(command, timeout=30):
    return adb("shell", command, timeout=timeout)

def bounds(node):
    nums = list(map(int, re.findall(r"\d+", node.attrib.get("bounds", ""))))
    return nums if len(nums) == 4 else [0,0,0,0]

def tap_node(node):
    b = bounds(node)
    x = (b[0] + b[2]) // 2
    y = (b[1] + b[3]) // 2
    shell(f"input tap {x} {y}")
    time.sleep(1)

def dump(tag):
    remote = f"/sdcard/{tag}.xml"
    shell(f"uiautomator dump {shlex.quote(remote)} >/dev/null 2>&1")
    r = shell(f"cat {shlex.quote(remote)}")
    if not r.stdout.strip():
        raise RuntimeError("UI_DUMP_EMPTY")
    return ET.fromstring(r.stdout)

def find_node(root, *, text=None, desc=None, rid=None, contains=None):
    for n in root.iter("node"):
        t = n.attrib.get("text", "")
        d = n.attrib.get("content-desc", "")
        r = n.attrib.get("resource-id", "")
        if text is not None and t != text: continue
        if desc is not None and d != desc: continue
        if rid is not None and r != rid: continue
        if contains is not None and contains not in (t + " " + d): continue
        return n
    return None

def ensure_drive_uploads():
    shell("input keyevent KEYCODE_WAKEUP")
    shell("svc power stayon true")
    adb("shell","am","start","-W","-a","android.intent.action.MAIN",
        "-c","android.intent.category.LAUNCHER",
        "-n","com.google.android.apps.docs/.app.NewMainProxyActivity",
        "--activity-clear-top", timeout=20)
    time.sleep(3)
    root = dump("mcf377_main")

    account = find_node(root, rid="com.google.android.apps.docs:id/selected_account_disc")
    if account is None:
        raise RuntimeError("DRIVE_ACCOUNT_CONTROL_NOT_FOUND")
    if TARGET_ACCOUNT not in account.attrib.get("content-desc",""):
        tap_node(account)
        time.sleep(1)
        root = dump("mcf377_accounts")
        target = find_node(root, contains=TARGET_ACCOUNT)
        if target is None:
            raise RuntimeError("TARGET_DRIVE_ACCOUNT_NOT_AVAILABLE")
        tap_node(target)
        time.sleep(3)
        root = dump("mcf377_account_selected")
        account = find_node(root, rid="com.google.android.apps.docs:id/selected_account_disc")
        if account is None or TARGET_ACCOUNT not in account.attrib.get("content-desc",""):
            raise RuntimeError("TARGET_DRIVE_ACCOUNT_NOT_CONFIRMED")

    # Open navigation and choose Uploads unless already there.
    if find_node(root, text="Uploads") is None:
        nav = find_node(root, rid="com.google.android.apps.docs:id/more_actions_nav_button")
        if nav is None:
            nav = find_node(root, desc="Mais ações")
        if nav is None:
            raise RuntimeError("DRIVE_NAVIGATION_CONTROL_NOT_FOUND")
        tap_node(nav)
        time.sleep(1)
        root = dump("mcf377_nav")
        uploads = find_node(root, text="Uploads")
        if uploads is None:
            uploads = find_node(root, desc="Uploads")
        if uploads is None:
            raise RuntimeError("DRIVE_UPLOADS_DESTINATION_NOT_FOUND")
        tap_node(uploads)
        time.sleep(3)

    root = dump("mcf377_uploads")
    if find_node(root, text="Uploads") is None:
        raise RuntimeError("DRIVE_UPLOADS_SCREEN_NOT_CONFIRMED")

def item_is_uploaded(node):
    texts = [(c.attrib.get("text","") + " " + c.attrib.get("content-desc","")).strip()
             for c in node.iter("node")]
    return any("Enviado por upload" in s for s in texts)

def item_name(node):
    d = node.attrib.get("content-desc","").strip()
    if not d or d.startswith("Mais ações para "):
        return None
    if re.search(r"\.[A-Za-z0-9]{2,6}$", d) and item_is_uploaded(node):
        return d
    return None

def collect_recent_uploads():
    # Force list toward newest/top.
    for _ in range(6):
        shell("input swipe 540 650 540 1900 250")
        time.sleep(0.25)

    found = []
    seen = set()
    stagnant = 0
    for idx in range(40):
        root = dump(f"mcf377_scan_{idx}")
        visible = []
        for n in root.iter("node"):
            name = item_name(n)
            if not name:
                continue
            b = bounds(n)
            if b == [0,0,0,0]:
                continue
            visible.append((b[1], name))
        visible.sort()
        before = len(found)
        for _, name in visible:
            if name not in seen:
                seen.add(name)
                found.append(name)
                if len(found) == TARGET_COUNT:
                    return found
        if len(found) == before:
            stagnant += 1
        else:
            stagnant = 0
        if stagnant >= 4:
            break
        shell("input swipe 540 1900 540 650 350")
        time.sleep(0.5)
    raise RuntimeError(f"UPLOAD_BATCH_INCOMPLETE:{len(found)}")

def parse_media():
    r = adb("shell","content","query",
            "--uri","content://media/external/video/media",
            "--projection","_id:_display_name:_data:_size", timeout=60)
    rows = {}
    for line in r.stdout.splitlines():
        if not line.startswith("Row:"):
            continue
        d = {}
        payload = line.split("Row:",1)[1].strip()
        for part in re.split(r", (?=[A-Za-z0-9_]+=)", payload):
            if "=" in part:
                k,v = part.split("=",1)
                d[k.strip()] = v.strip()
        name = d.get("_display_name","")
        path = d.get("_data","")
        if name and path.startswith("/storage/emulated/0/"):
            rows.setdefault(name, []).append(d)
    return rows

def free_gib():
    r = shell("df -k /data")
    lines = [x for x in r.stdout.splitlines() if x.strip()]
    parts = lines[-1].split()
    avail_kib = int(parts[3])
    return avail_kib / (1024.0 * 1024.0)

def save_report(report):
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

def main():
    host = proc(["hostname"]).stdout.strip()
    if not host.startswith("leo-N43SM"):
        raise RuntimeError("WRONG_SELF_HOSTED_RUNNER")

    ensure_drive_uploads()
    names = collect_recent_uploads()
    if len(names) != TARGET_COUNT:
        raise RuntimeError("UPLOAD_COUNT_NOT_50")

    digest = hashlib.sha256("\n".join(names).encode("utf-8")).hexdigest()
    media = parse_media()
    before = free_gib()

    removed = 0
    already_absent = 0
    ambiguous = 0
    failed = 0
    details = []

    for name in names:
        matches = media.get(name, [])
        if len(matches) == 0:
            already_absent += 1
            details.append({"name":name,"state":"already_absent"})
            continue
        if len(matches) != 1:
            ambiguous += 1
            details.append({"name":name,"state":"ambiguous","matches":len(matches)})
            continue

        row = matches[0]
        path = row.get("_data","")
        file_id = row.get("_id","")
        exists = shell(f"test -e {shlex.quote(path)}").returncode == 0
        if not exists:
            already_absent += 1
            details.append({"name":name,"state":"already_absent"})
            continue

        r = shell(f"rm -f {shlex.quote(path)}")
        still_exists = shell(f"test -e {shlex.quote(path)}").returncode == 0
        if r.returncode == 0 and not still_exists:
            removed += 1
            if file_id.isdigit():
                shell(f"content delete --uri content://media/external/video/media --where \"_id={file_id}\" >/dev/null 2>&1")
            details.append({"name":name,"state":"removed","size":row.get("_size","")})
        else:
            failed += 1
            details.append({"name":name,"state":"delete_failed"})

    after = free_gib()
    unresolved = ambiguous + failed
    report = {
        "mission_id":"MCF-PHONE-DRIVE-CLEANUP-001",
        "drive_account":TARGET_ACCOUNT,
        "confirmed_uploads":len(names),
        "batch_digest_sha256":digest,
        "removed":removed,
        "already_absent":already_absent,
        "ambiguous":ambiguous,
        "failed":failed,
        "free_gib_before":round(before,3),
        "free_gib_after":round(after,3),
        "target_free_gib":MIN_FREE_GIB,
        "target_met":after >= MIN_FREE_GIB,
        "unresolved":unresolved,
        "details":details,
    }
    save_report(report)

    # Privacy-preserving console output: no filenames.
    print("MISSION_ID=MCF-PHONE-DRIVE-CLEANUP-001")
    print(f"CONFIRMED_UPLOADS={len(names)}")
    print(f"BATCH_DIGEST_SHA256={digest}")
    print(f"REMOVED={removed}")
    print(f"ALREADY_ABSENT={already_absent}")
    print(f"AMBIGUOUS={ambiguous}")
    print(f"FAILED={failed}")
    print(f"FREE_GIB_BEFORE={before:.3f}")
    print(f"FREE_GIB_AFTER={after:.3f}")
    print(f"TARGET_MET={str(after >= MIN_FREE_GIB).lower()}")
    print(f"LOCAL_REPORT={REPORT}")

    if unresolved:
        raise SystemExit(3)
    if after < MIN_FREE_GIB:
        raise SystemExit(2)

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # Never print personal filenames on failure.
        print("MISSION_FAILURE=" + type(exc).__name__ + ":" + str(exc).split(":")[0])
        raise SystemExit(10)
