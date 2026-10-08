import unittest

from schema_migrations import (
    MigrationRegistry,
    SchemaDowngradeDenied,
    SchemaFamilyMismatch,
    SchemaMigrationError,
    SchemaMigrationPathMissing,
)


class SchemaMigrationTests(unittest.TestCase):
    def setUp(self):
        self.registry = MigrationRegistry()

    def test_same_version_is_noop_copy(self):
        source = {"x": {"nested": 1}}
        out = self.registry.migrate(source, "demo/v1", "demo/v1")
        self.assertEqual(out, source)
        self.assertIsNot(out, source)
        self.assertIsNot(out["x"], source["x"])

    def test_adjacent_upgrade(self):
        self.registry.register("demo/v1", "demo/v2", lambda d: {**d, "added": True})
        out = self.registry.migrate({"x": 1}, "demo/v1", "demo/v2")
        self.assertEqual(out, {"x": 1, "added": True})

    def test_multihop_upgrade_requires_every_hop(self):
        self.registry.register("demo/v1", "demo/v2", lambda d: {**d, "v2": True})
        self.registry.register("demo/v2", "demo/v3", lambda d: {**d, "v3": True})
        out = self.registry.migrate({"base": True}, "demo/v1", "demo/v3")
        self.assertTrue(out["v2"])
        self.assertTrue(out["v3"])

    def test_missing_hop_fails_closed(self):
        self.registry.register("demo/v1", "demo/v2", lambda d: d)
        with self.assertRaises(SchemaMigrationPathMissing):
            self.registry.migrate({}, "demo/v1", "demo/v3")

    def test_downgrade_denied(self):
        with self.assertRaises(SchemaDowngradeDenied):
            self.registry.migrate({}, "demo/v2", "demo/v1")

    def test_cross_family_denied(self):
        with self.assertRaises(SchemaFamilyMismatch):
            self.registry.migrate({}, "alpha/v1", "beta/v2")

    def test_registration_must_be_adjacent(self):
        with self.assertRaises(SchemaMigrationError):
            self.registry.register("demo/v1", "demo/v3", lambda d: d)

    def test_duplicate_source_hop_rejected(self):
        self.registry.register("demo/v1", "demo/v2", lambda d: d)
        with self.assertRaises(SchemaMigrationError):
            self.registry.register("demo/v1", "demo/v2", lambda d: d)

    def test_non_object_result_rejected(self):
        self.registry.register("demo/v1", "demo/v2", lambda d: ["bad"])
        with self.assertRaises(SchemaMigrationError):
            self.registry.migrate({}, "demo/v1", "demo/v2")


if __name__ == "__main__":
    unittest.main()
