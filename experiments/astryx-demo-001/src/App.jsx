import { useMemo, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

const initialEvents = [
  { time: '11:24:08', actor: 'MESTRE', label: 'Missão criada', detail: 'MCF-ASTRYX-EXPERIMENT-001', tone: 'blue' },
  { time: '11:25:31', actor: 'Runtime', label: 'Frontend identificado', detail: 'React 19.2.8 · Vite 8.1.5', tone: 'green' },
  { time: '11:28:44', actor: 'Gateway', label: 'Bridge inspecionada', detail: 'Sofia UNBOUND — handshake pendente', tone: 'amber' },
];

const workItems = [
  { name: 'Contrato de integração', owner: 'MESTRE', state: 'Concluído', tone: 'green' },
  { name: 'Revisão arquitetural', owner: 'Sofia', state: 'Bloqueado', tone: 'amber' },
  { name: 'Benchmark visual', owner: 'MESTRE', state: 'Em execução', tone: 'blue' },
  { name: 'Gate operacional', owner: 'LÉO', state: 'Pendente', tone: 'neutral' },
];

function StatCard({ label, value, note, tone = 'neutral' }) {
  return (
    <Card>
      <Stack gap={2}>
        <Text>{label}</Text>
        <div className="stat-value" data-tone={tone}>{value}</div>
        <Text>{note}</Text>
      </Stack>
    </Card>
  );
}

export default function App() {
  const [mode, setMode] = useState('light');
  const [activeView, setActiveView] = useState('overview');
  const [events, setEvents] = useState(initialEvents);
  const [checkpointCount, setCheckpointCount] = useState(0);

  const views = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'agents', label: 'Agentes' },
    { id: 'evidence', label: 'Evidências' },
  ];

  const lastEvent = useMemo(() => events[events.length - 1], [events]);

  function addCheckpoint() {
    const next = checkpointCount + 1;
    setCheckpointCount(next);
    setEvents((current) => [
      ...current,
      {
        time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
        actor: 'MESTRE',
        label: 'Checkpoint de demonstração',
        detail: `Evento local #${next} — não persistido no runtime MCF`,
        tone: 'blue',
      },
    ]);
    setActiveView('evidence');
  }

  return (
    <Theme theme={neutralTheme} mode={mode}>
      <div className="app-shell" data-mode={mode}>
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">M</div>
            <div>
              <div className="brand-title">MCF <span>×</span> Astryx</div>
              <div className="brand-subtitle">Experimentação de interface · ambiente isolado</div>
            </div>
          </div>
          <div className="top-actions">
            <Badge label="DEMO · NÃO PRODUÇÃO" variant="warning" />
            <Button label={mode === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'} variant="secondary" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} />
          </div>
        </header>

        <main className="page-content">
          <section className="mission-heading">
            <div>
              <div className="eyebrow">MISSÃO / MCF-ASTRYX-EXPERIMENT-001</div>
              <Heading level={1}>Painel de experimentação</Heading>
              <Text>Validação do Astryx como camada visual, sem alterar runtime, permissões ou dados de produção.</Text>
            </div>
            <div className="mission-state">
              <Badge label="Execução isolada" variant="info" />
              <span className="muted">Atualizado agora</span>
            </div>
          </section>

          <nav className="view-tabs" aria-label="Seções da demonstração">
            {views.map((view) => (
              <Button
                key={view.id}
                label={view.label}
                variant={activeView === view.id ? 'primary' : 'secondary'}
                onClick={() => setActiveView(view.id)}
                aria-current={activeView === view.id ? 'page' : undefined}
              >
                {view.label}
              </Button>
            ))}
          </nav>

          {activeView === 'overview' && (
            <section aria-labelledby="overview-title" className="view-panel">
              <div className="section-title">
                <Heading level={2} id="overview-title">Resumo da missão</Heading>
                <Text>Visão operacional fictícia para avaliar densidade, hierarquia e legibilidade.</Text>
              </div>
              <div className="stats-grid">
                <StatCard label="Pacotes Astryx" value="3" note="Core, Neutral e CLI" tone="blue" />
                <StatCard label="Versão validada" value="0.7.16" note="Versões alinhadas por peer dependency" tone="green" />
                <StatCard label="Gates de agentes" value="0 / 2" note="Sofia e LÉO ainda pendentes" tone="amber" />
                <StatCard label="Checkpoints locais" value={String(checkpointCount)} note="Eventos apenas nesta página" />
              </div>
              <div className="content-grid">
                <Card>
                  <Stack gap={3}>
                    <div className="card-heading">
                      <Heading level={3}>Entregáveis e estado</Heading>
                      <Badge label="4 itens" />
                    </div>
                    <div className="work-list">
                      {workItems.map((item) => (
                        <div className="work-row" key={item.name}>
                          <div>
                            <strong>{item.name}</strong>
                            <span className="muted">Responsável: {item.owner}</span>
                          </div>
                          <span className={`state-pill ${item.tone}`}>{item.state}</span>
                        </div>
                      ))}
                    </div>
                  </Stack>
                </Card>
                <Card>
                  <Stack gap={3}>
                    <Heading level={3}>Próximo passo</Heading>
                    <Text>Reconciliar a identidade de Sofia no Agent Bridge e obter o gate de LÉO antes de considerar o relatório aprovado.</Text>
                    <div className="callout" role="status">
                      <strong>Bloqueio conhecido</strong>
                      <span>O binário mcf-agent-session não está instalado neste host. O painel Sofia está UNBOUND.</span>
                    </div>
                    <Button label="Registrar checkpoint local" variant="primary" onClick={addCheckpoint} />
                  </Stack>
                </Card>
              </div>
            </section>
          )}

          {activeView === 'agents' && (
            <section aria-labelledby="agents-title" className="view-panel">
              <div className="section-title">
                <Heading level={2} id="agents-title">Participação dos agentes</Heading>
                <Text>Identidade e autorização são estados separados; esta página não finge handoffs.</Text>
              </div>
              <div className="content-grid">
                <Card>
                  <Stack gap={2}>
                    <div className="card-heading">
                      <Heading level={3}>Sofia</Heading>
                      <span className="state-pill amber">UNBOUND</span>
                    </div>
                    <Text>Arquitetura de Software · parecer não recebido</Text>
                    <div className="detail-row"><span>Canal</span><strong>ChatGPT project Sofia MCF Canônica</strong></div>
                    <div className="detail-row"><span>Handshake</span><strong>Não verificado</strong></div>
                    <div className="detail-row"><span>Próxima ação</span><strong>Restaurar broker e bootstrap</strong></div>
                  </Stack>
                </Card>
                <Card>
                  <Stack gap={2}>
                    <div className="card-heading">
                      <Heading level={3}>LÉO</Heading>
                      <span className="state-pill neutral">PENDENTE</span>
                    </div>
                    <Text>Autoridade operacional delegada · gate não emitido</Text>
                    <div className="detail-row"><span>Canal</span><strong>Não disponível nesta execução</strong></div>
                    <div className="detail-row"><span>Gate</span><strong>Sem decisão registrada</strong></div>
                    <div className="detail-row"><span>Próxima ação</span><strong>Revisar evidências após parecer técnico</strong></div>
                  </Stack>
                </Card>
              </div>
            </section>
          )}

          {activeView === 'evidence' && (
            <section aria-labelledby="evidence-title" className="view-panel">
              <div className="section-title">
                <Heading level={2} id="evidence-title">Livro de evidências</Heading>
                <Text>Eventos locais de demonstração. Não equivalem a receipts assinados pelo runtime MCF.</Text>
              </div>
              <Card>
                <Stack gap={3}>
                  <div className="card-heading">
                    <Heading level={3}>Linha do tempo</Heading>
                    <Badge label={String(events.length) + " eventos"} />
                  </div>
                  <ol className="event-list" aria-live="polite">
                    {events.map((event, index) => (
                      <li className="event-row" key={`${event.time}-${index}`}>
                        <time>{event.time}</time>
                        <span className={`event-dot ${event.tone}`} aria-hidden="true" />
                        <div>
                          <div className="event-title">{event.label} <span className="muted">· {event.actor}</span></div>
                          <div className="event-detail">{event.detail}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <Button label="Registrar checkpoint local" variant="primary" onClick={addCheckpoint} />
                  <Button label="Voltar ao resumo" variant="secondary" onClick={() => setActiveView('overview')} />
                </Stack>
              </Card>
            </section>
          )}

          <footer className="footer">
            <span>Sandbox independente · sem persistência no MCF Runtime</span>
            <span>Último evento: {lastEvent?.time ?? '—'}</span>
          </footer>
        </main>
      </div>
    </Theme>
  );
}
