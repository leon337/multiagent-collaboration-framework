import type { Context } from '@deepseek-ai/cordis'

export const name = 'mcf-dsh-inline-browser'
export const inject = ['tools', 'browser', 'webServer'] as const

const TTL_MS = 15 * 60e3
const FRAME_MS = 600

type BrowserService = any
type ToolExec = any

function taskKey(exec: ToolExec): string { return exec?.agent?.id ?? 'default' }
function send(res: any, event: string, data: unknown): void {
  res.write('event: ' + event + '\n' + 'data: ' + JSON.stringify(data) + '\n\n')
}
function json(res: any, status: number, value: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(value))
}

export class InlineBrowserSessionRegistry {
  private readonly calls = new Map<string, { agentId: string; browserSession: string; expiresAt: number }>()

  constructor(private readonly browser: BrowserService) {}

  findExisting(task: string): string | undefined {
    const providers = this.browser.providers
    if (!(providers instanceof Map)) return undefined
    for (const provider of providers.values()) {
      const sessions = provider?.sessions
      if (!(sessions instanceof Map)) continue
      for (const [id, session] of sessions) {
        if (session?.label === task && this.browser.exists(id)) return id
      }
    }
    return undefined
  }

  bindCall(callId: string, agentId: string, session: string): void {
    this.calls.set(callId, { agentId, browserSession: session, expiresAt: Date.now() + TTL_MS })
  }

  resolveCall(callId: string, agentId: string): string | undefined {
    const binding = this.calls.get(callId)
    if (binding === undefined) return undefined
    if (binding.expiresAt < Date.now() || binding.agentId !== agentId || !this.browser.exists(binding.browserSession)) {
      this.calls.delete(callId)
      return undefined
    }
    return binding.browserSession
  }

  prune(): void {
    const now = Date.now()
    for (const [callId, binding] of this.calls) if (binding.expiresAt < now) this.calls.delete(callId)
  }
}

export function apply(ctx: Context): void {
  const browser = ctx.get('browser') as BrowserService | undefined
  if (browser === undefined) throw new Error('mcf-dsh-inline-browser: dsh-builtin-browser service is required')

  const registry = new InlineBrowserSessionRegistry(browser)
  const cleanupTimer = setInterval(() => registry.prune(), 60_000)

  // dsh-builtin-browser is authoritative. We only resolve its existing session;
  // this adapter never calls browser.open(), so it cannot create a duplicate session.
  ctx.on('tools/result', (exec: ToolExec, result: any) => {
    if (exec.name !== 'browser_open' || exec.agent?.id === undefined || result.isError) return
    const task = taskKey(exec)
    const session = registry.findExisting(task)
    if (session !== undefined) registry.bindCall(exec.callId, task, session)
  })

  const disposeStream = ctx.webServer.register({
    kind: 'exact',
    path: '/mcf-dsh-inline-browser/stream',
    handler: (req: any, res: any) => {
      const requestUrl = new URL(req.url ?? '/mcf-dsh-inline-browser/stream', 'http://127.0.0.1')
      const callId = requestUrl.searchParams.get('callId') ?? ''
      const agentId = requestUrl.searchParams.get('sessionId') ?? ''

      let session = registry.resolveCall(callId, agentId)
      if (session === undefined) {
        session = registry.findExisting(agentId)
        if (session !== undefined) registry.bindCall(callId, agentId, session)
      }
      if (session === undefined) {
        json(res, 404, { ok: false, error: 'INLINE_BROWSER_SESSION_NOT_FOUND' })
        return
      }

      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-store',
        connection: 'keep-alive',
        'x-content-type-options': 'nosniff',
      })
      res.write('retry: 1000\n\n')

      let closed = false
      let busy = false
      let previousUrl = ''
      let previousTabs = ''

      const pump = async (): Promise<void> => {
        if (closed || busy) return
        busy = true
        try {
          const tabs = await browser.listTabs(session)
          const active = tabs.find((tab: any) => tab.active) ?? tabs[0]
          const shot = await browser.screenshot(session, { format: 'jpeg', maxWidth: 1280, maxHeight: 720 })
          const state = {
            sessionId: agentId,
            browserSession: session,
            url: active?.url ?? '',
            tabId: active?.id ?? '',
            tabCount: tabs.length,
          }
          const tabsKey = JSON.stringify(tabs)
          if (state.url !== previousUrl || tabsKey !== previousTabs) {
            send(res, 'state', state)
            send(res, 'tabs', tabs)
            previousUrl = state.url
            previousTabs = tabsKey
          }
          send(res, 'frame', {
            sessionId: agentId,
            browserSession: session,
            url: state.url,
            width: shot.width,
            height: shot.height,
            data: shot.dataUrl.replace(/^data:image\\/[^;]+;base64,/, ''),
          })
        } catch (error) {
          send(res, 'state', { sessionId: agentId, error: error instanceof Error ? error.message : String(error) })
        } finally {
          busy = false
        }
      }

      void pump()
      const timer = setInterval(() => void pump(), FRAME_MS)
      req.on('close', () => { closed = true; clearInterval(timer) })
    },
  })

  ctx.effect(() => () => {
    clearInterval(cleanupTimer)
    disposeStream()
  }, 'mcf-dsh-inline-browser cleanup')
}
