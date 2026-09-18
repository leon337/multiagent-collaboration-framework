import fs from "node:fs/promises";
import path from "node:path";
import express from "express";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { EphemeralStore } from "./store.mjs";
import { GooglePhotosClient } from "./google.mjs";
import { signState, verifyState } from "./state.mjs";
import { createMcpAuthMiddleware, loadMcpAuthConfig, protectedResourceMetadata } from "./auth.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_FILE = path.join(__dirname, "../web/mcp-app.html");
const APP_VERSION = "0.4.5";
const DEPLOY_SHA = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || null;
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const APP_STATE_SECRET = process.env.APP_STATE_SECRET || "";
const STATE_SECRET_CONFIGURED = APP_STATE_SECRET.length >= 32;
const REDIRECT_URI = PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}/oauth/google/callback` : "";
const store = new EphemeralStore();
const google = new GooglePhotosClient({ clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, redirectUri: REDIRECT_URI, store });
const BRIDGE_CONFIGURED = google.configured && STATE_SECRET_CONFIGURED;
const RESOURCE_URI = "ui://google-photos-bridge/v2.html";
const MCP_RESOURCE_URL = PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}/mcp` : "";
const MCP_RESOURCE_METADATA_URL = PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}/.well-known/oauth-protected-resource/mcp` : "";
const MCP_AUTH = loadMcpAuthConfig({
  ...process.env,
  MCP_AUTH_AUDIENCE: process.env.MCP_AUTH_AUDIENCE || MCP_RESOURCE_URL,
  MCP_AUTH_RESOURCE_METADATA_URL: process.env.MCP_AUTH_RESOURCE_METADATA_URL || MCP_RESOURCE_METADATA_URL,
});
const MCP_SECURITY_SCHEMES = MCP_AUTH.enabled
  ? [{ type: "oauth2", scopes: MCP_AUTH.requiredScopes }]
  : [{ type: "noauth" }];

function result(data, text) {
  return { structuredContent: data, content: [{ type: "text", text: text || JSON.stringify(data) }] };
}

function createMcpServer(authInfo = null) {
  const ownerId = authInfo?.subject || authInfo?.clientId || "anonymous";
  const server = new McpServer({ name: "Google Photos Bridge", version: APP_VERSION }, { capabilities: { resources: {}, tools: {} } });

  registerAppTool(server, "photos_bridge_status", {
    title: "Open Google Photos Bridge",
    description: "Open the interactive Google Photos helper and report whether Google OAuth is configured.",
    inputSchema: {},
    outputSchema: z.object({ configured: z.boolean(), public_base_url: z.string(), redirect_uri: z.string() }),
    securitySchemes: MCP_SECURITY_SCHEMES,
    _meta: { securitySchemes: MCP_SECURITY_SCHEMES, ui: { resourceUri: RESOURCE_URI, visibility: ["model", "app"] } },
  }, async () => result({ configured: BRIDGE_CONFIGURED, public_base_url: PUBLIC_BASE_URL, redirect_uri: REDIRECT_URI }, "Google Photos Bridge helper ready."));

  registerAppTool(server, "photos_connect", {
    title: "Connect Google Photos",
    description: "Create a private Google Photos OAuth connection and return the official Google authorization URL.",
    inputSchema: {},
    outputSchema: z.object({ connection_id: z.string(), authorization_url: z.string(), status: z.string() }),
    securitySchemes: MCP_SECURITY_SCHEMES,
    _meta: { securitySchemes: MCP_SECURITY_SCHEMES, ui: { resourceUri: RESOURCE_URI, visibility: ["model", "app"] }, "openai/widgetAccessible": true },
  }, async () => {
    if (!BRIDGE_CONFIGURED) throw new Error("Google Photos Bridge setup is incomplete");
    const connectionId = store.createConnection(ownerId);
    const state = signState(APP_STATE_SECRET, { connectionId });
    return result({ connection_id: connectionId, authorization_url: google.authorizationUrl(state), status: "pending" });
  });

  registerAppTool(server, "photos_connection_status", {
    title: "Check Google Photos connection",
    description: "Check whether the Google OAuth connection is complete.",
    inputSchema: z.object({ connection_id: z.string() }),
    outputSchema: z.object({ connection_id: z.string(), status: z.string() }),
    securitySchemes: MCP_SECURITY_SCHEMES,
    _meta: { securitySchemes: MCP_SECURITY_SCHEMES, ui: { visibility: ["model", "app"] }, "openai/widgetAccessible": true },
  }, async ({ connection_id }) => {
    store.assertConnectionOwner(ownerId, connection_id);
    return result({ connection_id, status: store.connection(connection_id)?.status || "unknown" });
  });

  registerAppTool(server, "photos_picker_start", {
    title: "Start Google Photos Picker",
    description: "Create an official Google Photos Picker session for the connected account.",
    inputSchema: z.object({ connection_id: z.string(), max_items: z.number().int().min(1).max(2000).default(100) }),
    outputSchema: z.object({ session_id: z.string(), picker_uri: z.string(), expire_time: z.string().nullable(), ready: z.boolean() }),
    securitySchemes: MCP_SECURITY_SCHEMES,
    _meta: { securitySchemes: MCP_SECURITY_SCHEMES, ui: { visibility: ["model", "app"] }, "openai/widgetAccessible": true },
  }, async ({ connection_id, max_items }) => {
    store.assertConnectionOwner(ownerId, connection_id);
    const s = await google.createSession(connection_id, max_items);
    return result({ session_id: String(s.id), picker_uri: String(s.pickerUri), expire_time: s.expireTime ?? null, ready: Boolean(s.mediaItemsSet) });
  });

  registerAppTool(server, "photos_picker_status", {
    title: "Check Photos Picker selection",
    description: "Check whether the user finished selecting media in Google Photos Picker.",
    inputSchema: z.object({ connection_id: z.string(), session_id: z.string() }),
    outputSchema: z.object({ session_id: z.string(), ready: z.boolean(), expire_time: z.string().nullable() }),
    securitySchemes: MCP_SECURITY_SCHEMES,
    _meta: { securitySchemes: MCP_SECURITY_SCHEMES, ui: { visibility: ["model", "app"] }, "openai/widgetAccessible": true },
  }, async ({ connection_id, session_id }) => {
    store.assertConnectionOwner(ownerId, connection_id);
    const s = await google.getSession(connection_id, session_id);
    return result({ session_id, ready: Boolean(s.mediaItemsSet), expire_time: s.expireTime ?? null });
  });

  registerAppTool(server, "photos_list_items", {
    title: "List selected Google Photos",
    description: "List metadata for media explicitly selected by the user in the active Picker session.",
    inputSchema: z.object({ connection_id: z.string(), session_id: z.string() }),
    outputSchema: z.object({ ready: z.boolean(), count: z.number(), items: z.array(z.object({ id: z.string(), type: z.string().nullable(), filename: z.string().nullable(), mime_type: z.string().nullable(), create_time: z.string().nullable() })) }),
    securitySchemes: MCP_SECURITY_SCHEMES,
    _meta: { securitySchemes: MCP_SECURITY_SCHEMES, ui: { visibility: ["model", "app"] }, "openai/widgetAccessible": true },
  }, async ({ connection_id, session_id }) => {
    store.assertConnectionOwner(ownerId, connection_id);
    const s = await google.getSession(connection_id, session_id);
    if (!s.mediaItemsSet) return result({ ready: false, count: 0, items: [] });
    const items = (await google.listItems(connection_id, session_id)).map((it) => ({
      id: String(it.id), type: it.type ?? null, filename: it.mediaFile?.filename ?? null, mime_type: it.mediaFile?.mimeType ?? null, create_time: it.createTime ?? null,
    }));
    return result({ ready: true, count: items.length, items });
  });

  registerAppTool(server, "photos_get_image", {
    title: "Read a selected Google Photo",
    description: "Return image content for one photo explicitly selected by the user in the current Picker session. Use this when visual analysis is needed.",
    inputSchema: z.object({
      connection_id: z.string(),
      session_id: z.string(),
      media_id: z.string(),
      max_width: z.number().int().min(1).max(4096).default(1600),
      max_height: z.number().int().min(1).max(4096).default(1600),
    }),
    outputSchema: z.object({ id: z.string(), filename: z.string().nullable(), mime_type: z.string(), width: z.number(), height: z.number() }),
    securitySchemes: MCP_SECURITY_SCHEMES,
    _meta: { securitySchemes: MCP_SECURITY_SCHEMES, ui: { visibility: ["model"] } },
  }, async ({ connection_id, session_id, media_id, max_width, max_height }) => {
    store.assertConnectionOwner(ownerId, connection_id);
    const image = await google.getImageBytes(connection_id, session_id, media_id, max_width, max_height);
    return {
      structuredContent: { id: image.id, filename: image.filename, mime_type: image.mimeType, width: image.width, height: image.height },
      content: [
        { type: "image", data: image.bytes.toString("base64"), mimeType: image.mimeType },
        { type: "text", text: `Selected Google Photos image: ${image.filename || image.id}` },
      ],
    };
  });

  registerAppTool(server, "photos_picker_close", {
    title: "Close Google Photos Picker session",
    description: "Delete an active Google Photos Picker session after the selected media is no longer needed.",
    inputSchema: z.object({ connection_id: z.string(), session_id: z.string() }),
    outputSchema: z.object({ closed: z.boolean(), session_id: z.string() }),
    securitySchemes: MCP_SECURITY_SCHEMES,
    _meta: { securitySchemes: MCP_SECURITY_SCHEMES, ui: { visibility: ["model", "app"] }, "openai/widgetAccessible": true },
  }, async ({ connection_id, session_id }) => {
    store.assertConnectionOwner(ownerId, connection_id);
    await google.deleteSession(connection_id, session_id);
    return result({ closed: true, session_id }, "Google Photos Picker session closed.");
  });

  registerAppTool(server, "photos_disconnect", {
    title: "Disconnect Google Photos",
    description: "Revoke the Google OAuth grant used by this bridge and clear the ephemeral connection state.",
    inputSchema: z.object({ connection_id: z.string() }),
    outputSchema: z.object({ disconnected: z.boolean() }),
    securitySchemes: MCP_SECURITY_SCHEMES,
    _meta: { securitySchemes: MCP_SECURITY_SCHEMES, ui: { visibility: ["model", "app"] }, "openai/widgetAccessible": true },
  }, async ({ connection_id }) => {
    store.assertConnectionOwner(ownerId, connection_id);
    const disconnected = await google.disconnect(connection_id);
    return result({ disconnected }, disconnected ? "Google Photos disconnected." : "Connection was already absent.");
  });

  registerAppResource(server, "Google Photos Bridge UI", RESOURCE_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{
      uri: RESOURCE_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: await fs.readFile(WEB_FILE, "utf8"),
      _meta: {
        ui: {
          prefersBorder: true,
          ...(PUBLIC_BASE_URL ? { domain: PUBLIC_BASE_URL } : {}),
          csp: { connectDomains: [], resourceDomains: [] },
        },
        "openai/widgetDescription": "Mobile-first helper for connecting Google Photos and choosing media through the official Picker.",
        "openai/widgetPrefersBorder": true,
        "openai/widgetCSP": { redirect_domains: ["https://accounts.google.com", "https://photos.google.com"] },
      },
    }],
  }));
  return server;
}

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (PUBLIC_BASE_URL) {
    const expectedHost = new URL(PUBLIC_BASE_URL).host;
    const actualHost = req.get("host");
    if (actualHost && actualHost !== expectedHost && !actualHost.startsWith("localhost:") && !actualHost.startsWith("127.0.0.1:")) {
      return res.status(421).send("Misdirected Request");
    }
  }
  return next();
});
app.use(express.json({ limit: "1mb" }));

function legalPage(title, bodyHtml) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:0 auto;padding:28px 18px;line-height:1.55;color:#111827}h1,h2{line-height:1.2}a{color:#1d4ed8}code{background:#f3f4f6;padding:2px 5px;border-radius:5px}.muted{color:#6b7280}</style></head><body>${bodyHtml}</body></html>`;
}

app.get("/", (_req, res) => res.type("html").send(legalPage("Google Photos Bridge", `
  <h1>Google Photos Bridge</h1>
  <p>MCP App mobile-first que conecta o ChatGPT ao Google Photos Picker oficial. O Bridge acessa apenas mídias que o usuário seleciona explicitamente no Picker.</p>
  <p><a href="/privacy">Política de Privacidade</a> · <a href="/terms">Termos de Uso</a> · <a href="/healthz">Health</a></p>
  <p class="muted">Versão ${APP_VERSION}</p>
`)));

app.get("/privacy", (_req, res) => res.type("html").send(legalPage("Política de Privacidade — Google Photos Bridge", `
  <h1>Política de Privacidade</h1>
  <p><strong>Última atualização:</strong> 18 de setembro de 2026.</p>
  <h2>Dados acessados</h2>
  <p>O Google Photos Bridge solicita somente o escopo de leitura do Google Photos Picker. O serviço não solicita acesso irrestrito à biblioteca. Somente mídias escolhidas explicitamente pelo usuário em uma sessão do Picker podem ser listadas ou lidas.</p>
  <h2>Tokens e sessões</h2>
  <p>Tokens OAuth do Google são mantidos no servidor e não são enviados para o componente de interface do ChatGPT. Na versão atual, conexões e sessões são armazenadas de forma efêmera em memória. Desconectar revoga a autorização Google usada pelo Bridge e limpa o estado efêmero associado.</p>
  <h2>Uso das mídias</h2>
  <p>As imagens selecionadas são recuperadas somente quando uma ferramenta do Bridge precisa entregá-las ao modelo para atender à solicitação do usuário. O Bridge não cria um índice biométrico nem oferece busca irrestrita da biblioteca.</p>
  <h2>Infraestrutura</h2>
  <p>O serviço é hospedado no Render e pode processar metadados operacionais necessários para fornecer e proteger o serviço. Segredos OAuth não são deliberadamente gravados em logs pelo Bridge.</p>
  <h2>Contato</h2>
  <p>Questões sobre privacidade podem ser registradas no repositório do projeto: <a href="https://github.com/leon337/multiagent-collaboration-framework">multiagent-collaboration-framework</a>.</p>
`)));

app.get("/terms", (_req, res) => res.type("html").send(legalPage("Termos de Uso — Google Photos Bridge", `
  <h1>Termos de Uso</h1>
  <p><strong>Última atualização:</strong> 18 de setembro de 2026.</p>
  <p>O Google Photos Bridge é uma integração que permite ao usuário selecionar mídias por meio do Google Photos Picker oficial e disponibilizá-las a uma sessão do ChatGPT.</p>
  <h2>Controle do usuário</h2>
  <p>O usuário controla quais mídias são selecionadas e pode encerrar a sessão do Picker ou desconectar a conta Google pelo Bridge.</p>
  <h2>Uso permitido</h2>
  <p>O serviço deve ser usado apenas com contas e mídias que o usuário esteja autorizado a acessar. Não é permitido tentar contornar controles de acesso do Google, do ChatGPT ou do próprio Bridge.</p>
  <h2>Disponibilidade</h2>
  <p>Esta versão está em desenvolvimento e pode mudar. O funcionamento depende de serviços externos, incluindo Google, OpenAI e Render.</p>
  <h2>Contato</h2>
  <p>Questões podem ser registradas no repositório do projeto: <a href="https://github.com/leon337/multiagent-collaboration-framework">multiagent-collaboration-framework</a>.</p>
`)));

app.get("/setup/google-cloud", (_req, res) => {
  const projectId = "our-rock-308910";
  const callback = "https://mcf-google-photos-bridge.onrender.com/oauth/google/callback";
  const keyId = "391428cc7b858455395cae7cb9971588112181745e324808c7d0a69908d0a581";
  const publicKeyPem = "-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAzpnqqzM6TFqRjLAb3AjZ\n+jctjNZ8IS8zqtJ+sGiu31aXGaZHpPL8i9VsZcs9kxMbsXhJU4BpyUTzQQFgpAFw\nc1wMqhhJ0n2OBtu7V6KUv3bWzjLwcLf9tauwNxcwzUXzVhM1xdGhyKHonYgc8GxH\nGaS1SJxofBZNUHlGriSvJZGasnHQufwXpT1XwOuc0RCt1CxbqXtL+mitGBhMSHYG\n1UmClXEXRipPcFcg9mhpwPzaA+Z7qqKLRxfVrMleIP75CLzKhEi1oAvaldiDTpih\nvQdHy7UbM4072ypEPEpAh/MAW1tI9gqVENgR5xX7VHPd0/koLW9+xNSvmGT/MXTz\n75gHwaRnXisAbK+qQiphn4B4pxqZ7XaU4TAQO7CINRCb/sKe64cLaRdF3fDfjFVz\nKxnOQ8+u0xDLEM7iQMT3KESKH8WDCjuT7/qXvlajQVMBl+U626RfSTGc/aB7QOAW\n2ps4NtbZiDlhr60cLaM1ipceB1UFc+EuO2D6kz7Sx3ezAgMBAAE=\n-----END PUBLIC KEY-----";
  const apiUrl = "https://console.cloud.google.com/apis/library/photospicker.googleapis.com?project=" + encodeURIComponent(projectId);
  const clientsUrl = "https://console.cloud.google.com/auth/clients?project=" + encodeURIComponent(projectId);
  const audienceUrl = "https://console.cloud.google.com/auth/audience?project=" + encodeURIComponent(projectId);
  res.type("html").send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Configurar Google Photos Bridge</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:0 auto;padding:18px;background:#0b1020;color:#eef2ff}
.card{background:#151b2f;border:1px solid #2a3558;border-radius:16px;padding:16px;margin:12px 0}
h1{font-size:22px}h2{font-size:17px;margin-top:0}.muted{color:#a9b3cf;font-size:13px}
a.btn,button{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;border:0;border-radius:12px;padding:13px 14px;margin:10px 0;background:#eef2ff;color:#111827;font-weight:700;font-size:15px}
button.secondary{background:#263252;color:#eef2ff;border:1px solid #46557f}
input{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid #46557f;background:#0f1528;color:#fff;padding:12px;margin:6px 0 12px;font-size:14px}
code,textarea{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}textarea{width:100%;box-sizing:border-box;min-height:120px;border-radius:10px;padding:10px;background:#0f1528;color:#dbeafe;border:1px solid #46557f}
.ok{color:#86efac}.warn{color:#fde68a}
</style></head><body>
<h1>Google Photos Bridge — configuração guiada</h1>
<p class="muted">Projeto Google Cloud selecionado: <strong>${projectId}</strong>. Você só precisa confirmar as telas oficiais do Google. Não digite senha neste site.</p>

<section class="card">
<h2>1. Habilitar Google Photos Picker API</h2>
<p>Abra a página oficial e toque em <strong>Ativar / Enable</strong> se aparecer.</p>
<a class="btn" href="${apiUrl}" target="_blank" rel="noopener">Abrir Photos Picker API no Google</a>
</section>

<section class="card">
<h2>2. Criar o cliente OAuth</h2>
<p>Abra a página oficial do Google Auth Platform. Se pedir para registrar o app, use <strong>Google Photos Bridge</strong>. Depois crie um cliente do tipo <strong>Web application</strong>.</p>
<a class="btn" href="${clientsUrl}" target="_blank" rel="noopener">Abrir Google Auth Platform → Clients</a>
<p class="muted">Em “Authorized redirect URIs”, adicione exatamente:</p>
<textarea id="callback" readonly>${callback}</textarea>
<button class="secondary" onclick="navigator.clipboard.writeText(callback)">Copiar callback</button>
</section>

<section class="card">
<h2>3. Adicionar sua conta como usuário de teste</h2>
<p>Como o app está em <strong>Testing</strong>, abra <strong>Audience</strong> e confirme que sua própria conta Google está na lista de <strong>Test users</strong>. Não mude para produção agora.</p>
<a class="btn" href="${audienceUrl}" target="_blank" rel="noopener">Abrir Audience / Test users</a>
</section>

<section class="card">
<h2>4. Entregar as credenciais com segurança</h2>
<p>Você já baixou o JSON do cliente OAuth. Selecione esse arquivo abaixo. O navegador vai ler somente <strong>client_id</strong>, <strong>client_secret</strong>, <strong>project_id</strong> e <strong>redirect_uris</strong>, validar o callback e criptografar as credenciais no seu telefone antes de você enviar qualquer coisa para o chat.</p>
<label>Arquivo JSON baixado do Google</label>
<input id="jsonfile" type="file" accept=".json,application/json">
<p id="jsonstatus" class="muted">Nenhum arquivo selecionado.</p>
<hr style="border:0;border-top:1px solid #2a3558;margin:16px 0">
<p class="muted">Fallback manual, caso o seletor de arquivo não funcione:</p>
<label>Client ID</label><input id="cid" autocomplete="off" spellcheck="false">
<label>Client Secret</label><input id="csecret" type="password" autocomplete="off" spellcheck="false">
<button id="encrypt">Criptografar para o Mestre</button>
<p id="status" class="muted"></p>
<textarea id="cipher" readonly placeholder="O pacote criptografado aparecerá aqui."></textarea>
<button class="secondary" id="copy" disabled>Copiar pacote criptografado</button>
<p class="muted">Key ID: ${keyId.slice(0,16)}… A chave privada correspondente permanece somente no sandbox desta conversa.</p>
</section>

<script>
const callback="https://mcf-google-photos-bridge.onrender.com/oauth/google/callback";
const publicKeyPem="-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAzpnqqzM6TFqRjLAb3AjZ\n+jctjNZ8IS8zqtJ+sGiu31aXGaZHpPL8i9VsZcs9kxMbsXhJU4BpyUTzQQFgpAFw\nc1wMqhhJ0n2OBtu7V6KUv3bWzjLwcLf9tauwNxcwzUXzVhM1xdGhyKHonYgc8GxH\nGaS1SJxofBZNUHlGriSvJZGasnHQufwXpT1XwOuc0RCt1CxbqXtL+mitGBhMSHYG\n1UmClXEXRipPcFcg9mhpwPzaA+Z7qqKLRxfVrMleIP75CLzKhEi1oAvaldiDTpih\nvQdHy7UbM4072ypEPEpAh/MAW1tI9gqVENgR5xX7VHPd0/koLW9+xNSvmGT/MXTz\n75gHwaRnXisAbK+qQiphn4B4pxqZ7XaU4TAQO7CINRCb/sKe64cLaRdF3fDfjFVz\nKxnOQ8+u0xDLEM7iQMT3KESKH8WDCjuT7/qXvlajQVMBl+U626RfSTGc/aB7QOAW\n2ps4NtbZiDlhr60cLaM1ipceB1UFc+EuO2D6kz7Sx3ezAgMBAAE=\n-----END PUBLIC KEY-----";
const keyId="391428cc7b858455395cae7cb9971588112181745e324808c7d0a69908d0a581";
const projectId="our-rock-308910";
function pemToBuf(pem){
  const b64=pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g,"");
  const bin=atob(b64); const out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out.buffer;
}
function b64url(buf){
  const bytes=new Uint8Array(buf); let s="";
  for(const b of bytes) s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function encryptCredentials(cid,sec,project=""){
  const st=document.getElementById("status");
  if(!cid||!sec){st.textContent="Client ID ou Client Secret ausente.";st.className="warn";return}
  try{
    const key=await crypto.subtle.importKey("spki",pemToBuf(publicKeyPem),{name:"RSA-OAEP",hash:"SHA-256"},false,["encrypt"]);
    const payload=new TextEncoder().encode(JSON.stringify({v:1,key_id:keyId,client_id:cid,client_secret:sec,project_id:project||projectId}));
    const encrypted=await crypto.subtle.encrypt({name:"RSA-OAEP"},key,payload);
    document.getElementById("cipher").value="GPB1."+keyId+"."+b64url(encrypted);
    document.getElementById("copy").disabled=false;
    document.getElementById("cid").value="";
    document.getElementById("csecret").value="";
    st.textContent="Credenciais criptografadas no dispositivo. Copie somente o pacote GPB1 e envie na conversa.";
    st.className="ok";
  }catch(e){st.textContent="Falha ao criptografar: "+e.message;st.className="warn"}
}

document.getElementById("jsonfile").onchange=async(ev)=>{
  const file=ev.target.files?.[0];
  const js=document.getElementById("jsonstatus");
  if(!file){js.textContent="Nenhum arquivo selecionado.";js.className="muted";return}
  try{
    const raw=JSON.parse(await file.text());
    const web=raw.web;
    if(!web) throw new Error("O JSON não contém a seção web esperada.");
    const cid=String(web.client_id||"").trim();
    const sec=String(web.client_secret||"").trim();
    const pid=String(web.project_id||"").trim();
    const redirects=Array.isArray(web.redirect_uris)?web.redirect_uris.map(String):[];
    if(!cid||!sec) throw new Error("Client ID/Secret ausentes no JSON.");
    if(pid && pid!==projectId) throw new Error("O JSON pertence a outro projeto: "+pid);
    if(!redirects.includes(callback)) throw new Error("O callback do Bridge não aparece em redirect_uris. Edite o cliente OAuth antes de continuar.");
    js.textContent="JSON validado ✅ Projeto, tipo Web e callback conferem. Criptografando...";
    js.className="ok";
    await encryptCredentials(cid,sec,pid);
    js.textContent="JSON validado e credenciais criptografadas ✅";
  }catch(e){
    js.textContent="Não consegui validar esse JSON: "+e.message;
    js.className="warn";
  }
};

document.getElementById("encrypt").onclick=async()=>{
  const cid=document.getElementById("cid").value.trim();
  const sec=document.getElementById("csecret").value.trim();
  const st=document.getElementById("status");
  if(!cid||!sec){st.textContent="Preencha Client ID e Client Secret.";st.className="warn";return}
  await encryptCredentials(cid,sec,projectId);
};
document.getElementById("copy").onclick=()=>navigator.clipboard.writeText(document.getElementById("cipher").value);
</script>
</body></html>`);
});
app.get("/healthz", (_req, res) => res.json({ ok: true, service: "google-photos-bridge", version: APP_VERSION, deploy_sha: DEPLOY_SHA, configured: BRIDGE_CONFIGURED, mcp_auth_enabled: MCP_AUTH.enabled }));
app.get("/setup", (_req, res) => res.json({ configured: BRIDGE_CONFIGURED, public_base_url: PUBLIC_BASE_URL, redirect_uri: REDIRECT_URI, checks: { google_oauth: google.configured, state_secret: STATE_SECRET_CONFIGURED }, mcp_auth: { enabled: MCP_AUTH.enabled, issuer: MCP_AUTH.issuer || null, audience: MCP_AUTH.audience || null, scopes: MCP_AUTH.requiredScopes }, required: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "APP_STATE_SECRET"] }));

if (MCP_AUTH.enabled) {
  const metadataHandler = (_req, res) => res.json(protectedResourceMetadata(MCP_AUTH, MCP_RESOURCE_URL));
  app.get("/.well-known/oauth-protected-resource/mcp", metadataHandler);
  app.get("/.well-known/oauth-protected-resource", metadataHandler);
}

app.get("/oauth/google/start", (req, res) => {
  try {
    const connectionId = String(req.query.connection_id || "");
    if (!store.connection(connectionId)) return res.status(404).send("Unknown connection");
    const state = signState(APP_STATE_SECRET, { connectionId });
    return res.redirect(302, google.authorizationUrl(state));
  } catch (error) { return res.status(503).send(error.message); }
});

app.get("/oauth/google/callback", async (req, res) => {
  try {
    if (req.query.error) throw new Error(String(req.query.error));
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    if (!code || !state) throw new Error("Missing OAuth parameters");
    const { connectionId } = verifyState(APP_STATE_SECRET, state);
    if (!store.connection(connectionId)) throw new Error("Unknown connection");
    store.saveToken(connectionId, await google.exchangeCode(code));
    res.type("html").send("<main style='font-family:system-ui;padding:24px'><h1>Google Fotos conectado ✅</h1><p>Volte para a conversa do ChatGPT e toque em <b>Verificar conexão</b>.</p></main>");
  } catch (error) { res.status(400).type("html").send(`<main style='font-family:system-ui;padding:24px'><h1>Falha na conexão</h1><p>${String(error.message).replace(/[<>&]/g, "")}</p></main>`); }
});

const mcpAuthMiddleware = createMcpAuthMiddleware(MCP_AUTH);
app.all("/mcp", mcpAuthMiddleware, async (req, res) => {
  const server = createMcpServer(req.mcpAuth || null);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => { transport.close().catch(() => {}); server.close().catch(() => {}); });
  try { await server.connect(transport); await transport.handleRequest(req, res, req.body); }
  catch (error) { console.error(error); if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null }); }
});

app.listen(PORT, "0.0.0.0", () => console.log(`Google Photos Bridge v${APP_VERSION} listening on :${PORT} deploy=${DEPLOY_SHA || "unknown"}`));
