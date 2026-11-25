#!/usr/bin/env python3
import json
import tempfile
from pathlib import Path
from context_consumer_v01 import render
from adapter_v01 import build, ROOT

mission=json.loads((ROOT/"context/missions/mcf-world-projection-001.json").read_text())
bundle=build(mission,"consumer-test-rev","2026-09-26T10:20:00Z","leon337/multiagent-collaboration-framework")
page=render(bundle)

assert "SAME MODEL / TWO REPRESENTATIONS" in page
assert bundle["contextSlice"]["scope"]["mission"]["canonicalRef"] in page
assert bundle["agentContextPacket"]["recipient"]["canonicalRef"] in page
assert bundle["agentContextPacket"]["authorityRef"] in page
assert "fetch(" not in page
assert "WebSocket" not in page
assert "XMLHttpRequest" not in page
assert "localStorage" not in page

print("CONTEXT_CONSUMER_V01_TEST PASS")
print("htmlBytes",len(page.encode()))
