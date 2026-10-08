import { useEffect, useState, type ReactNode } from 'react'
import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client'

interface Frame {
  data: string
  width?: number
  height?: number
  url: string
  sessionId: string
  browserSession: string
}

interface State {
  url?: string
  tabId?: string
  tabCount?: number
  error?: string
}

function requestedUrl(block: ToolCallViewProps['block']): string {
  try {
    const value = block as unknown as { args?: { text?: (key: string) => string | undefined }; argsRaw?: string; call?: { argsRaw?: string } }
    const live = value.args?.text?.('url')
    if (typeof live === 'string' && live !== '') return live
    const raw = value.argsRaw ?? value.call?.argsRaw
    if (raw) {
      const parsed = JSON.parse(raw) as { url?: unknown }
      return typeof parsed.url === 'string' ? parsed.url : ''
    }
  } catch {}
  return ''
}

export function BrowserInlineRow({ block, callId, sessionId }: ToolCallViewProps): ReactNode {
  const [frame, setFrame] = useState<Frame | null>(null)
  const [state, setState] = useState<State>({})

  useEffect(() => {
    const source = new EventSource(
      '/mcf-dsh-inline-browser/stream?callId=' +
      encodeURIComponent(callId) +
      '&sessionId=' +
      encodeURIComponent(sessionId),
    )

    const onFrame = (event: MessageEvent<string>) => {
      try { setFrame(JSON.parse(event.data) as Frame) } catch {}
    }
    const onState = (event: MessageEvent<string>) => {
      try { setState(JSON.parse(event.data) as State) } catch {}
    }

    source.addEventListener('frame', onFrame)
    source.addEventListener('state', onState)

    return () => {
      source.removeEventListener('frame', onFrame)
      source.removeEventListener('state', onState)
      source.close()
    }
  }, [callId, sessionId])

  const url = state.url || frame?.url || requestedUrl(block)

  return (
    <section
      aria-label="Browser ao vivo"
      data-mcf-inline-browser=""
      data-mcf-session={sessionId}
    >
      <header>
        <strong>Browser ao vivo</strong>
        <span>{state.error ? 'Indisponível' : 'Browser conectado'}</span>
        <span>{state.tabCount !== undefined ? state.tabCount + ' aba(s)' : ''}</span>
      </header>
      <div className="mcf-inline-browser-url" title={url}>{url || 'Abrindo o navegador…'}</div>
      {frame ? (
        <img
          src={'data:image/jpeg;base64,' + frame.data}
          alt="Visualização ao vivo do navegador desta conversa"
          data-mcf-browser-frame-session={sessionId}
        />
      ) : (
        <div className="mcf-inline-browser-placeholder">
          {state.error || 'Aguardando o primeiro frame…'}
        </div>
      )}
    </section>
  )
}
