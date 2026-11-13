#!/usr/bin/env python3
"""MCF experimental read-only NVIDIA embeddings + local SQLite vector retrieval."""
import argparse, hashlib, json, math, os, pathlib, sqlite3, sys, urllib.error, urllib.request, stat

MODELS = {"nvidia/nemotron-3.5-embed-1b", "nvidia/nemotron-3.5-embed-8b", "nvidia/nemotron-3-embed-1b"}
API = "https://integrate.api.nvidia.com/v1/embeddings"

def load_key(path):
    p = pathlib.Path(path).expanduser()
    if not p.is_file() or p.stat().st_mode & 0o077:
        raise RuntimeError("Arquivo de credenciais ausente ou permissões inseguras; exija chmod 600")
    for line in p.read_text().splitlines():
        if line.startswith("NVIDIA_API_KEY="):
            key = line.split("=", 1)[1].strip().strip('"').strip("'")
            if key:
                return key
    raise RuntimeError("NVIDIA_API_KEY não configurada")

def embed(texts, key, model, input_type, endpoint=API):
    if model not in MODELS:
        raise ValueError("Modelo fora da allowlist")
    if input_type not in ("query", "passage"):
        raise ValueError("input_type inválido")
    if not texts or len(texts)>16 or any(not isinstance(t,str) or not t.strip() or len(t)>16000 for t in texts):
        raise ValueError("Entrada inválida")
    payload = json.dumps({"model":model,"input":texts,"input_type":input_type,"truncate":"END"}).encode()
    req=urllib.request.Request(endpoint,data=payload,headers={"Authorization":"Bearer "+key,"Content-Type":"application/json","Accept":"application/json"},method="POST")
    try:
        with urllib.request.urlopen(req,timeout=35) as resp:
            result=json.load(resp)
    except urllib.error.HTTPError as exc:
        raise RuntimeError("NVIDIA HTTP "+str(exc.code)) from None
    except urllib.error.URLError:
        raise RuntimeError("NVIDIA indisponível") from None
    rows=sorted(result.get("data",[]),key=lambda x:x.get("index",0))
    if len(rows)!=len(texts):
        raise RuntimeError("Quantidade de vetores inesperada")
    vectors=[row.get("embedding") for row in rows]
    if any(not isinstance(v,list) or not v or any(not isinstance(x,(float,int)) or not math.isfinite(x) for x in v) for v in vectors):
        raise RuntimeError("Vetores inválidos")
    if len({len(v) for v in vectors})!=1:
        raise RuntimeError("Dimensões inconsistentes")
    return vectors

def connect(path):
    db=sqlite3.connect(path)
    db.execute("CREATE TABLE IF NOT EXISTS chunks (id TEXT PRIMARY KEY, source TEXT NOT NULL, text TEXT NOT NULL, model TEXT NOT NULL, dim INTEGER NOT NULL, vector TEXT NOT NULL)")
    return db

def cosine(a,b):
    if len(a)!=len(b):return -1.0
    dot=sum(x*y for x,y in zip(a,b));aa=math.sqrt(sum(x*x for x in a));bb=math.sqrt(sum(y*y for y in b))
    return dot/(aa*bb) if aa and bb else 0.0

def chunks(text, size=1100):
    return [text[i:i+size] for i in range(0,len(text),size)]

def approved_source(path, approved_root):
    if not approved_root:
        raise ValueError("Indexação exige --approved-root explícito")
    root = pathlib.Path(approved_root).expanduser().resolve(strict=True)
    path = pathlib.Path(path).expanduser().resolve(strict=True)
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError("Fonte fora do escopo aprovado")
    if path.is_symlink() or path.stat().st_mode & (stat.S_IWGRP | stat.S_IWOTH):
        raise ValueError("Fonte com permissões inseguras")
    if any(part.startswith('.') for part in path.relative_to(root).parts):
        raise ValueError("Fonte oculta não permitida")
    if any(part.lower() in ('secrets', 'credentials', 'private', 'node_modules') for part in path.parts):
        raise ValueError("Fonte potencialmente sensível")
    return path

def index_file(db,key,model,path,approved_root=None):
    path=approved_source(path, approved_root)
    if not path.is_file() or path.suffix.lower() not in (".md",".txt",".py",".ts",".tsx",".js",".json",".yaml",".yml") or path.stat().st_size>300000:
        raise ValueError("Arquivo não permitido ou muito grande")
    content=path.read_text(encoding="utf-8")
    parts=chunks(content)
    if not parts:raise ValueError("Arquivo vazio")
    ids=[hashlib.sha256((str(path)+"\0"+str(i)).encode()).hexdigest() for i in range(len(parts))]
    for start in range(0,len(parts),8):
        vs=embed(parts[start:start+8],key,model,"passage")
        with db:
            for i,v in enumerate(vs,start):
                db.execute("INSERT OR REPLACE INTO chunks VALUES (?,?,?,?,?,?)",(ids[i],str(path),parts[i],model,len(v),json.dumps(v)))
    with db:
        db.execute("DELETE FROM chunks WHERE source=? AND model=? AND id NOT IN ("+",".join("?"*len(ids))+")",[str(path),model,*ids])
    return len(parts)

def search(db,key,model,query,top_k):
    v=embed([query],key,model,"query")[0]
    rows=db.execute("SELECT source,text,vector FROM chunks WHERE model=? AND dim=?",(model,len(v))).fetchall()
    results=sorted(({"source":source,"text":text,"score":round(cosine(v,json.loads(vector)),5)} for source,text,vector in rows),key=lambda x:x['score'],reverse=True)
    return results[:top_k]

def main():
    p=argparse.ArgumentParser(description="MCF NVIDIA RAG MVP (somente leitura de fontes)")
    p.add_argument("action",choices=["probe","index","search","stats"])
    p.add_argument("value",nargs="?")
    p.add_argument("--model",choices=sorted(MODELS),default="nvidia/nemotron-3-embed-1b")
    p.add_argument("--db",default="./rag.sqlite")
    p.add_argument("--key-file",default="~/.config/codebuddy/nvidia-nim.env")
    p.add_argument("--top-k",type=int,default=3)
    p.add_argument("--approved-root",help="Diretório raiz de fontes explicitamente aprovadas")
    args=p.parse_args()
    if args.top_k<1 or args.top_k>20:p.error("top-k deve ser de 1 a 20")
    db=connect(args.db)
    if args.action=="stats":
        print(json.dumps({"chunks":db.execute("SELECT count(*) FROM chunks").fetchone()[0],"models":db.execute("SELECT model,count(*) FROM chunks GROUP BY model").fetchall()}));return
    key=load_key(args.key_file)
    if args.action=="probe":
        v=embed(["Teste de recuperação semântica do MCF"],key,args.model,"query")
        print(json.dumps({"ok":True,"model":args.model,"dimensions":len(v[0])}));return
    if not args.value:p.error("value é obrigatório")
    if args.action=="index":print(json.dumps({"indexed_chunks":index_file(db,key,args.model,args.value,args.approved_root)}))
    elif args.action=="search":print(json.dumps(search(db,key,args.model,args.value,args.top_k),ensure_ascii=False,indent=2))

if __name__=="__main__":
    try:main()
    except (RuntimeError,ValueError,sqlite3.Error,OSError) as e:
        print("ERRO:",str(e),file=sys.stderr);sys.exit(1)
