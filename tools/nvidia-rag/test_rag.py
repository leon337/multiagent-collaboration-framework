import json, os, pathlib, sqlite3, tempfile, unittest
from unittest.mock import patch
import rag
class TestRAG(unittest.TestCase):
    def test_cosine(self):
        self.assertAlmostEqual(rag.cosine([1,0],[1,0]),1)
        self.assertAlmostEqual(rag.cosine([1,0],[0,1]),0)
        self.assertEqual(rag.cosine([1],[1,2]),-1)
    def test_chunking(self):
        self.assertEqual(rag.chunks("abcdef",2),["ab","cd","ef"])
    def test_model_allowlist(self):
        with self.assertRaises(ValueError):rag.embed(["x"],"key","unknown","query")
    def test_no_empty(self):
        with self.assertRaises(ValueError):rag.embed([],"key",next(iter(rag.MODELS)),"query")
    def test_key_permissions(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/"env";p.write_text("NVIDIA_API_KEY=placeholder\n");p.chmod(0o644)
            with self.assertRaises(RuntimeError):rag.load_key(p)
            p.chmod(0o600);self.assertEqual(rag.load_key(p),"placeholder")
    def test_scope_guard(self):
        with tempfile.TemporaryDirectory() as d:
            root=pathlib.Path(d)/"allowed";root.mkdir()
            outside=pathlib.Path(d)/"outside.md";outside.write_text("public text")
            with self.assertRaises(ValueError):rag.approved_source(outside,root)
            with self.assertRaises(ValueError):rag.approved_source(outside,None)
            inside=root/"inside.md";inside.write_text("public text")
            self.assertEqual(rag.approved_source(inside,root),inside)
    def test_index_search(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/"test.md";p.write_text("O MCF usa agentes e evidências.")
            db=rag.connect(":memory:");model="nvidia/nemotron-3-embed-1b"
            with patch.object(rag,"embed",side_effect=[[[1.0,0.0]],[[1.0,0.0]]]):
                self.assertEqual(rag.index_file(db,"fake",model,p,d),1)
                r=rag.search(db,"fake",model,"agentes",3)
            self.assertEqual(r[0]['score'],1.0)
            self.assertEqual(r[0]['source'],str(p))
if __name__=="__main__":unittest.main()
