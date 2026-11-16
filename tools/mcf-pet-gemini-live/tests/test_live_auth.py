from __future__ import annotations
import importlib.util
from pathlib import Path
import stat
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("pet_live_auth",ROOT/"backend/pet_live_auth.py")
auth=importlib.util.module_from_spec(spec)
spec.loader.exec_module(auth)

class AuthTests(unittest.TestCase):
    def setUp(self):
        auth._seen.clear()
        self.tmp=tempfile.TemporaryDirectory()
        self.path=Path(self.tmp.name)/"key"
        self.path.write_bytes(b"0"*32)
        self.path.chmod(0o600)
    def tearDown(self):
        self.tmp.cleanup()

    def test_short_lived_valid_ticket_accepted_once(self):
        token=auth.issue_ticket(self.path,now=1731700000)
        self.assertTrue(auth.validate_ticket(token,self.path,now=1731700001))
        self.assertFalse(auth.validate_ticket(token,self.path,now=1731700002))

    def test_invalid_signature_expiry_and_future_ticket(self):
        tok=auth.issue_ticket(self.path,now=1731700000)
        self.assertFalse(auth.validate_ticket(tok[:-1]+"a" if tok[-1]!="a" else tok[:-1]+"b",
                                              self.path,now=1731700001))
        self.assertFalse(auth.validate_ticket(tok,self.path,now=1731700032))
        self.assertFalse(auth.validate_ticket(tok,self.path,now=1731699999))

    def test_owner_mode_unsafe_key_is_rejected(self):
        self.path.chmod(0o644)
        with self.assertRaises(ValueError):auth.issue_ticket(self.path,now=1731700000)
        self.path.chmod(0o600)
        self.path.write_bytes(b"123")
        with self.assertRaises(ValueError):auth.issue_ticket(self.path,now=1731700000)

    def test_symlink_is_rejected(self):
        alias=Path(self.tmp.name)/"link"
        alias.symlink_to(self.path)
        with self.assertRaises(OSError):auth.issue_ticket(alias,now=1731700000)

    def test_protocol_ticket_is_structurally_restricted(self):
        tok=auth.issue_ticket(self.path,now=1731700000)
        self.assertEqual(auth.subprotocol_ticket("mcf-pet-live, ticket."+tok),tok)
        for raw in ("mcf-pet-live","mcf-pet-live, other",
                    "mcf-pet-live,ticket."+tok+", third",
                    "ticket."+tok+",mcf-pet-live", "mcf-pet-live, ticket."+tok+"x"*400):
            self.assertIsNone(auth.subprotocol_ticket(raw))

    def test_random_ticket_not_expose_key(self):
        tok=auth.issue_ticket(self.path,now=1731700000)
        self.assertNotEqual(tok,auth.issue_ticket(self.path,now=1731700000))
        self.assertLess(len(tok),180)

if __name__=="__main__":unittest.main()
