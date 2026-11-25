#!/usr/bin/env python3
import json
import pathlib
import subprocess
import sys
import unittest
from unittest.mock import patch
sys.path.insert(0,str(pathlib.Path(__file__).parent))
import server
class TestMCFGitHubMCP(unittest.TestCase):
    def test_tool_list_has_only_reads(self):
        expected={"github_repo_info","github_main_head","github_read_file","github_open_issues","github_open_prs"}
        self.assertEqual({x["name"] for x in server.TOOLS},expected)
        self.assertTrue(all("write" not in x["name"] for x in server.TOOLS))
    def test_repo_scope(self):
        with patch.object(server,"api_get",return_value={"full_name":server.REPO,"private":False,"default_branch":"main"}):
            self.assertEqual(server.operate("github_repo_info",{}).get("repository"),server.REPO)
    def test_main_sha(self):
        with patch.object(server,"api_get",return_value={"object":{"sha":"abc123"}}):
            self.assertEqual(server.operate("github_main_head",{})["sha"],"abc123")
    def test_path_traversal_denied_without_network(self):
        with patch.object(server,"api_get") as api:
            for p in ("../../etc/passwd","/etc/passwd","src/../x","src\\other","."):
                with self.assertRaises(ValueError):server.operate("github_read_file",{"path":p})
            api.assert_not_called()
    def test_file_read(self):
        import base64
        with patch.object(server,"api_get",return_value={"type":"file","encoding":"base64","content":base64.b64encode(b"# MCF\n").decode(),"sha":"abc"}):
            self.assertEqual(server.operate("github_read_file",{"path":"AGENTS.md"})["text"],"# MCF\n")
    def test_latest_lists_use_descending_order(self):
        with patch.object(server,"api_get",return_value=[]) as api:
            server.operate("github_open_issues",{"limit":3})
            self.assertIn("direction=desc",api.call_args.args[0])
            server.operate("github_open_prs",{"limit":3})
            self.assertIn("direction=desc",api.call_args.args[0])
    def test_unknown_tools_denied(self):
        with self.assertRaises(ValueError):server.operate("github_write_file",{"path":"foo"})
    def test_stdio_handshake(self):
        inputs=[{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}},{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}},{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"github_write_file","arguments":{}}}]
        proc=subprocess.run([sys.executable,str(pathlib.Path(server.__file__))],input="".join(json.dumps(x)+"\n" for x in inputs),text=True,capture_output=True,timeout=10,check=True)
        rows=[json.loads(x) for x in proc.stdout.splitlines()]
        self.assertEqual(len(rows),3)
        self.assertEqual(rows[0]["result"]["serverInfo"]["name"],"mcf-github-readonly-3085")
        self.assertEqual(len(rows[1]["result"]["tools"]),5)
        self.assertTrue(rows[2]["result"]["isError"])
if __name__=="__main__":unittest.main()
