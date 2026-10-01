import unittest

from receipt_schema import ReceiptError, make_receipt, validate_receipt


class ReceiptSchemaTests(unittest.TestCase):
    def test_pass_receipt_requires_evidence_and_validates(self):
        receipt = make_receipt(
            mission_id="M",
            task_id="t",
            execution_id="e",
            actor_id="a",
            status="PASS",
            result={"ok": 1},
            evidence_refs=["artifact://x"],
            created_at=1,
            receipt_id="r",
        )
        self.assertEqual(validate_receipt(receipt).status, "PASS")

    def test_tamper_rejected(self):
        receipt = make_receipt(
            mission_id="M",
            task_id="t",
            execution_id="e",
            actor_id="a",
            status="PASS",
            evidence_refs=["artifact://x"],
            created_at=1,
            receipt_id="r",
        )
        tampered = receipt.__dict__.copy()
        tampered["actor_id"] = "mallory"
        with self.assertRaises(ReceiptError):
            validate_receipt(tampered)

    def test_false_green_without_evidence_rejected(self):
        with self.assertRaises(ReceiptError):
            make_receipt(
                mission_id="M",
                task_id="t",
                execution_id="e",
                actor_id="a",
                status="PASS",
            )


if __name__ == "__main__":
    unittest.main()
