#!/usr/bin/env python3
import argparse
import json
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

EXPECTED_PROTOTYPE_REVISION="git:mission/mcf-world-projection-001@34c68563907027b166543b9e7d296fd61a0094bd"
EXPECTED_FIXTURE_REVISION="fixture:world-projection-semantic-visual-s:v1"

class Handler(SimpleHTTPRequestHandler):
    result_path=None
    def do_POST(self):
        if self.path!="/result":
            self.send_error(404)
            return
        try:
            n=int(self.headers.get("Content-Length","0"))
            raw=self.rfile.read(n)
            data=json.loads(raw.decode("utf-8"))
            if data.get("schema")!="mcf-world-semantic-discrimination/v1":
                raise ValueError("unexpected schema")
            if data.get("fixtureId")!="S":
                raise ValueError("unexpected fixture")
            if data.get("prototypeRevision")!=EXPECTED_PROTOTYPE_REVISION:
                raise ValueError("unexpected prototype revision")
            if data.get("fixtureRevision")!=EXPECTED_FIXTURE_REVISION:
                raise ValueError("unexpected fixture revision")
            if data.get("total")!=6 or len(data.get("results",[]))!=6:
                raise ValueError("incomplete result")
            if [x.get("task") for x in data.get("results",[])]!=[1,2,3,4,5,6]:
                raise ValueError("unexpected task set")
            tmp=self.result_path.with_name(self.result_path.name+".tmp")
            tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+chr(10),encoding="utf-8")
            tmp.replace(self.result_path)
            self.send_response(204)
            self.end_headers()
        except Exception as exc:
            body=str(exc).encode()
            self.send_response(400)
            self.send_header("Content-Type","text/plain; charset=utf-8")
            self.send_header("Content-Length",str(len(body)))
            self.end_headers()
            self.wfile.write(body)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--directory",required=True)
    ap.add_argument("--result-file",required=True)
    ap.add_argument("--port",type=int,default=4177)
    args=ap.parse_args()
    root=Path(args.directory).resolve()
    result=Path(args.result_file).resolve()
    Handler.result_path=result
    import os
    os.chdir(root)
    server=ThreadingHTTPServer(("127.0.0.1",args.port),Handler)
    print("serving",root,"on",args.port,"result",result,flush=True)
    server.serve_forever()

if __name__=="__main__":
    main()
