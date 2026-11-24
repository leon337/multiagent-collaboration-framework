import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";

const API = "http://127.0.0.1:3001/api";

function authHeaders() {
  const token = window.sessionStorage.getItem("mcf-pilot-token") || "";
  return {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };
}

export function App() {
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("Carregando tarefas…");
  const [busy, setBusy] = useState(false);

  async function loadTasks() {
    const response = await fetch(API + "/tasks", { headers: authHeaders() });
    if (!response.ok)
      throw new Error(
        response.status === 401
          ? "Sessão não autorizada."
          : "Não foi possível carregar as tarefas.",
      );
    setTasks(await response.json());
    setStatus("Dados sincronizados com a API.");
  }

  useEffect(() => {
    loadTasks().catch((error) => setStatus(error.message));
  }, []);

  async function addTask() {
    const cleanTitle = title.trim();
    if (!cleanTitle || busy) return;
    setBusy(true);
    setStatus("Salvando…");
    try {
      const response = await fetch(API + "/tasks", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title: cleanTitle }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Sessão não autorizada."
            : "Falha ao salvar tarefa.",
        );
      const created = await response.json();
      setTasks((current) => [...current, created]);
      setTitle("");
      setStatus("Tarefa salva no banco de dados.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <Stack gap="lg">
        <header className="page-header">
          <p className="eyebrow">MCF · PROVA DE CAPACIDADE</p>
          <h1>Projeto-piloto Astryx</h1>
          <p className="subtitle">
            Interface React com componentes Astryx, API autenticada e
            persistência PostgreSQL isolada.
          </p>
        </header>

        <Card>
          <section className="panel" aria-labelledby="create-title">
            <h2 id="create-title">Nova tarefa</h2>
            <label htmlFor="task-title">Título da tarefa</label>
            <div className="form-row">
              <input
                id="task-title"
                aria-label="Título da tarefa"
                maxLength={120}
                placeholder="Ex.: validar fluxo de autenticação"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addTask();
                }}
              />
              <Button
                variant="primary"
                onClick={addTask}
                disabled={!title.trim() || busy}
              >
                Adicionar tarefa
              </Button>
            </div>
            <p className="status" role="status" aria-live="polite">
              {status}
            </p>
          </section>
        </Card>

        <Card>
          <section className="panel" aria-labelledby="tasks-title">
            <div className="section-heading">
              <h2 id="tasks-title">Tarefas persistidas</h2>
              <span className="count" aria-label={tasks.length + " tarefas"}>
                {tasks.length}
              </span>
            </div>
            {tasks.length === 0 ? (
              <p className="empty-state">Nenhuma tarefa registrada.</p>
            ) : (
              <ul className="task-list" aria-label="Lista de tarefas">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <span className="task-dot" aria-hidden="true" />
                    <span>{task.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Card>

        <footer>
          Ambiente de teste isolado · sem deploy · sem dados de produção
        </footer>
      </Stack>
    </main>
  );
}
