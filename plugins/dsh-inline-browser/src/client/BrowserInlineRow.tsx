import { useEffect, useState } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

type DockProps = PropsRuntime<'conversation.composer.dock'>

interface Frame { data: string; width?: number; height?: number; url: string; sessionId: string; browserSession: string }
interface State { status?: string; url?: string; tabCount?: number; error?: string; message?: string }

function BrowserFixedView({ sessionId }: { sessionId: string }) {
  const [frame, setFrame] = useState<Frame | null>(null)
  const [state, setState] = useState<State>({ status: 'waiting' })
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    const source = new EventSource('/mcf-dsh-inline-browser/stream?sessionId=' + encodeURIComponent(sessionId))
    const onFrame = (event: MessageEvent<string>) => { try { setFrame(JSON.parse(event.data) as Frame) } catch {} }
    const onState = (event: MessageEvent<string>) => { try { setState(JSON.parse(event.data) as State) } catch {} }
    source.addEventListener('frame', onFrame)
    source.addEventListener('state', onState)
    return () => source.close()
  }, [sessionId])
  const label = state.status === 'ready' ? 'Browser ativo' : state.status === 'error' ? 'Browser indisponível' : 'Aguardando navegador'
  return (
    <section aria-label='Navegador do agente' data-mcf-fixed-browser-view='' data-mcf-session={sessionId}>
      <button type='button' onClick={() => setCollapsed(v => !v)}>
        <strong>🌐 Browser do agente</strong><span>{label}</span><span>{collapsed ? 'Mostrar' : 'Minimizar'}</span>
      </button>
      {!collapsed && <div>
        <div title={state.url || ''}>{state.url || 'A sessão do navegador será vinculada automaticamente a esta conversa.'}</div>
        {frame ? <img src={'data:image/jpeg;base64,' + frame.data} alt='Navegador ao vivo desta conversa' data-mcf-browser-frame-session={sessionId} /> : <div>{state.message || state.error || 'Aguardando o primeiro navegador desta conversa…'}</div>}
      </div>}
    </section>
  )
}

export function apply(ctx: any): void {
  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
    { name: 'conversation.composer.dock', id: 'mcf-browser-fixed', order: -100 },
    ({ session }: DockProps) => <BrowserFixedView sessionId={session.id} />,
  ))
}
