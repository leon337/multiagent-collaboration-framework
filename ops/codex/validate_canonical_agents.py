#!/usr/bin/env python3
"""Validacao estatica dos perfis canonicos Emily e LEO para Codex.

Sem acesso a rede, credenciais ou necessidade de executar o modelo.
Nao representa invocacao real nem gate da missao.
"""
from __future__ import annotations
import pathlib
import hashlib
import json
import os
import runpy
import tempfile
from types import SimpleNamespace
from unittest.mock import patch
import subprocess
import sys
import tomllib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
AGENTS = ROOT / ".codex" / "agents"

def safe_project_config(config: dict) -> bool:
    """Fail closed: nenhum parametro de sandbox, aprovacao, MCP ou permissao aqui."""
    if set(config) != {"agents"} or not isinstance(config.get("agents"), dict):
        return False
    cfg = config["agents"]
    if set(cfg) != {"enabled", "max_concurrent_threads_per_session"}:
        return False
    threads = cfg.get("max_concurrent_threads_per_session")
    return cfg.get("enabled") is True and type(threads) is int and 2 <= threads <= 10


class CanonicalCodexAgentsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = tomllib.loads((ROOT / ".codex" / "config.toml").read_text(encoding="utf-8"))
        cls.roles = {
            key: tomllib.loads((AGENTS / (key + ".toml")).read_text(encoding="utf-8"))
            for key in ("emily", "leo")
        }

    def test_multiagent_enabled_with_bounded_threads(self):
        self.assertTrue(safe_project_config(self.config))

    def test_forbidden_permission_overrides_fail_closed(self):
        raw=(ROOT / ".codex" / "config.toml").read_text(encoding="utf-8")
        attacks=(
            'sandbox_mode = "danger-full-access"\napproval_policy = "never"\n' + raw,
            'approval_policy = "never"\n' + raw,
            'sandbox_mode = "danger-full-access"\n' + raw,
            raw + '\n[mcp_servers.external]\nurl = "https://untrusted.example"\n',
            raw + '\n[agents.emily]\napproval_policy = "never"\n',
            raw.replace('max_concurrent_threads_per_session = 2',
                        'max_concurrent_threads_per_session = 100'),
        )
        for source in attacks:
            with self.subTest(source=source[-100:]):
                self.assertFalse(safe_project_config(tomllib.loads(source)))

    def test_distinct_roles_have_required_schema(self):
        self.assertEqual(set(self.roles), {"emily", "leo"})
        for name, agent in self.roles.items():
            with self.subTest(name=name):
                self.assertEqual(agent["name"], name)
                self.assertGreater(len(agent["description"]), 30)
                self.assertGreater(len(agent["developer_instructions"]), 100)
                self.assertNotIn("approval_policy", agent)
                self.assertNotIn("sandbox_mode", agent)
                self.assertNotIn("mcp_servers", agent)

    def test_canonical_sources_exist(self):
        for filename in (
            "docs/agentes/EMILY.md", "docs/agentes/LEO.md",
            "docs/decisions/MCF-DEC-017-DELEGACAO-DE-GATES-INTERNOS-AO-AGENTE-LEO.md",
            "docs/decisions/MCF-DEC-050-QUATRO-AGENTES-DE-CONTROLE-E-PADRAO-OPERACIONAL-UNIFICADO.md",
            "docs/protocols/MCF-MECANISMO-A-SUBAGENTES-NATIVOS.md",
        ):
            with self.subTest(file=filename):
                self.assertTrue((ROOT / filename).is_file())

    def test_emily_honors_independence_and_technical_verdict(self):
        text = self.roles["emily"]["developer_instructions"]
        for token in ("docs/agentes/EMILY.md", "SOMENTE LEITURA",
                      "PASS_WITH_RESERVATIONS", "formal_gate=PENDING",
                      "NAO SIMULAR AUTENTICACAO", "handoff_to=LEO"):
            with self.subTest(token=token):
                self.assertIn(token, text)

    def test_leo_honors_delegation_and_boundaries(self):
        text = self.roles["leo"]["developer_instructions"]
        for token in ("docs/agentes/LEO.md", "MCF-DEC-017",
                      "LEANDRO", "HDF/PermissionEngine", "gate_formal=PENDING",
                      "RETORNAR_PARA_CORRECAO", "handoff_to=MESTRE"):
            with self.subTest(token=token):
                self.assertIn(token, text)

    def test_profiles_do_not_force_models_or_perms(self):
        for name, agent in self.roles.items():
            with self.subTest(name=name):
                self.assertNotIn("model", agent)
                self.assertNotIn("model_reasoning_effort", agent)
                self.assertNotIn("mcp_servers", agent)
                self.assertNotIn("features", agent)

    def test_root_discovery_is_present(self):
        root = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        self.assertIn(".codex/agents/emily.toml", root)
        self.assertIn(".codex/agents/leo.toml", root)
        self.assertIn("docs/operations/MCF-CODEX-CANONICAL-EMILY-LEO.md", root)

    def test_runbook_separates_native_and_codex_roles(self):
        doc = (ROOT / "docs/operations/MCF-CODEX-CANONICAL-EMILY-LEO.md").read_text(encoding="utf-8")
        for token in ("MCF-MECANISMO-A-SUBAGENTES-NATIVOS.md", "codex_thread_id",
                      "AGUARDANDO_EXECUTOR_NATIVO", "formal_mcf_gate: PENDING",
                      "F0.8", "F4.6"):
            with self.subTest(token=token):
                self.assertIn(token, doc)

    def test_external_codex_runner_preserves_gate_and_role_distinction(self):
        src=(ROOT / "ops/codex/run_role.py").read_text(encoding="utf-8")
        for token in ("CODEX_EXTERNAL_ROLE_SESSION", "formal_mcf_gate",
                      '"PENDING"', "mcf_authenticated_agent_session",
                      "read-only", "target_sha", "prior_emily_thread_id"):
            with self.subTest(token=token):
                self.assertIn(token, src)

    def test_external_role_dry_run_and_missing_emily_receipt(self):
        sha=subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"],
                           capture_output=True, text=True, check=True).stdout.strip()
        cmd=[sys.executable, str(ROOT / "ops/codex/run_role.py"),
             "--mission-id", "MCF-CANONICAL-AGENTS", "--phase-id", "F3",
             "--target-sha", sha]
        emily=subprocess.run(cmd+["--role", "emily"], capture_output=True, text=True)
        self.assertEqual(emily.returncode, 0, emily.stderr)
        import json
        payload=json.loads(emily.stdout)
        self.assertEqual(payload["mode"], "dry_run")
        self.assertEqual(payload["formal_mcf_gate"], "PENDING")
        leo=subprocess.run(cmd+["--role", "leo"], capture_output=True, text=True)
        self.assertNotEqual(leo.returncode, 0)
        self.assertIn("recibo real de Emily", leo.stderr)

    def test_signed_receipt_checks_mission_phase_and_log_provenance(self):
        src=runpy.run_path(str(ROOT / "ops/codex/run_role.py"))
        sha=subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"],
                           capture_output=True, text=True, check=True).stdout.strip()
        thread="11111111-1111-4111-8111-111111111111"
        with tempfile.TemporaryDirectory(prefix="mcf-codex-test-") as td:
            folder=pathlib.Path(td)
            log=folder / "codex-emily.jsonl"
            final="CODEX_EMILY_TECHNICAL_REVIEW target_sha: "+sha
            lines=[
                {"type":"thread.started","thread_id":thread},
                {"type":"item.completed","item":{"type":"agent_message","text":final}},
                {"type":"turn.completed"}
            ]
            log.write_text("".join(json.dumps(x)+"\n" for x in lines))
            log.chmod(0o600)
            prior={
                "schema":"mcf-codex-external-role-receipt/v1",
                "agent_name":"emily",
                "execution_surface":"CODEX_EXTERNAL_ROLE_SESSION",
                "mission_id":"MCF-CANONICAL-AGENTS",
                "phase_id":"F3",
                "target_sha":sha,
                "status":"completed",
                "turn_completed":True,
                "formal_mcf_gate":"PENDING",
                "mcf_authenticated_agent_session":False,
                "codex_thread_id":thread,
                "raw_local_log":str(log),
                "raw_log_sha256":hashlib.sha256(log.read_bytes()).hexdigest(),
                "last_message":final,
            }
            key=src["signing_key"](folder,True)
            prior["local_hmac_sha256"]=src["receipt_mac"](prior,key)
            rp=folder / "receipt.json"
            rp.write_text(json.dumps(prior))
            rp.chmod(0o600)
            args=SimpleNamespace(receipt_dir=folder,emily_receipt=rp,
                                 mission_id="MCF-CANONICAL-AGENTS",phase_id="F3",target_sha=sha)
            src["verify_emily_receipt"](prior,args)
            tampered=dict(prior,mission_id="ANOTHER-MISSION")
            with self.assertRaisesRegex(ValueError,"assinatura"):
                src["verify_emily_receipt"](tampered,args)
            prior["mission_id"]="ANOTHER-MISSION"
            prior["local_hmac_sha256"]=src["receipt_mac"](prior,key)
            with self.assertRaisesRegex(ValueError,"missao/fase"):
                src["verify_emily_receipt"](prior,args)
            prior["mission_id"]=args.mission_id
            prior["local_hmac_sha256"]=src["receipt_mac"](prior,key)
            log.write_text(log.read_text()+"\n")
            with self.assertRaisesRegex(ValueError,"integridade"):
                src["verify_emily_receipt"](prior,args)

    def test_dirty_checkout_and_empty_verdict_fail_closed(self):
        src=runpy.run_path(str(ROOT / "ops/codex/run_role.py"))
        sha="f"*40
        responses=(SimpleNamespace(stdout=sha+"\n"),SimpleNamespace(stdout=" M AGENTS.md\n"))
        with patch("subprocess.run",side_effect=responses):
            with self.assertRaisesRegex(ValueError,"sujo"):
                src["assert_checkout"](sha)
        with tempfile.TemporaryDirectory(prefix="mcf-codex-events-") as td:
            log=pathlib.Path(td)/"log.jsonl"
            log.write_text(json.dumps({"type":"thread.started","thread_id":"abcd"})+"\n"+
                           json.dumps({"type":"turn.completed"})+"\n")
            thread,finished,final=src["parse_events"](log)
            self.assertEqual(thread,"abcd")
            self.assertTrue(finished)
            self.assertFalse(src["eligible_deliverable"]("emily",sha,final))

    def test_ci_follows_project_changes(self):
        wf = (ROOT / ".github/workflows/mcf-codex-agent-profiles.yml").read_text(encoding="utf-8")
        self.assertIn("ops/codex/validate_canonical_agents.py", wf)
        self.assertIn("contents: read", wf)
        self.assertIn("pull_request:", wf)

if __name__ == "__main__":
    unittest.main(verbosity=2)
