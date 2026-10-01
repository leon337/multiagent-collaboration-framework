import unittest

from external_attestation import (
    AttestationError,
    build_attestation,
    build_publication_receipt,
    validate_attestation,
    validate_publication_receipt,
)


class ExternalAttestationTests(unittest.TestCase):
    def setUp(self):
        self.attestation = build_attestation(
            mission_id="M",
            authority_id="LEANDRO",
            source_commit="abcdef1234567890",
            artifact_sha256="a" * 64,
            assertions={"tests": "PASS", "human_gate": "PENDING"},
            created_at=100,
        )

    def test_attestation_validates(self):
        self.assertEqual(
            validate_attestation(self.attestation)["attestation_sha256"],
            self.attestation["attestation_sha256"],
        )

    def test_attestation_tamper_rejected(self):
        bad = dict(self.attestation)
        bad["authority_id"] = "MALLORY"
        with self.assertRaises(AttestationError):
            validate_attestation(bad)

    def test_publication_receipt_binds_provider_and_commit(self):
        receipt = build_publication_receipt(
            self.attestation,
            provider="github-issue-comment",
            remote_ref="https://github.com/leon337/multiagent-collaboration-framework/issues/238#issuecomment-1",
            published_at=101,
        )
        out = validate_publication_receipt(self.attestation, receipt)
        self.assertFalse(out["immutability_claimed"])
        self.assertEqual(out["source_commit"], "abcdef1234567890")

    def test_publication_for_different_attestation_rejected(self):
        receipt = build_publication_receipt(
            self.attestation,
            provider="github-issue-comment",
            remote_ref="https://github.com/leon337/multiagent-collaboration-framework/issues/238#issuecomment-1",
            published_at=101,
        )
        other = build_attestation(
            mission_id="M",
            authority_id="LEANDRO",
            source_commit="deadbeef",
            artifact_sha256="b" * 64,
            created_at=100,
        )
        with self.assertRaises(AttestationError):
            validate_publication_receipt(other, receipt)

    def test_mutable_provider_cannot_claim_immutability(self):
        receipt = build_publication_receipt(
            self.attestation,
            provider="github-issue-comment",
            remote_ref="https://github.com/leon337/multiagent-collaboration-framework/issues/238#issuecomment-1",
            published_at=101,
        )
        receipt["immutability_claimed"] = True
        with self.assertRaises(AttestationError):
            validate_publication_receipt(self.attestation, receipt)

    def test_non_hex_artifact_digest_rejected(self):
        with self.assertRaises(AttestationError):
            build_attestation(
                mission_id="M",
                authority_id="LEANDRO",
                source_commit="abcdef1",
                artifact_sha256="z" * 64,
            )

    def test_non_hex_commit_rejected(self):
        with self.assertRaises(AttestationError):
            build_attestation(
                mission_id="M",
                authority_id="LEANDRO",
                source_commit="not-a-commit",
                artifact_sha256="a" * 64,
            )

    def test_relative_publication_reference_rejected(self):
        with self.assertRaises(AttestationError):
            build_publication_receipt(
                self.attestation,
                provider="github-issue-comment",
                remote_ref="issue:238#comment:1",
                published_at=101,
            )


if __name__ == "__main__":
    unittest.main()
