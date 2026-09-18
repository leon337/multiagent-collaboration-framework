#!/usr/bin/env python3
import queue
import threading
import time
import uuid
from collections import deque
from datetime import datetime


class SpeechQueue:
    def __init__(self, execute, log, history_size=120):
        self._execute = execute
        self._log = log
        self._queue = queue.Queue()
        self._lock = threading.RLock()
        self._current = None
        self._jobs = {}
        self._recent = deque(maxlen=history_size)
        self._worker = threading.Thread(
            target=self._run,
            name="voicehub-speech-queue",
            daemon=True,
        )
        self._worker.start()

    @staticmethod
    def _now():
        return datetime.now().isoformat(timespec="seconds")

    @staticmethod
    def _public(job):
        if not job:
            return None
        return {
            "id": job["id"],
            "status": job["status"],
            "queued_at": job["queued_at"],
            "started_at": job.get("started_at"),
            "finished_at": job.get("finished_at"),
            "agent": job["meta"].get("agent"),
            "project": job["meta"].get("project"),
            "mission": job["meta"].get("mission"),
            "phase": job["meta"].get("phase"),
            "source": job["meta"].get("source"),
            "radio_fx": bool(job["meta"].get("radio_fx")),
            "result": job.get("result"),
            "error": job.get("error"),
        }

    @staticmethod
    def _identity_text(text, meta, identify):
        if not identify:
            return text
        required = ("agent", "project", "mission", "phase")
        missing = [key for key in required if not str(meta.get(key) or "").strip()]
        if missing:
            raise ValueError(
                "Metadados obrigatórios ausentes para reporte identificado: "
                + ", ".join(missing)
            )
        return (
            f"{meta['agent']}. Projeto {meta['project']}. "
            f"Missão {meta['mission']}. Fase {meta['phase']}. {text}"
        )

    def enqueue(self, text, mode=None, meta=None, identify=False, wait=False, timeout=120):
        meta = dict(meta or {})
        spoken_text = self._identity_text(str(text).strip(), meta, identify)
        if not spoken_text:
            raise ValueError("Texto vazio")
        job = {
            "id": uuid.uuid4().hex,
            "text": spoken_text,
            "mode": mode,
            "meta": meta,
            "status": "QUEUED",
            "queued_at": self._now(),
            "_event": threading.Event(),
        }
        with self._lock:
            self._jobs[job["id"]] = job
            queue_position = self._queue.qsize() + (1 if self._current else 0) + 1
        self._queue.put(job)
        self._log(
            "SPEECH_QUEUE enqueue "
            f"id={job['id']} position={queue_position} "
            f"agent={meta.get('agent') or '-'} project={meta.get('project') or '-'} "
            f"mission={meta.get('mission') or '-'} phase={meta.get('phase') or '-'}"
        )
        if not wait:
            payload = self._public(job)
            payload["queue_position"] = queue_position
            return payload
        completed = job["_event"].wait(max(1, int(timeout)))
        payload = self._public(job)
        payload["wait_completed"] = completed
        return payload

    def _run(self):
        while True:
            job = self._queue.get()
            try:
                with self._lock:
                    self._current = job
                    job["status"] = "PLAYING"
                    job["started_at"] = self._now()
                self._log(
                    "SPEECH_QUEUE start "
                    f"id={job['id']} agent={job['meta'].get('agent') or '-'} "
                    f"project={job['meta'].get('project') or '-'}"
                )
                result = self._execute(job["text"], job.get("mode"), job.get("meta"))
                with self._lock:
                    job["status"] = "DONE"
                    job["result"] = result
                    job["finished_at"] = self._now()
                self._log(f"SPEECH_QUEUE done id={job['id']}")
            except Exception as exc:
                with self._lock:
                    job["status"] = "FAILED"
                    job["error"] = f"{type(exc).__name__}: {exc}"[:240]
                    job["finished_at"] = self._now()
                self._log(f"SPEECH_QUEUE failed id={job['id']} error={job['error']}", "ERROR")
            finally:
                with self._lock:
                    self._recent.appendleft(self._public(job))
                    self._current = None
                    job["_event"].set()
                    if len(self._jobs) > 300:
                        keep = {x["id"] for x in list(self._recent)[:180]}
                        self._jobs = {
                            key: value
                            for key, value in self._jobs.items()
                            if key in keep or value["status"] in ("QUEUED", "PLAYING")
                        }
                self._queue.task_done()

    def status(self):
        with self._lock:
            current = self._public(self._current)
            pending = self._queue.qsize()
            recent = list(self._recent)[:20]
        return {
            "busy": bool(current) or pending > 0,
            "current": current,
            "pending_count": pending,
            "recent": recent,
        }

    def job(self, job_id):
        with self._lock:
            return self._public(self._jobs.get(job_id))
