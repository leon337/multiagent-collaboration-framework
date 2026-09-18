from __future__ import annotations

import hashlib
import json
import uuid
from pathlib import Path
from typing import Any, Callable

try:
    import fcntl
except ImportError:  # pragma: no cover
    fcntl = None


class MailboxDispatchError(RuntimeError):
    pass


class MailboxBackpressure(MailboxDispatchError):
    pass


class MailboxDispatcher:
    """Durable, target-ordered dispatcher over the Mission Journal."""

    def __init__(
        self,
        runtime,
        lock_dir: str | Path,
        *,
        max_pending_per_target: int = 100,
        max_message_bytes: int = 64 * 1024,
        max_batch: int = 50,
    ):
        if max_pending_per_target < 1 or max_message_bytes < 1 or max_batch < 1:
            raise ValueError("mailbox limits must be positive")
        self.runtime = runtime
        self.lock_dir = Path(lock_dir)
        self.lock_dir.mkdir(parents=True, exist_ok=True)
        self.max_pending_per_target = int(max_pending_per_target)
        self.max_message_bytes = int(max_message_bytes)
        self.max_batch = int(max_batch)

    @staticmethod
    def _content_text(content: Any) -> str:
        if isinstance(content, str):
            return content
        return json.dumps(content, ensure_ascii=False, sort_keys=True)

    def _lock_path(self, target_id: str) -> Path:
        name = hashlib.sha256(target_id.encode("utf-8")).hexdigest()
        return self.lock_dir / f"{name}.lock"

    def _ordered_pending(self, target_id: str) -> list[dict[str, Any]]:
        projection = self.runtime.projection()
        pending: list[dict[str, Any]] = []
        for event in self.runtime.store.events(self.runtime.mission_id):
            if event.event_type != "message/queued":
                continue
            p = event.payload
            if p.get("target_id") != target_id:
                continue
            message_id = p.get("message_id")
            if message_id in projection.delivered_messages:
                continue
            attempt = projection.delivery_attempts.get(message_id)
            pending.append({
                **p,
                "queued_seq": event.seq,
                "queued_at": event.timestamp,
                "delivery_attempt": None if attempt is None else dict(attempt),
                "reconciliation_required": bool(
                    attempt is not None and attempt.get("status") == "started"
                ),
            })
        return pending

    def pending_count(self, target_id: str) -> int:
        return len(self._ordered_pending(target_id))

    def queue(
        self,
        message_id: str,
        sender_id: str,
        target_id: str,
        content: Any,
        *,
        actor: str | None = None,
    ) -> dict[str, Any]:
        content_text = self._content_text(content)
        if len(content_text.encode("utf-8")) > self.max_message_bytes:
            raise MailboxBackpressure(f"message exceeds {self.max_message_bytes} byte limit")

        with self._lock_path(target_id).open("a+") as fh:
            if fcntl is not None:
                fcntl.flock(fh.fileno(), fcntl.LOCK_EX)

            projection = self.runtime.projection()
            existing = projection.messages.get(message_id)
            if existing is not None:
                expected = {
                    "message_id": message_id,
                    "sender_id": sender_id,
                    "target_id": target_id,
                    "content": content_text,
                }
                if existing != expected:
                    raise MailboxDispatchError("message id reused with different content")
                return existing

            if self.pending_count(target_id) >= self.max_pending_per_target:
                raise MailboxBackpressure(f"target {target_id} queue limit reached")

            return self.runtime.queue_message(
                message_id,
                sender_id,
                target_id,
                content_text,
                actor or sender_id,
            )

    def dispatch(
        self,
        target_id: str,
        deliver: Callable[[dict[str, Any]], bool | None],
        *,
        batch_size: int | None = None,
        actor: str | None = None,
    ) -> dict[str, Any]:
        batch = min(int(batch_size or self.max_batch), self.max_batch)
        with self._lock_path(target_id).open("a+") as fh:
            if fcntl is not None:
                fcntl.flock(fh.fileno(), fcntl.LOCK_EX)

            pending = self._ordered_pending(target_id)[:batch]
            delivered_ids: list[str] = []
            failed_id = None

            for message in pending:
                ok = deliver(dict(message))
                if ok is False:
                    failed_id = message["message_id"]
                    break
                self.runtime.ack_message(
                    message["message_id"],
                    target_id,
                    actor or target_id,
                )
                delivered_ids.append(message["message_id"])

            return {
                "schema": "mcf_mailbox_dispatch/v1",
                "target_id": target_id,
                "attempted": len(delivered_ids) + (1 if failed_id else 0),
                "delivered": delivered_ids,
                "failed_message_id": failed_id,
                "remaining": self.pending_count(target_id),
            }
