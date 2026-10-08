import { useEffect, useState, type ReactNode } from 'react'
import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client'

interface PaneFrame {
  data: string
  width: number
  height: number
  url: string
}

interface PaneState {
  active: boolean
  url: string
  error?: string
  mode?: string
}

function arg(block: ToolCallViewProps['block'], name: string): string {
  try {
    const live = block as unknown as { args?: { text?: (key: string) => string | undefined }; argsRaw?: string; call?: { argsRaw?: string } }
    const text = live.args?.text?.(name)
    if (typeof text === 'string' && text !== '') return text
    const raw = live.argsRaw ?? live.call?.argsRaw
    if (typeof raw === 'string' && raw !== '') {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const value = parsed[name]
      return typeof value === 'string' ? value : ''
    }
  } catch {
    // The renderer must remain total during partial tool-call streaming.
  }
  return ''
}

function stateOf(block: ToolCallViewProps['block']): 'running' | 'ok' | 'error' | 'stopped' {
  const settled = typeof block === 'object' && block !== null && 'kind' in block
  if (!settled) return 'running'
  const value = block as unknown as { isError?: boolean; error?: { code?: string } }
  if (value.error?.code === 'interrupted') return 'stopped'
  if (value.isError) return 'error'
  return 'ok'
}

function statusLabel(state: PaneState, callState: ReturnType<typeof stateOf>): string {
  if (state.error) return 'Browser indisponível'
  if (callState === 'running') return 'Executando no Browser'
  if (callState === 'error') return 'Falha na navegação'
  if (callState === 'stopped') return 'Interrompido'
  return 'Browser concluído'
}

export function BrowserInlineRow({ block }: ToolCallViewProps): ReactNode {
  const [frame, setFrame] = useState<PaneFrame | null>(null)
  const [state, setState] = useState<PaneState>({ active: false, url: '' })
  const callState = stateOf(block)
  const requestedUrl = arg(block, 'url')
  const visibleUrl = state.url || frame?.url || requestedUrl

  useEffect(() => {
    const source = new EventSource('/browser-pane/stream')

    const onFrame = (event: MessageEvent<string>): void => {
      try {
        const payload = JSON.parse(event.data) as PaneFrame
        setFrame(payload)
        setState(previous => ({ ...previous, active: true, url: payload.url, error: undefined }))
      } catch {
        // Ignore malformed frame events; the next frame can repair the view.
      }
    }

    const onState = (event: MessageEvent<string>): void => {
      try {
        const payload = JSON.parse(event.data) as PaneState
        setState(payload)
      } catch {
        // Keep the last good state.
      }
    }

    source.addEventListener('frame', onFrame)
    source.addEventListener('state', onState)
    return () => {
      source.removeEventListener('frame', onFrame)
      source.removeEventListener('state', onState)
      source.close()
    }
  }, [])

  return (
    <section
      aria-label="Browser ao vivo"
      data-mcf-inline-browser=""
      style={{
        border: '1px solid var(--dsw-alias-border-l3)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--dsw-alias-bg-layer-1)',
        marginTop: 6,
        marginBottom: 6,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minHeight: 36,
          padding: '0 10px',
          borderBottom: '1px solid var(--dsw-alias-border-l3)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: state.active ? 'var(--dsw-alias-fill-success)' : 'var(--dsw-alias-fill-secondary)',
            flex: '0 0 auto',
          }}
        />
        <strong style={{ fontSize: 13 }}>Browser ao vivo</strong>
        <span style={{ fontSize: 12, opacity: 0.75 }}>{statusLabel(state, callState)}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>controlado pelo agente</span>
      </header>

      <div style={{ padding: 8 }}>
        <div
          style={{
            fontSize: 11,
            opacity: 0.72,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 6,
          }}
          title={visibleUrl}
        >
          {visibleUrl || 'Aguardando abertura da página…'}
        </div>

        {frame !== null ? (
          <div
            style={{
              width: '100%',
              maxHeight: 520,
              overflow: 'hidden',
              borderRadius: 7,
              background: '#111',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <img
              src={`data:image/jpeg;base64,${frame.data}`}
              alt="Visualização ao vivo da página que o agente está usando"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                maxHeight: 520,
                objectFit: 'contain',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              minHeight: 180,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 7,
              background: 'var(--dsw-alias-bg-layer-2)',
              fontSize: 12,
              opacity: 0.72,
              textAlign: 'center',
              padding: 20,
            }}
          >
            {state.error ?? 'Abrindo o navegador dentro desta conversa…'}
          </div>
        )}
      </div>
    </section>
  )
}
