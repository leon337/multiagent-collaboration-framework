#!/usr/bin/env python3
"""Validacao estatica dos perfis canonicos Emily e LEO para Codex.

Sem acesso a rede, credenciais ou necessidade de executar o modelo.
Nao representa invocacao real nem gate da missao.
"""
from __future__ import annotations
import pathlib
import subprocess
import sys
import tomllib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
AGENTS = ROOT / ".codex" / "agents"

class CanonicalCodexAgentsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = tomllib.loads((ROOT / ".codex" / "config.toml").read_text(encoding="utf-8"))
        cls.roles = {
            key: tomllib.loads((AGENTS / (key + ".toml")).read_text(encoding="utf-8"))
            for key in ("emily", "leo")
        }

    def test_multiagent_enabled_with_bounded_threads(self):
        cfg = self.config.get("agents", {})
        self.assertIs(cfg.get("enabled"), True)
        self.assertGreaterEqual(cfg.get("max_concurrent_threads_per_session", 0), 2)
        self.assertLessEqual(cfg.get("max_concurrent_threads_per_session", 0), 10)

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

    def test_ci_follows_project_changes(self):
        wf = (ROOT / ".github/workflows/mcf-codex-agent-profiles.yml").read_text(encoding="utf-8")
        self.assertIn("ops/codex/validate_canonical_agents.py", wf)
        self.assertIn("contents: read", wf)
        self.assertIn("pull_request:", wf)

if __name__ == "__main__":
    unittest.main(verbosity=2)
