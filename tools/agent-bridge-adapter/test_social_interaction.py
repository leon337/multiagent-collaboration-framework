#!/usr/bin/env python3
"""Offline tests: semantic discrimination, policy, uncertainty, idempotency."""
import hashlib
import hmac
import json
import time
from pathlib import Path
import os
import stat
import tempfile
import unittest

from social_interaction import (
    Action, ActionJournal, InteractionBlocked, InteractionUncertain,
    build_review_plan, control_preflight, execute_one, validate_post_url,
    SignedGrantVerifier,
)

POST = "https://www.instagram.com/mnt_visionario/p/DJR_x-nubA5/"
FRAME = POST


def ax(liked=False, comment_likes=3):
    names = ["Mais opções", "Descurtir" if liked else "Curtir", "1", "Comentar",
             "3", "Compartilhar", "Salvar"]
    nodes = [{"role": "button", "name": n, "id": str(i), "frameUrl": FRAME,
              "properties": {"focusable": True}} for i, n in enumerate(names)]
    for x in range(comment_likes):
        nodes += [
            {"role": "button", "name": "Responder", "id": "r"+str(x), "frameUrl": FRAME},
            {"role": "button", "name": "Curtir", "id": "c"+str(x), "frameUrl": FRAME},
        ]
    nodes.append({"role": "textbox", "name": "Adicione um comentário...",
                  "id": "editor", "frameUrl": FRAME,
                  "properties": {"readonly": False, "editable": "plaintext"}})
    return {"ok": True, "nodes": nodes}


class FakeAdapter:
    def __init__(self, action: Action, fail=False, no_postcondition=False):
        self.action = action
        self.fail = fail
        self.no_postcondition = no_postcondition
        self.calls = 0
        self.liked = False
        self.comments = []

    def observe(self, action):
        return {"url": POST, "accessibility": ax(liked=self.liked),
                "actorId": action.actor_id,
                "likedByMe": self.liked,
                "ownComments": [{"authorId": action.actor_id, "text": c,
                                 "published": True} for c in self.comments]}

    def perform(self, action, control):
        self.calls += 1
        if self.fail:
            raise TimeoutError("network unavailable / effect unknown")
        if self.no_postcondition:
            return
        if action.kind == "like":
            self.liked = True
        else:
            self.comments.append(action.text)


class SocialInteractionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "ledger" / "actions.jsonl"
        self.key = bytes(range(32))
        self.now = int(time.time())
        self.verifier = SignedGrantVerifier(self.key, now=lambda: self.now)

    def grant(self, action: Action, *, actor=None, text_digest=None, expiry=None):
        claims = {
            "schema": SignedGrantVerifier.SCHEMA,
            "issuer": "MCF-MissionRuntime",
            "audience": "mcf-social-executor",
            "actorId": actor or action.actor_id,
            "profile": action.profile,
            "postUrl": action.url,
            "kind": action.kind,
            "commentDigest": text_digest or hashlib.sha256(
                (action.text or "").encode("utf-8")
            ).hexdigest(),
            "issuedAt": self.now,
            "expiresAt": expiry or self.now + 60,
            "nonce": "0123456789abcdef0123456789abcdef",
        }
        canonical = json.dumps(claims, sort_keys=True, separators=(",", ":")).encode()
        return {
            "claims": claims,
            "signature": hmac.new(self.key, canonical, hashlib.sha256).hexdigest(),
        }

    def perform(self, action, adapter, grant=None):
        return execute_one(action, adapter, self.journal(),
                           grant if grant is not None else self.grant(action),
                           self.verifier)

    def journal(self):
        return ActionJournal(self.path)

    def test_main_like_discriminated_from_comment_likes(self):
        result = control_preflight(ax(comment_likes=3), POST)
        self.assertEqual(result["primaryLikeNode"], "1")
        self.assertEqual(result["commentLikeButtons"], 3)
        self.assertEqual(result["commentEditorNode"], "editor")

    def test_existing_like_no_write(self):
        a = Action("mnt_visionario", POST, "like", actor_id="test_actor")
        b = FakeAdapter(a)
        b.liked = True
        self.assertEqual(self.perform(a, b), "ALREADY_LIKED_NO_WRITE")
        self.assertEqual(b.calls, 0)
        self.assertFalse(self.path.exists())

    def test_ambiguous_like_fails_closed(self):
        data = ax()
        data["nodes"] = data["nodes"][:7] + data["nodes"][:7] + data["nodes"][7:]
        with self.assertRaisesRegex(InteractionBlocked, "ambiguous"):
            control_preflight(data, POST)
        data = ax()
        data["nodes"] = [x for x in data["nodes"] if x.get("name") != "Comentar"]
        with self.assertRaisesRegex(InteractionBlocked, "ambiguous"):
            control_preflight(data, POST)

    def test_wrong_frame_and_missing_editor(self):
        data = ax()
        for x in data["nodes"]:
            x["frameUrl"] = "https://www.instagram.com/other/"
        with self.assertRaisesRegex(InteractionBlocked, "ambiguous"):
            control_preflight(data, POST)
        data = ax()
        data["nodes"] = [x for x in data["nodes"] if x.get("role") != "textbox"]
        with self.assertRaisesRegex(InteractionBlocked, "editor"):
            control_preflight(data, POST)

    def test_invalid_url_or_comment(self):
        for url in ("http://www.instagram.com/mnt_visionario/p/DJR_x-nubA5/",
                    "https://evil.example/mnt_visionario/p/DJR_x-nubA5/",
                    "https://www.instagram.com/mnt_visionario/p/DJR_x-nubA5/?secret=1",
                    "https://www.instagram.com/another/p/DJR_x-nubA5/",
                    "https://www.instagram.com/mnt_visionario/direct/inbox/"):
            with self.assertRaises(InteractionBlocked):
                validate_post_url(url, "mnt_visionario")
        with self.assertRaisesRegex(InteractionBlocked, "invalid_comment"):
            Action("mnt_visionario", POST, "comment", "oi", actor_id="test_actor").checked()

    def test_write_capability_required(self):
        a = Action("mnt_visionario", POST, "like", actor_id="test_actor")
        b = FakeAdapter(a)
        with self.assertRaisesRegex(InteractionBlocked, "grant"):
            self.perform(a, b, grant=False)
        self.assertEqual(b.calls, 0)

    def test_false_boolean_and_forged_grants_rejected(self):
        a = Action("mnt_visionario", POST, "like", actor_id="test_actor")
        b = FakeAdapter(a)
        with self.assertRaisesRegex(InteractionBlocked, "grant"):
            self.perform(a, b, grant=True)
        forged = self.grant(a)
        forged["signature"] = "0" * 64
        with self.assertRaisesRegex(InteractionBlocked, "grant"):
            self.perform(a, b, grant=forged)
        self.assertEqual(b.calls, 0)
        self.assertFalse(self.path.exists())

    def test_wrong_actor_and_comment_scope_rejected(self):
        a = Action("mnt_visionario", POST, "comment",
                   "Qual uma boa meta semanal para iniciar?", actor_id="test_actor")
        b = FakeAdapter(a)
        for grant in (
            self.grant(a, actor="different_account"),
            self.grant(a, text_digest="0" * 64),
            self.grant(a, expiry=self.now - 1),
        ):
            with self.assertRaisesRegex(InteractionBlocked, "grant"):
                self.perform(a, b, grant=grant)
        self.assertEqual(b.calls, 0)

    def test_authenticated_actor_mismatch_no_write(self):
        a = Action("mnt_visionario", POST, "like", actor_id="test_actor")
        b = FakeAdapter(a)
        b.observe = lambda _: {
            "url": POST, "actorId": "wrong_account",
            "accessibility": ax(liked=False)
        }
        with self.assertRaisesRegex(InteractionBlocked, "actor_mismatch"):
            self.perform(a, b)
        self.assertEqual(b.calls, 0)

    def test_missing_actor_blocks(self):
        a = Action("mnt_visionario", POST, "like")
        b = FakeAdapter(a)
        with self.assertRaisesRegex(InteractionBlocked, "actor_required"):
            self.perform(a, b)
        self.assertEqual(b.calls, 0)

    def test_like_verification_and_duplicate_lock(self):
        a = Action("mnt_visionario", POST, "like", actor_id="test_actor")
        b = FakeAdapter(a)
        self.assertEqual(self.perform(a, b), "VERIFIED")
        rows = [json.loads(x) for x in self.path.read_text().splitlines()]
        self.assertEqual([x["status"] for x in rows], ["PREPARED", "VERIFIED"])
        self.assertEqual(stat.S_IMODE(self.path.stat().st_mode), 0o600)
        self.assertEqual(stat.S_IMODE(self.path.parent.stat().st_mode), 0o700)
        self.assertEqual(self.perform(a, b), "ALREADY_LIKED_NO_WRITE")
        self.assertEqual(b.calls, 1)

    def test_comment_verification(self):
        a = Action("mnt_visionario", POST, "comment",
                   "A proposta de começar com uma ação pequena é interessante.", actor_id="test_actor")
        b = FakeAdapter(a)
        self.assertEqual(self.perform(a, b), "VERIFIED")
        self.assertEqual(b.comments, [a.text])
        self.assertEqual(self.perform(a, b), "ALREADY_COMMENTED_NO_WRITE")

    def test_uncertain_never_retries(self):
        a = Action("mnt_visionario", POST, "comment",
                   "Uma meta semanal poderia tornar o exercício mais concreto.", actor_id="test_actor")
        b = FakeAdapter(a, fail=True)
        with self.assertRaisesRegex(InteractionUncertain, "unknown"):
            self.perform(a, b)
        self.assertEqual(
            [json.loads(x)["status"] for x in self.path.read_text().splitlines()],
            ["PREPARED", "UNKNOWN"])
        with self.assertRaisesRegex(InteractionBlocked, "reconcile"):
            self.perform(a, b)
        self.assertEqual(b.calls, 1)

    def test_other_authors_comment_does_not_count(self):
        a = Action("mnt_visionario", POST, "comment",
                   "Como você acompanha seus resultados?", actor_id="test_actor")
        b = FakeAdapter(a)
        b.observe = lambda _: {
            "url": POST, "actorId": "test_actor", "accessibility": ax(),
            "ownComments": [{"authorId": "someone_else", "text": a.text,
                             "published": True}],
        }
        self.assertFalse(self.path.exists())
        # Other people's same text must not satisfy the postcondition.
        with self.assertRaises(InteractionUncertain):
            self.perform(a, b)
        self.assertEqual(b.calls, 1)
        self.assertIn('"UNKNOWN"', self.path.read_text())

    def test_draft_is_not_published_evidence(self):
        a = Action("mnt_visionario", POST, "comment",
                   "Como identificar uma mudança de hábito?", actor_id="test_actor")
        b = FakeAdapter(a)
        b.observe = lambda _: {
            "url": POST, "actorId": "test_actor", "accessibility": ax(),
            "ownComments": [{"authorId": "test_actor", "text": a.text,
                             "published": False}],
        }
        with self.assertRaises(InteractionUncertain):
            self.perform(a, b)
        self.assertEqual(b.calls, 1)
        self.assertIn('"UNKNOWN"', self.path.read_text())

    def test_journal_rejects_unexpected_status(self):
        a = Action("mnt_visionario", POST, "like", actor_id="test_actor")
        with self.assertRaisesRegex(InteractionBlocked, "invalid_journal_status"):
            self.journal().record(a, "SUCCESS")

    def test_missing_postcondition_never_green(self):
        a = Action("mnt_visionario", POST, "like", actor_id="test_actor")
        b = FakeAdapter(a, no_postcondition=True)
        with self.assertRaises(InteractionUncertain):
            self.perform(a, b)
        self.assertIn('"UNKNOWN"', self.path.read_text())

    def test_wrong_page_no_mutation(self):
        a = Action("mnt_visionario", POST, "like", actor_id="test_actor")
        b = FakeAdapter(a)
        b.observe = lambda _: {"url": "https://www.instagram.com/other/"}
        with self.assertRaisesRegex(InteractionBlocked, "wrong_page"):
            self.perform(a, b)
        self.assertEqual(b.calls, 0)

    def test_plan_from_drafts_and_no_autopublish(self):
        source = {"acoes": [{"url": POST, "acao_comentar": {
            "texto_sugerido": "Qual atitude você recomenda para começar hoje?"}}]}
        plan = build_review_plan(source, "mnt_visionario")
        self.assertFalse(plan["writeEnabled"])
        self.assertEqual(plan["total"], 1)
        self.assertEqual(plan["actions"][0]["commentStatus"], "DRAFT")
        source["acoes"].append(source["acoes"][0])
        with self.assertRaisesRegex(InteractionBlocked, "duplicate"):
            build_review_plan(source, "mnt_visionario")


if __name__ == "__main__":
    unittest.main()
