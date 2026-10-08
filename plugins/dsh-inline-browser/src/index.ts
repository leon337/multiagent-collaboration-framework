import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-tools'

export const name = "mcf-dsh-inline-browser";
export const inject = ['tools', 'browser', 'webServer'] as const;

const TTL_MS = 15 * 60e3;
const FRAME_MS = 600;

function taskKey(exec) { return exec?.agent?.id ?? "default"; }
function send(res, event, data) { res.write("event: " + event + "\n" + "data: " + JSON.stringify(data) + "\n\n"); }
function json(res, status, value) { res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(value)); }

export class InlineBrowserSessionRegistry {
  constructor(browser) { this.browser = browser; this.calls = new Map(); }
  bindCall(callId, agentId, session) { this.calls.set(callId, { agentId, browserSession: session, expiresAt: Date.now() + TTL_MS }); }
  resolveCall(callId, agentId) {
    const binding = this.calls.get(callId);
    if (binding === undefined) return undefined;
    if (binding.expiresAt < Date.now() || binding.agentId !== agentId || !this.browser.exists(binding.browserSession)) { this.calls.delete(callId); return undefined; }
    return binding.browserSession;
  }
  prune() { const now = Date.now(); for (const [callId, binding] of this.calls) if (binding.expiresAt < now) this.calls.delete(callId); }
}

export function apply(ctx: Context): void {
  const browser = ctx.get("browser");
  if (browser === undefined) throw new Error("mcf-dsh-inline-browser: dsh-builtin-browser service is required");
  const registry = new InlineBrowserSessionRegistry(browser);
  const cleanupTimer = setInterval(() => registry.prune(), 6e4);

  // Observe every built-in browser call before its own tool body runs. The built-in
  // browser already owns one BrowserSession per DSH agent/session; opening by the
  // same task key therefore resolves to that exact session instead of creating a
  // second browser. The call id is then the durable UI-to-session binding.
  ctx.on("tools/pre-execute", async (exec, next) => {
    if (!exec.name.startsWith("browser_")) return next();
    const task = taskKey(exec);
    try {
      const session = await browser.open(task);
      registry.bindCall(exec.callId, task, session);
    } catch {
      // The underlying browser tool remains authoritative; the inline card will
      // show its unavailable state if the session cannot be resolved.
    }
    return next();
  });

  const disposeStream = ctx.webServer.register({
    kind: "exact",
    path: "/mcf-dsh-inline-browser/stream",
    handler: (req, res) => {
      const requestUrl = new URL(req.url ?? "/mcf-dsh-inline-browser/stream", "http://127.0.0.1");
      const callId = requestUrl.searchParams.get("callId") ?? "";
      const agentId = requestUrl.searchParams.get("sessionId") ?? "";
      const session = registry.resolveCall(callId, agentId);
      if (session === undefined) { json(res, 404, { ok: false, error: "INLINE_BROWSER_SESSION_NOT_FOUND" }); return; }
      res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-store", connection: "keep-alive", "x-content-type-options": "nosniff" });
      res.write("retry: 1000\n\n");
      let closed = false;
      let busy = false;
      let previousUrl = "";
      let previousTabs = "";
      const pump = async () => {
        if (closed || busy) return;
        busy = true;
        try {
          const tabs = await browser.listTabs(session);
          const active = tabs.find(tab => tab.active) ?? tabs[0];
          const shot = await browser.screenshot(session, { format: "jpeg", maxWidth: 1280, maxHeight: 720 });
          const state = { sessionId: agentId, browserSession: session, url: active?.url ?? "", tabId: active?.id ?? "", tabCount: tabs.length };
          const tabsKey = JSON.stringify(tabs);
          if (state.url !== previousUrl || tabsKey !== previousTabs) { send(res, "state", state); send(res, "tabs", tabs); previousUrl = state.url; previousTabs = tabsKey; }
          send(res, "frame", { sessionId: agentId, browserSession: session, url: state.url, width: shot.width, height: shot.height, data: shot.dataUrl.replace(/^data:image\/[^;]+;base64,/, "") });
        } catch (error) { send(res, "state", { sessionId: agentId, error: error instanceof Error ? error.message : String(error) }); }
        finally { busy = false; }
      };
      void pump();
      const timer = setInterval(() => void pump(), FRAME_MS);
      req.on("close", () => { closed = true; clearInterval(timer); });
    },
  });

  ctx.effect(() => () => { clearInterval(cleanupTimer); disposeStream(); }, "mcf-dsh-inline-browser cleanup");
}
