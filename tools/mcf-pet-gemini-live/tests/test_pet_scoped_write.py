from __future__ import annotations
from datetime import datetime,timedelta,timezone
from pathlib import Path
import hashlib
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"backend"))
import pet_scoped_write as sw

MISSION="f03e8d10-1fd5-4b72-8c97-5fac77c0217b"
NOTE="health-report"
ACTION="action-20261116-001"

def verdict(mid,operation,resource,*,gate="APPROVED",allow=True,expire=False):
    return sw.AuthorizationVerdict(
        issuer="MCF_PERMISSION_ENGINE",
        approved=allow,
        mission_id=mid,
        action=operation,
        resource=resource,
        authorization_id="runtime-mcf-leo-approved-001",
        expires_at=sw._now()+timedelta(seconds=(-60 if expire else 100)),
        reversible_only=True,
        leo_gate=gate
    )

class ScopedWriteTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        root=Path(self.tmp.name)
        self.notes=root/"notes"
        self.receipts=root/"journal"/"receipts.sqlite3"
        self.content="Nota de teste reversível do MCF.\nSem acesso a outros serviços."
    def tearDown(self):
        self.tmp.cleanup()
    def allow(self,mid,operation,resource):
        return verdict(mid,operation,resource)
    def apply(self,content=None,action=ACTION,verifier=None):
        return sw.create_note(MISSION,NOTE,action,
            self.content if content is None else content,
            verifier=self.allow if verifier is None else verifier,
            notes_root=self.notes,db_path=self.receipts)

    def test_default_is_denied_without_canonical_permission_engine(self):
        with self.assertRaises(sw.ScopedWriteDenied) as e:
            sw.create_note(MISSION,NOTE,ACTION,self.content,
                           notes_root=self.notes,db_path=self.receipts)
        self.assertEqual(e.exception.code,"PERMISSION_ENGINE_NOT_CONNECTED")
        self.assertFalse(self.notes.exists())

    def test_dry_run_is_read_only_and_has_digest(self):
        p=sw.dry_run(MISSION,NOTE,ACTION,self.content)
        self.assertFalse(p["executed"])
        self.assertEqual(p["status"],"DRY_RUN_ONLY")
        self.assertIn("MCF_PERMISSION_ENGINE",p["requires"])
        self.assertFalse(self.notes.exists())

    def test_authorized_reversible_write_with_receipt(self):
        r=self.apply()
        self.assertEqual(r["status"],"APPLIED")
        self.assertFalse(r["idempotent"])
        note=self.notes/MISSION/(NOTE+".md")
        self.assertEqual(note.read_text(),self.content)
        self.assertEqual(note.stat().st_mode & 0o777,0o600)
        self.assertEqual(self.receipts.stat().st_mode & 0o777,0o600)
        self.assertEqual(r["content_sha256"],hashlib.sha256(self.content.encode()).hexdigest())

    def test_write_is_idempotent(self):
        first=self.apply()
        again=self.apply()
        self.assertEqual(first["receipt_id"],again["receipt_id"])
        self.assertTrue(again["idempotent"])

    def test_reuse_action_for_different_content_blocked(self):
        self.apply()
        with self.assertRaises(sw.ScopedWriteDenied) as e:
            self.apply("Conteúdo inesperado com mesmo ID")
        self.assertEqual(e.exception.code,"IDEMPOTENCY_CONFLICT")

    def test_protect_other_paths_and_symlinks(self):
        for mission,note,action in (
            ("../../../",NOTE,ACTION),
            (MISSION,"../../../",ACTION),
            (MISSION,"foo/bar",ACTION),
            (MISSION,NOTE,"bad"),
            ("LEANDRO",NOTE,ACTION),
        ):
            with self.subTest(mission=mission,note=note,action=action):
                with self.assertRaises(sw.ScopedWriteDenied):
                    sw.dry_run(mission,note,action,self.content)
        self.notes.mkdir(mode=0o700)
        (self.notes/MISSION).symlink_to(Path(self.tmp.name))
        with self.assertRaises(sw.ScopedWriteDenied):
            self.apply()

    def test_create_fails_closed_after_parent_directory_swap(self):
        outside=Path(self.tmp.name)/"outside-target"
        outside.mkdir(mode=0o700)
        original=sw._mode_private
        switched=[False]
        def replace_directory(path,mode=0o700):
            original(path,mode)
            if path==self.notes/MISSION and not switched[0]:
                switched[0]=True
                path.rename(self.notes/(MISSION+"-preserved"))
                path.symlink_to(outside,target_is_directory=True)
        with patch.object(sw,"_mode_private",side_effect=replace_directory):
            with self.assertRaises(sw.ScopedWriteDenied):
                self.apply()
        self.assertTrue(switched[0])
        self.assertFalse((outside/(NOTE+".md")).exists())

    def test_denied_gate_expired_or_wrong_scope(self):
        for kwargs in ({"gate":"PENDING"},{"allow":False},{"expire":True}):
            def fake(mid,operation,resource,parameters=kwargs):
                return verdict(mid,operation,resource,**parameters)
            with self.subTest(kwargs=kwargs),self.assertRaises(sw.ScopedWriteDenied):
                self.apply(verifier=fake)
        def wrong(mid,op,res):return verdict(mid,op,"wrong-resource")
        with self.assertRaises(sw.ScopedWriteDenied):
            self.apply(verifier=wrong)

    def test_rollback_only_matching_digest_and_authorized_scope(self):
        created=self.apply()
        note=self.notes/MISSION/(NOTE+".md")
        first=sw.rollback_note(MISSION,created["receipt_id"],
            verifier=self.allow,notes_root=self.notes,db_path=self.receipts)
        self.assertEqual(first["status"],"ROLLED_BACK")
        self.assertFalse(first["idempotent"])
        self.assertFalse(note.exists())
        again=sw.rollback_note(MISSION,created["receipt_id"],
            verifier=self.allow,notes_root=self.notes,db_path=self.receipts)
        self.assertTrue(again["idempotent"])

    def test_shared_default_layout_bootstraps_private_root_under_umask_022(self):
        from unittest.mock import patch
        import stat
        root=Path(self.tmp.name)/"state"/"pet-scoped"
        note_root=root/"notes"
        db=root/"receipts.sqlite3"
        # Force a common user umask that used to create shared ROOT 0755.
        previous=os.umask(0o022)
        try:
            with (patch.object(sw,"ROOT",root),
                  patch.object(sw,"NOTES",note_root),
                  patch.object(sw,"JOURNAL",db)):
                record=sw.create_note(MISSION,NOTE,ACTION,self.content,
                    verifier=self.allow,notes_root=note_root,db_path=db)
                self.assertEqual(record["status"],"APPLIED")
                self.assertEqual(stat.S_IMODE(root.stat().st_mode),0o700)
                self.assertEqual(stat.S_IMODE(note_root.stat().st_mode),0o700)
                self.assertEqual(stat.S_IMODE(db.stat().st_mode),0o600)
                result=sw.rollback_note(MISSION,record["receipt_id"],
                    verifier=self.allow,notes_root=note_root,db_path=db)
                self.assertEqual(result["status"],"ROLLED_BACK")
        finally:
            os.umask(previous)

    def test_mission_directory_symlink_cannot_redirect_rollback(self):
        record=self.apply()
        directory=self.notes/MISSION
        saved=self.notes/(MISSION+"-original")
        directory.rename(saved)
        outside=Path(self.tmp.name)/"elsewhere"
        outside.mkdir(mode=0o700)
        target=outside/(NOTE+".md")
        target.write_text(self.content)
        target.chmod(0o600)
        directory.symlink_to(outside,target_is_directory=True)
        with self.assertRaises(sw.ScopedWriteDenied) as result:
            sw.rollback_note(MISSION,record["receipt_id"],
                verifier=self.allow,notes_root=self.notes,db_path=self.receipts)
        self.assertIn(result.exception.code,
            ("UNSAFE_STORAGE_DIRECTORY","UNSAFE_WORKSPACE_DIRECTORY"))
        self.assertEqual(target.read_text(),self.content)
        self.assertTrue((saved/(NOTE+".md")).is_file())

    def test_rollback_detects_outside_modification(self):
        created=self.apply()
        note=self.notes/MISSION/(NOTE+".md")
        note.write_text("Alterado por outro processo")
        with self.assertRaises(sw.ScopedWriteDenied) as e:
            sw.rollback_note(MISSION,created["receipt_id"],
                verifier=self.allow,notes_root=self.notes,db_path=self.receipts)
        self.assertEqual(e.exception.code,"ROLLBACK_HASH_MISMATCH")
        self.assertTrue(note.exists())

    def test_broken_receipt_write_does_not_leave_an_orphan_file(self):
        # Monkeypatch sqlite cursor behavior after file creation.
        import sqlite3
        target="INSERT INTO receipts"
        real_connect=sw.sqlite3.connect
        class DBProxy:
            def __init__(self,db):self.db=db
            def execute(self,query,*args,**kwargs):
                if target in query:
                    raise sqlite3.OperationalError("simulated disk failure")
                return self.db.execute(query,*args,**kwargs)
            def __getattr__(self,name):return getattr(self.db,name)
        def connect(*args,**kwargs):return DBProxy(real_connect(*args,**kwargs))
        with patch.object(sw.sqlite3,"connect",side_effect=connect):
            with self.assertRaises(sw.ScopedWriteDenied):
                self.apply()
        self.assertFalse((self.notes/MISSION/(NOTE+".md")).exists())

    def test_rollback_uses_tombstone_before_recording_success(self):
        created=self.apply()
        note=self.notes/MISSION/(NOTE+".md")
        result=sw.rollback_note(MISSION,created["receipt_id"],
          verifier=self.allow,notes_root=self.notes,db_path=self.receipts)
        self.assertEqual(result["status"],"ROLLED_BACK")
        self.assertFalse(note.exists())
        self.assertEqual(list(note.parent.glob(".rollback-*.pending")),[])

    def test_rollback_denied_without_new_permission(self):
        created=self.apply()
        note=self.notes/MISSION/(NOTE+".md")
        with self.assertRaises(sw.ScopedWriteDenied):
            sw.rollback_note(MISSION,created["receipt_id"],
                notes_root=self.notes,db_path=self.receipts)
        self.assertTrue(note.exists())

    def test_read_browser_tabs_only_with_verified_scope_and_adapter(self):
        with self.assertRaises(sw.ScopedWriteDenied) as e:
            sw.browser_tabs_read(mission_id=MISSION)
        self.assertEqual(e.exception.code,"PERMISSION_ENGINE_NOT_CONNECTED")
        with self.assertRaises(sw.ScopedWriteDenied) as e:
            sw.browser_tabs_read(mission_id=MISSION,verifier=self.allow)
        self.assertEqual(e.exception.code,"BROWSER_ADAPTER_NOT_CONNECTED")
        calls=[]
        def adapter(name,args):
            calls.append((name,args))
            return {"ok":True,"observation":"Aba local de teste"}
        result=sw.browser_tabs_read(mission_id=MISSION,verifier=self.allow,adapter=adapter)
        self.assertEqual(result["source"],"MESTRE_PLAYWRIGHT_MCP")
        self.assertFalse(result["write_performed"])
        self.assertEqual(calls,[("browser_tabs",{"arguments_json":'{"action":"list"}'})])

    def test_untrusted_model_dict_is_not_permission_verdict(self):
        def malicious(*args):
            return {"issuer":"MCF_PERMISSION_ENGINE","approved":True,"leo_gate":"APPROVED"}
        with self.assertRaises(sw.ScopedWriteDenied) as e:
            self.apply(verifier=malicious)
        self.assertEqual(e.exception.code,"INVALID_PERMISSION_VERDICT")

if __name__=="__main__":
    unittest.main()
