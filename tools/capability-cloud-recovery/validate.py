#!/usr/bin/env python3
"""MCF Cloud Project Recovery: contract, discovery and governance validation.

Run: python3 tools/capability-cloud-recovery/validate.py
Requires PyYAML. Does not connect to GitHub, Drive or other private systems.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from datetime import datetime, timezone

import yaml

ROOT = Path(__file__).resolve().parents[2]
ID = "MCF-RECOVER-CLOUD-PROJECT"
CAPABILITY_ID = "mcf.cloud-project-recovery.v1"
SKILL_FILE = ROOT / "skills/cloud/MCF-RECOVER-CLOUD-PROJECT.yaml"
CAP_FILE = ROOT / "context/capabilities/cloud-project-recovery.yaml"
REGISTRY = ROOT / "skills/registry.yaml"
RUNBOOK = ROOT / "docs/operations/MCF-CLOUD-PROJECT-RECOVERY.md"
ENTRY = ROOT / "skills/cloud/mcf-project-recovery/SKILL.md"

class UniqueLoader(yaml.SafeLoader):
    pass

def unique_map(loader: UniqueLoader, node: yaml.MappingNode, deep: bool = False) -> dict:
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise ValueError(f"Duplicate YAML key: {key}")
        result[key] = loader.construct_object(value_node, deep=deep)
    return result

UniqueLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_map
)

def load(path: Path) -> dict:
    assert path.is_file() and path.stat().st_size > 0, f"Missing file: {path}"
    result = yaml.load(path.read_text(encoding="utf-8"), Loader=UniqueLoader)
    assert isinstance(result, dict), f"Invalid YAML document: {path}"
    return result

def contains(path: Path, value: str) -> bool:
    return value in path.read_text(encoding="utf-8")

def assert_list(values, label: str):
    assert isinstance(values, list) and values, f"{label} must be non-empty"
    assert all(isinstance(v, str) and v for v in values), f"{label} must be strings"

def run() -> None:
    registry = load(REGISTRY)
    definition = load(SKILL_FILE)["skill"]
    capability = load(CAP_FILE)

    assert registry["registry"]["status"] == "ACTIVE"
    assert registry["registry"]["authority_human"] == "Leandro"
    assert registry["registry"]["coordinator"] == "Mestre"

    skills = registry["skills"]
    assert len([s for s in skills if s["skill_id"] == ID]) == 1
    indexed = next(s for s in skills if s["skill_id"] == ID)

    assert definition["skill_id"] == indexed["skill_id"] == ID
    assert definition["version"] == indexed["version"] == "0.1.0"
    assert definition["status"] == indexed["status"] == "EXPERIMENTAL"
    assert definition["permission_profile"] == indexed["permission_profile"] == "SCOPED_WRITE"
    assert "Mestre" in definition["owner_agents"] and indexed["owner_agents"] == definition["owner_agents"]
    assert_list(definition["trigger_phrases"], "skill.trigger_phrases")
    assert_list(indexed["trigger_phrases"], "registry.trigger_phrases")
    assert set(indexed["trigger_phrases"]).issubset(set(definition["trigger_phrases"]))
    # Simula o discovery de uma sessão nova, partindo apenas da frase do usuário.
    requests = [
        "quero recuperar projeto em outro computador",
        "precisamos migrar projeto entre computadores",
        "vamos reconciliar backup GitHub Google Drive",
        "MESTRE, reconciliar projeto com estado local e remoto",
        "sincronizar projeto para outro computador",
    ]
    for utterance in requests:
        assert any(phrase.lower() in utterance.lower() for phrase in indexed["trigger_phrases"]), (
            f"Intent not discoverable: {utterance}"
        )

    assert definition["required_inputs"] == indexed["required_inputs"]
    for required in ("project_reference", "recovery_goal", "authorized_scope"):
        assert required in definition["required_inputs"]
    for important in (
        "oauth_consent_or_login",
        "restore_replacing_existing_data",
        "credential_rotation_or_recovery",
    ):
        assert important in definition["governance"]["human_gate_triggers"]
    assert definition["tests"]["verdict"] == "NOT_EVALUATED"
    assert_list(definition["required_evidence"], "skill.required_evidence")
    assert "without_any_tool" in definition["fallback"]

    assert capability["schema_version"] == 1
    assert capability["capability"]["id"] == CAPABILITY_ID
    assert capability["capability"]["provider_project_id"] == "estudio-binaural-3d"
    assert "multiagent-collaboration-framework" in capability["capability"]["consumer_project_ids"]
    assert capability["capability"]["mode"] in ("READ_ONLY", "BOUNDED_WRITE")
    assert capability["contract"]["protocol"] == "MCF_CLOUD_PROJECT_RECOVERY_RUNBOOK_V1"
    assert_list(capability["contract"]["allowed_operations"], "capability.allowed_operations")
    assert "recovery.replace_without_explicit_authorization" in capability["contract"]["prohibited_operations"]
    assert set(capability["scope"]["environments"]).issubset({"dev", "lab", "staging"})
    assert capability["governance"]["authorization_state"] == "NOT_AUTHORIZED"
    assert capability["governance"]["required_gate"]
    lifecycle = capability["lifecycle"]
    assert lifecycle == {
        "implementation_state": "DECLARED",
        "connection_state": "DISCONNECTED",
        "runtime_state": "BLOCKED",
        "verification_state": "NOT_VERIFIED",
        "last_verified_at": None,
    }, f"Unexpected claim of runtime implementation: {lifecycle}"
    assert capability["freshness"] == "LIVE_REQUIRED"
    for source in capability["evidence"]:
        assert source["source_ref"].startswith("repo://leon337/estudio-binaural-3d/")
        assert re.fullmatch(r"[0-9a-f]{40}", source["source_revision"])
        assert source["observed_at"]

    for file in (ROOT / "AGENTS.md", ROOT / "README.md",
                 ROOT / "skills/README.md", ROOT / "docs/tools/MCF-AVAILABLE-CAPABILITIES.md",
                 RUNBOOK, ENTRY):
        assert file.is_file(), f"Missing discovery entry: {file}"
        assert contains(file, ID), f"Skill not discoverable at {file}"
    for file in (ROOT / "AGENTS.md", RUNBOOK, ENTRY):
        assert contains(file, CAPABILITY_ID), f"Capability ID missing from {file}"

    for doc in (RUNBOOK, ENTRY):
        text = doc.read_text(encoding="utf-8")
        assert "HUMAN_GATE" in text and "OAuth" in text
        assert "state:pull" in text and "GitHub" in text
        assert "appDataFolder" in text
        assert "não" in text.lower()

    check = [SKILL_FILE, CAP_FILE, RUNBOOK, ENTRY,
             ROOT / "AGENTS.md", ROOT / "skills/README.md"]
    all_text = "\n".join(path.read_text(encoding="utf-8") for path in check)
    secret_patterns = [
        r"gh[opsu]_[A-Za-z0-9]{25,}", r"AIza[0-9A-Za-z_-]{25,}",
        r"GOCSPX-[A-Za-z0-9_-]{24,}",
        r"-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----",
        r"potiguaradm23@gmail\.com",
    ]
    for pattern in secret_patterns:
        assert not re.search(pattern, all_text), f"Potential secret or private identity in public contract: {pattern}"

    print("PASS: one skill registered + declarative capability schema v1")
    print("PASS: discoverable in AGENTS, registry, README, skill and runbook")
    print("PASS: gates, provider check, no runtime activation claims")
    print("PASS: public documentation contains no tested secret patterns")

if __name__ == "__main__":
    try:
        run()
    except (AssertionError, ValueError, yaml.YAMLError) as e:
        print("FAIL: " + str(e), file=sys.stderr)
        sys.exit(1)
