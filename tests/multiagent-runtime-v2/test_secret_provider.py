import os
import unittest
from unittest.mock import patch

from capability_tokens import CapabilityDenied
from secret_provider import (
    EnvSecretProvider,
    SecretBroker,
    SecretNotFound,
    SecretRef,
    SecretRevoked,
)
from security_guard import SecretPolicy


class SecretProviderTests(unittest.TestCase):
    def setUp(self):
        os.environ["MCF_TEST_SECRET"] = "super-secret-value"
        self.addCleanup(os.environ.pop, "MCF_TEST_SECRET", None)
        self.provider = EnvSecretProvider({"NVIDIA_API_KEY": "MCF_TEST_SECRET"})
        self.broker = SecretBroker(
            SecretPolicy({"NVIDIA_API_KEY"}),
            {"env": self.provider},
        )

    def test_allowed_reference_is_ephemeral_and_zeroized(self):
        lease = self.broker.acquire("env", SecretRef("NVIDIA_API_KEY"))
        self.assertEqual(lease.reveal_text(), "super-secret-value")
        raw = lease._buffer
        lease.close()
        self.assertTrue(lease.closed)
        self.assertTrue(all(value == 0 for value in raw))
        with self.assertRaises(SecretRevoked):
            lease.reveal_text()

    def test_policy_denies_unlisted_secret(self):
        with self.assertRaises(CapabilityDenied):
            self.broker.acquire("env", SecretRef("OPENAI_API_KEY"))

    def test_provider_never_allows_arbitrary_environment_lookup(self):
        os.environ["UNMAPPED_SECRET"] = "should-not-be-readable"
        self.addCleanup(os.environ.pop, "UNMAPPED_SECRET", None)
        with self.assertRaises(CapabilityDenied):
            self.broker.acquire("env", SecretRef("UNMAPPED_SECRET"))

    def test_missing_mapped_environment_value_fails_closed(self):
        provider = EnvSecretProvider({"NVIDIA_API_KEY": "MISSING_ENV"})
        broker = SecretBroker(
            SecretPolicy({"NVIDIA_API_KEY"}),
            {"env": provider},
        )
        with self.assertRaises(SecretNotFound):
            broker.acquire("env", SecretRef("NVIDIA_API_KEY"))

    def test_revoke_blocks_future_acquire(self):
        ref = SecretRef("NVIDIA_API_KEY")
        self.broker.revoke("env", ref)
        with self.assertRaises(SecretRevoked):
            self.broker.acquire("env", ref)

    def test_metadata_never_contains_secret_value(self):
        lease = self.broker.acquire("env", SecretRef("NVIDIA_API_KEY", "v1"))
        metadata = self.broker.audit_metadata(lease)
        serialized = str(metadata)
        self.assertNotIn("super-secret-value", serialized)
        self.assertFalse(metadata["value_persisted"])
        self.assertEqual(metadata["secret"]["name"], "NVIDIA_API_KEY")

    def test_ttl_expiry_revokes_lease(self):
        with patch("secret_provider.time.time", return_value=100.0):
            lease = self.broker.acquire(
                "env",
                SecretRef("NVIDIA_API_KEY"),
                ttl_seconds=5,
            )
        with patch("secret_provider.time.time", return_value=106.0):
            with self.assertRaises(SecretRevoked):
                lease.reveal_text()
        self.assertTrue(lease.closed)


if __name__ == "__main__":
    unittest.main()
