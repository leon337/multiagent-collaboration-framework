import ast
import importlib.util
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("pet_installer",ROOT/"install_local.py")
installer=importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)

class InstallerTests(unittest.TestCase):
    def test_frontend_has_explicit_user_gesture(self):
        source=(ROOT/"frontend/pet-live.js").read_text()
        self.assertIn('start.addEventListener("click",begin)',source)
        self.assertIn('document.addEventListener("visibilitychange"',source)
        self.assertIn('stream?.getTracks().forEach(track=>track.stop())',source)
        self.assertIn('MAX', (ROOT/"backend/pet_live_gateway.py").read_text())

    def test_code_contains_no_tool_exposure(self):
        path=ROOT/"backend/pet_live_gateway.py"
        tree=ast.parse(path.read_text())
        calls=[n for n in ast.walk(tree) if isinstance(n,ast.Call)]
        self.assertFalse(any(
            isinstance(n.func,ast.Name) and n.func.id in ("eval","exec")
            for n in calls
        ))
        source=path.read_text()
        self.assertNotIn('"tools":[',source)
        self.assertNotIn('"tools": [',source)
        self.assertIn('if tool_request:',source)
        self.assertIn('if scope not in ("read_only","read_and_propose"):',source)
        self.assertIn('name not in TOOL_NAMES:',source)
        self.assertIn('run_read_tool,name,args',source)
        self.assertIn('execution_tools":False',source.replace(" ",""))

    def test_agent_patch_is_idempotent(self):
        origin='from live_bridge import router as live_router\napp.include_router(live_router)\n'
        once=installer.patch_agent(origin)
        self.assertEqual(installer.patch_agent(once),once)
        self.assertEqual(once.count(installer.APP_IMPORT),1)

    def test_classic_ui_handoff_is_idempotent(self):
        raw='(() => {\n  let csrf = "";\n})();\n'
        once=installer.patch_classic(raw)
        self.assertIn("McfPetAuth",once)
        self.assertEqual(installer.patch_classic(once),once)

    def test_protected_ticket_requires_csrf(self):
        patched=installer.patch_hub('''import pet_conversation as pet_voice
ASSETS = {
    "/pet-conversation.js": ("pet-conversation.js", "text/javascript; charset=utf-8"),
}
# connect-src 'self';
    def do_POST(self):
        path = urlparse(self.path).path
''')
        self.assertIn('pet_voice.authorize(self.headers)',patched)
        self.assertIn('"/api/pet-voice/live-ticket"',patched)
        self.assertIn('pet_ticket.ticket_response()',patched)
        self.assertEqual(installer.patch_hub(patched),patched)

    def test_index_patch_adds_live_controls_once(self):
        source='''<link rel="stylesheet" href="/pet-conversation.css">
<script src="/pet-conversation.js" defer></script>
    <section class="pet-talk-zone" id="petTalkZone"></section>'''
        once=installer.patch_index(source)
        self.assertIn('id="petLiveStart"',once)
        self.assertIn('id="petLiveStop"',once)
        self.assertIn('id="petLiveTranscript"',once)
        self.assertIn('id="petLiveAllowProposals"',once)
        self.assertIn('id="petProposalZone"',once)
        self.assertIn('id="petLiveBackgroundAudio"',once)
        self.assertIn('id="petLiveBackgroundStatus"',once)
        self.assertIn('/pet-proposals.js',once)
        self.assertEqual(once.count('id="petProposalZone"'),1)
        self.assertEqual(installer.patch_index(once),once)

    def test_proposal_routes_are_scope_bound_and_idempotent(self):
        origin='''import pet_live_ticket as pet_ticket
ASSETS = {
    "/pet-live.js": ("pet-live.js", "text/javascript; charset=utf-8"),
}
class Fake:
    def do_POST(self):
        path = urlparse(self.path).path
        if path not in pet_voice.POST_PATHS:
            pass
'''
        patched=installer.patch_proposal_routes(origin)
        self.assertIn('import pet_proposals as pet_drafts',patched)
        self.assertIn('pet_voice.authorize(self.headers)',patched)
        self.assertIn('/api/pet-voice/proposals/review',patched)
        self.assertNotIn('approve_execution',patched)
        self.assertEqual(installer.patch_proposal_routes(patched),patched)

    def test_scoped_write_exposes_dry_run_only(self):
        source='''import pet_mission_bridge as pet_missions
class Fake:
    def do_POST(self):
        path = urlparse(self.path).path
        if path in {"/api/pet-voice/mission-bridge/status",
                    "/api/pet-voice/mission-bridge/export",
                    "/api/pet-voice/mission-bridge/list"}:
            pass
'''
        patched=installer.patch_scoped_write_preview(source)
        self.assertIn('pet_scope.dry_run(',patched)
        self.assertIn('pet_voice.authorize(self.headers)',patched)
        self.assertNotIn('pet_scope.create_note(',patched)
        self.assertNotIn('pet_scope.rollback_note(',patched)
        self.assertEqual(installer.patch_scoped_write_preview(patched),patched)

    def test_existing_mission_bridge_route_upgrades_without_duplicate_handler(self):
        old_source='''import pet_mission_bridge as pet_missions
class Fake:
    def do_POST(self):
        path = urlparse(self.path).path
        if path in {"/api/pet-voice/mission-bridge/status",
                    "/api/pet-voice/mission-bridge/export",
                    "/api/pet-voice/mission-bridge/list"}:
            response={"ok":True,"handoff":pet_missions.export_reviewed_proposal(
                        item["proposal_id"],item["expected_version"])}
'''
        current=installer.patch_mission_bridge_routes(old_source)
        self.assertIn("context_file=pet_missions.CONTEXT_FILE",current)
        self.assertEqual(current.count('if path in {"/api/pet-voice/mission-bridge/status",'),1)
        self.assertEqual(installer.patch_mission_bridge_routes(current),current)

    def test_mission_bridge_is_only_an_authenticated_draft_handoff(self):
        from unittest.mock import patch
        dummy='''import pet_proposals as pet_drafts
class Fake:
    def do_POST(self):
        path = urlparse(self.path).path
        if path in {"/api/pet-voice/proposals/list",
                    "/api/pet-voice/proposals/review"}:
            pass
'''
        patched=installer.patch_mission_bridge_routes(dummy)
        self.assertIn("import pet_mission_bridge as pet_missions",patched)
        self.assertIn("/api/pet-voice/mission-bridge/export",patched)
        self.assertIn("pet_voice.authorize(self.headers)",patched)
        self.assertIn("pet_missions.export_reviewed_proposal",patched)
        self.assertNotIn("mission.execute",patched)
        self.assertEqual(installer.patch_mission_bridge_routes(patched),patched)

    def test_three_ticket_scopes_are_not_legacy_deployment_regression(self):
        old='if scope not in ("conversation","read_only"):'
        once=installer.patch_proposal_ticket_scope(old)
        self.assertIn('"read_and_propose"',once)
        self.assertEqual(installer.patch_proposal_ticket_scope(once),once)

if __name__=="__main__":
    unittest.main()
