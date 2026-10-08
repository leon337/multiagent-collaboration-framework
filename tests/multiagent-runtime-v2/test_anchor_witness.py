import unittest

from anchor_witness import WitnessError, build_witness, verify_witness


class AnchorWitnessTests(unittest.TestCase):
    def setUp(self):
        self.anchor = {
            "schema": "mcf_journal_anchor/v1",
            "anchor_id": "anchor-1",
            "authority_id": "LEANDRO",
            "mission_id": "M",
            "event_count": 10,
            "journal_chain_head": "a" * 64,
            "snapshot_sha256": "b" * 64,
            "hmac_sha256": "c" * 64,
        }

    def test_public_witness_validates_digest_and_scope(self):
        witness = build_witness(
            self.anchor,
            provider="github",
            publication_id="issue-238-comment-1",
            publication_uri="https://github.com/leon337/multiagent-collaboration-framework/issues/238#issuecomment-1",
            published_at="2026-09-18T17:10:00-03:00",
            commit_sha="d" * 40,
        )
        result = verify_witness(self.anchor, witness)
        self.assertTrue(result["ok"])
        self.assertFalse(result["immutable_claimed"])
        self.assertEqual(result["witness_strength"], "public_timestamped_reference")

    def test_tampered_anchor_rejected(self):
        witness = build_witness(
            self.anchor,
            provider="github",
            publication_id="p1",
            publication_uri="https://github.com/example/repo/issues/1#issuecomment-1",
            published_at="2026-09-18T17:10:00-03:00",
        )
        tampered = dict(self.anchor)
        tampered["journal_chain_head"] = "0" * 64
        with self.assertRaises(WitnessError):
            verify_witness(tampered, witness)

    def test_cross_mission_witness_rejected(self):
        witness = build_witness(
            self.anchor,
            provider="github",
            publication_id="p1",
            publication_uri="https://github.com/example/repo/issues/1#issuecomment-1",
            published_at="2026-09-18T17:10:00-03:00",
        )
        other = dict(self.anchor)
        other["mission_id"] = "OTHER"
        with self.assertRaises(WitnessError):
            verify_witness(other, witness)

    def test_invalid_uri_rejected(self):
        with self.assertRaises(WitnessError):
            build_witness(
                self.anchor,
                provider="github",
                publication_id="p1",
                publication_uri="not-a-url",
                published_at="2026-09-18T17:10:00-03:00",
            )

    def test_generic_layer_refuses_immutable_claim(self):
        with self.assertRaises(WitnessError):
            build_witness(
                self.anchor,
                provider="github",
                publication_id="p1",
                publication_uri="https://github.com/example/repo/issues/1",
                published_at="2026-09-18T17:10:00-03:00",
                immutable_claimed=True,
            )


if __name__ == "__main__":
    unittest.main()
