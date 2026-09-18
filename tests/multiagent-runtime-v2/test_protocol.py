import unittest,protocol
class ProtocolTests(unittest.TestCase):
  def test_registry(self):
    self.assertEqual(protocol.RELEASE,'2.0.0-rc1');self.assertEqual(len(set(protocol.SCHEMAS.values())),len(protocol.SCHEMAS));self.assertTrue(all('/v' in x for x in protocol.SCHEMAS.values()))
  def test_boundary(self):self.assertEqual(protocol.SUPPORTED_EXECUTION_BOUNDARY,'CHATGPT_BUBBLE_LOCAL_SANDBOX')
