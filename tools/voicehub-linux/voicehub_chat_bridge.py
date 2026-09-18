#!/usr/bin/env python3
import json
import os
import re
import subprocess
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path

import pyatspi

HOME = Path.home()
APP_DIR = Path(__file__).resolve().parent
LOG_DIR = APP_DIR / "logs"
HISTORY_FILE = LOG_DIR / "chat-history.jsonl"
EVENT_FILE = LOG_DIR / "chat-bridge-events.jsonl"
TARGET_TITLE = "Ponte VoiceHub Local - Brave"
TARGET_MARKER = "VOICEHUB_BRIDGE_SESSION_20260917"
SEND_TIMEOUT = 90
POLL_INTERVAL = 0.8
STABLE_HITS_REQUIRED = 3
LOCK = threading.Lock()

LOG_DIR.mkdir(parents=True, exist_ok=True)

def _now():
    return datetime.now().isoformat(timespec="seconds")
def _event(correlation_id, event, **extra):
    record = {
        "ts": _now(),
        "correlation_id": correlation_id,
        "event": event,
        **extra,
    }
    with EVENT_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

def _desktop():
    return pyatspi.Registry.getDesktop(0)

def _find_frame():
    for app in _desktop():
        if app is None:
            continue
        try:
            if app.name != "Brave Browser":
                continue
            count = app.childCount
        except Exception:
            continue
        for i in range(count):
            try:
                frame = app.getChildAtIndex(i)
                title = (frame.name or "") if frame is not None else ""
            except Exception:
                continue
            if TARGET_TITLE in title:
                return frame
    return None
def _walk(root, predicate, max_depth=28):
    out = []
    def walk(node, depth=0):
        if node is None or depth > max_depth:
            return
        try:
            if predicate(node):
                out.append(node)
        except Exception:
            pass
        try:
            count = node.childCount
        except Exception:
            return
        for idx in range(count):
            try:
                child = node.getChildAtIndex(idx)
            except Exception:
                continue
            if child is not None:
                walk(child, depth + 1)
    walk(root)
    return out

def _find_first(root, predicate, max_depth=28):
    found = [None]
    def walk(node, depth=0):
        if found[0] is not None or node is None or depth > max_depth:
            return
        try:
            if predicate(node):
                found[0] = node
                return
        except Exception:
            pass
        try:
            count = node.childCount
        except Exception:
            return
        for idx in range(count):
            if found[0] is not None:
                break
            try:
                child = node.getChildAtIndex(idx)
            except Exception:
                continue
            walk(child, depth + 1)
    walk(root)
    return found[0]

def _find_prompt(frame):
    return _find_first(
        frame,
        lambda n: n.getRoleName() == "entry"
        and any(a == "id:prompt-textarea" for a in n.getAttributes()),
    )

def _extract_section_text(section):
    parts = []
    ignored = {
        "Você disse:", "You said:", "O ChatGPT disse:", "ChatGPT said:",
        "Copiar mensagem", "Copy message", "Copiar resposta", "Copy response",
        "Avaliar resposta", "Rate response", "Compartilhar", "Share",
        "Compartilhar prompt", "Editar mensagem", "Edit message",
        "Alternar modelo", "Switch model", "Mais ações", "More actions",
    }
    def collect(node, depth=0):
        if node is None or depth > 18:
            return
        try:
            role = node.getRoleName()
            name = (node.name or "").strip()
            count = node.childCount
        except Exception:
            return
        if count == 0 and name and name not in ignored:
            if role not in ("push button", "menu item", "check box"):
                parts.append(name)
        for idx in range(count):
            try:
                child = node.getChildAtIndex(idx)
            except Exception:
                continue
            collect(child, depth + 1)
    collect(section)
    cleaned = []
    for part in parts:
        if not cleaned or part != cleaned[-1]:
            cleaned.append(part)
    text = " ".join(cleaned)
    text = re.sub(r"\s+([,.;:!?%)\]])", r"\1", text)
    text = re.sub(r"([\[(])\s+", r"\1", text)
    return re.sub(r"\s+", " ", text).strip()
def _conversation_blocks(frame):
    headings = _walk(
        frame,
        lambda n: n.getRoleName() == "heading"
        and (n.name or "").strip() in (
            "Você disse:", "You said:",
            "O ChatGPT disse:", "ChatGPT said:",
        ),
    )
    blocks = []
    seen = set()
    for heading in headings:
        section = heading.parent
        if section is None:
            continue
        key = id(section)
        if key in seen:
            continue
        seen.add(key)
        label = (heading.name or "").strip()
        role = "assistant" if label in ("O ChatGPT disse:", "ChatGPT said:") else "user"
        blocks.append({
            "role": role,
            "section": section,
            "text": _extract_section_text(section),
        })
    return blocks

def _generation_in_progress(frame):
    buttons = _walk(
        frame,
        lambda n: n.getRoleName() == "push button"
        and any(
            token in (n.name or "").strip().lower()
            for token in ("parar geração", "stop generating", "parar resposta", "stop response")
        ),
        max_depth=24,
    )
    return bool(buttons)
def _clipboard_get():
    try:
        return subprocess.check_output(
            ["xclip", "-selection", "clipboard", "-o"],
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return b""

def _clipboard_set(data):
    subprocess.run(
        ["xclip", "-selection", "clipboard"],
        input=data,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True,
    )

def _window_id_by_title():
    try:
        raw = subprocess.check_output(["wmctrl", "-l"], text=True)
    except Exception:
        return None
    for line in raw.splitlines():
        if TARGET_TITLE in line:
            try:
                return int(line.split()[0], 16)
            except Exception:
                continue
    return None

def _active_window_id():
    try:
        return int(subprocess.check_output(["xdotool", "getactivewindow"], text=True).strip())
    except Exception:
        return None

def _activate_window(window_id):
    if not window_id:
        return False
    try:
        subprocess.run(
            ["xdotool", "windowactivate", "--sync", str(window_id)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return True
    except Exception:
        return False

def _correlation_index(frame, correlation_id):
    blocks = _conversation_blocks(frame)
    found = None
    for idx, block in enumerate(blocks):
        if block["role"] == "user" and correlation_id in block["text"]:
            found = idx
    return found

def _submit_wire_message(wire_text, correlation_id):
    target_window = _window_id_by_title()
    previous_window = _active_window_id()
    old_clipboard = _clipboard_get()
    attempts = 0
    try:
        for attempts in (1, 2):
            if target_window:
                _activate_window(target_window)
                time.sleep(0.2)
            frame = _find_frame()
            if not frame:
                continue
            prompt = _find_prompt(frame)
            if not prompt:
                continue
            try:
                prompt.queryComponent().grabFocus()
            except Exception:
                pass
            _clipboard_set(wire_text.encode("utf-8"))
            subprocess.run(["xdotool", "key", "ctrl+a"], check=True)
            subprocess.run(["xdotool", "key", "ctrl+v"], check=True)
            time.sleep(0.55)
            subprocess.run(["xdotool", "key", "Return"], check=True)
            time.sleep(0.7)

            verify_deadline = time.monotonic() + 5.0
            while time.monotonic() < verify_deadline:
                frame = _find_frame()
                if frame and _correlation_index(frame, correlation_id) is not None:
                    return True, attempts
                time.sleep(0.4)
        return False, attempts
    finally:
        _clipboard_set(old_clipboard)
        if previous_window and previous_window != target_window:
            _activate_window(previous_window)

def _append_history(role, text, correlation_id=None, source=None, **extra):
    record = {
        "ts": _now(),
        "role": role,
        "text": text,
    }
    if correlation_id:
        record["correlation_id"] = correlation_id
    if source:
        record["source"] = source
    record.update(extra)
    with HISTORY_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
def _new_correlation_id():
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"VH-{stamp}-{suffix}"

def _wire_message(text, correlation_id, source):
    return (
        f"[VOICEHUB_BRIDGE source={source} correlation_id={correlation_id}]\n"
        f"{text}"
    )

def status():
    with LOCK:
        try:
            frame = _find_frame()
            if not frame:
                return {
                    "connected": False,
                    "title": None,
                    "prompt_ready": False,
                    "marker_found": False,
                }
            prompt = _find_prompt(frame)
            blocks = _conversation_blocks(frame)
            marker_visible = any(
                TARGET_MARKER in block["text"]
                for block in blocks
                if block["role"] == "user"
            )
            title_verified = TARGET_TITLE in (frame.name or "")
            return {
                "connected": True,
                "title": frame.name,
                "prompt_ready": bool(prompt),
                "marker_found": bool(title_verified),
                "marker_visible": marker_visible,
                "session_verified_by": "title" if title_verified else "none",
                "assistant_messages": sum(1 for b in blocks if b["role"] == "assistant"),
                "user_messages": sum(1 for b in blocks if b["role"] == "user"),
            }
        except Exception as exc:
            return {
                "connected": False,
                "title": None,
                "prompt_ready": False,
                "marker_found": False,
                "error": f"{type(exc).__name__}: {exc}",
            }

def send_message(text, timeout=SEND_TIMEOUT, source="voicehub_ui"):
    text = str(text or "").strip()
    source = re.sub(r"[^a-zA-Z0-9_.-]+", "_", str(source or "voicehub_ui"))[:64]
    if not text:
        raise ValueError("Mensagem vazia")
    if len(text) > 4000:
        raise ValueError("Mensagem excede 4000 caracteres")

    correlation_id = _new_correlation_id()
    started = time.monotonic()
    _event(correlation_id, "send_started", source=source, text_len=len(text))
    with LOCK:
        frame = _find_frame()
        if not frame:
            _event(correlation_id, "send_failed", reason="frame_not_found")
            raise RuntimeError("Conversa Ponte VoiceHub Local não encontrada")
        prompt = _find_prompt(frame)
        if not prompt:
            _event(correlation_id, "send_failed", reason="prompt_not_found")
            raise RuntimeError("Campo de mensagem do ChatGPT não encontrado")

        old_blocks = _conversation_blocks(frame)
        wire_text = _wire_message(text, correlation_id, source)
        submitted, submit_attempts = _submit_wire_message(wire_text, correlation_id)
        if not submitted:
            _event(
                correlation_id,
                "send_failed",
                reason="correlation_not_observed_after_submit",
                submit_attempts=submit_attempts,
            )
            raise RuntimeError(
                f"Mensagem não apareceu na conversa após {submit_attempts} tentativas. ID {correlation_id}"
            )

        _append_history("user", text, correlation_id, source, status="sent")
        _event(
            correlation_id,
            "prompt_submitted",
            prior_blocks=len(old_blocks),
            submit_attempts=submit_attempts,
        )

        deadline = time.monotonic() + max(10, int(timeout))
        last_text = ""
        stable_hits = 0
        correlation_seen = False
        while time.monotonic() < deadline:
            time.sleep(POLL_INTERVAL)
            frame = _find_frame()
            if not frame:
                continue
            blocks = _conversation_blocks(frame)

            corr_index = None
            for idx, block in enumerate(blocks):
                if block["role"] == "user" and correlation_id in block["text"]:
                    corr_index = idx
            if corr_index is None:
                continue
            if not correlation_seen:
                correlation_seen = True
                _event(correlation_id, "correlation_observed", block_index=corr_index)

            later_users = [
                b for b in blocks[corr_index + 1:]
                if b["role"] == "user"
            ]
            if later_users:
                _event(correlation_id, "send_aborted", reason="concurrent_composer_activity")
                raise RuntimeError(
                    "Detectei mensagem enviada pelo composer durante a requisição do VoiceHub"
                )

            assistants = [
                b for b in blocks[corr_index + 1:]
                if b["role"] == "assistant"
            ]
            if not assistants:
                continue

            reply = assistants[0]["text"].strip()
            if not reply:
                continue

            generating = _generation_in_progress(frame)
            if reply == last_text:
                stable_hits += 1
            else:
                last_text = reply
                stable_hits = 0

            _event(
                correlation_id,
                "response_poll",
                reply_len=len(reply),
                stable_hits=stable_hits,
                generating=generating,
            )

            if stable_hits >= STABLE_HITS_REQUIRED and not generating:
                elapsed_ms = int((time.monotonic() - started) * 1000)
                _append_history(
                    "assistant",
                    reply,
                    correlation_id,
                    "chatgpt_bridge",
                    status="received",
                    latency_ms=elapsed_ms,
                )
                _event(
                    correlation_id,
                    "response_complete",
                    latency_ms=elapsed_ms,
                    reply_len=len(reply),
                )
                return {
                    "ok": True,
                    "reply": reply,
                    "title": frame.name,
                    "elapsed_ms": elapsed_ms,
                    "correlation_id": correlation_id,
                    "source": source,
                }

        elapsed_ms = int((time.monotonic() - started) * 1000)
        _event(
            correlation_id,
            "send_timeout",
            latency_ms=elapsed_ms,
            correlation_seen=correlation_seen,
            last_reply_len=len(last_text),
        )
        raise TimeoutError(
            f"ChatGPT respondeu de forma incompleta ou não estabilizou no prazo. ID {correlation_id}"
        )

def history(limit=50):
    if not HISTORY_FILE.exists():
        return []
    rows = []
    for line in HISTORY_FILE.read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
    return rows[-max(1, min(int(limit), 200)):]

def clear_history():
    HISTORY_FILE.write_text("", encoding="utf-8")
    os.chmod(HISTORY_FILE, 0o600)
    return True
def events(limit=80):
    if not EVENT_FILE.exists():
        return []
    rows = []
    for line in EVENT_FILE.read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
    return rows[-max(1, min(int(limit), 300)):]

if __name__ == "__main__":
    print(json.dumps(status(), ensure_ascii=False, indent=2))
