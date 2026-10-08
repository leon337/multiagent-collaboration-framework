window.__ModuleLoader__.load({ id: "mcf-dsh-inline-browser", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
const React = require("react");
const { useEffect, useState } = React;

function arg(block, name) {
  try {
    const live = block;
    const text = live?.args?.text?.(name);
    if (typeof text === "string" && text !== "") return text;
    const raw = live?.argsRaw ?? live?.call?.argsRaw;
    if (typeof raw === "string" && raw !== "") {
      const parsed = JSON.parse(raw);
      const value = parsed[name];
      return typeof value === "string" ? value : "";
    }
  } catch {}
  return "";
}

function stateOf(block) {
  const settled = typeof block === "object" && block !== null && "kind" in block;
  if (!settled) return "running";
  const value = block;
  if (value.error?.code === "interrupted") return "stopped";
  if (value.isError) return "error";
  return "ok";
}

function statusLabel(state, callState) {
  if (state.error) return "Browser indisponível";
  if (callState === "running") return "Executando no Browser";
  if (callState === "error") return "Falha na navegação";
  if (callState === "stopped") return "Interrompido";
  return "Browser concluído";
}

function BrowserInlineRow({ block }) {
  const [frame, setFrame] = useState(null);
  const [state, setState] = useState({ active: false, url: "" });
  const callState = stateOf(block);
  const requestedUrl = arg(block, "url");
  const visibleUrl = state.url || frame?.url || requestedUrl;

  useEffect(() => {
    const source = new EventSource("/browser-pane/stream");
    const onFrame = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setFrame(payload);
        setState((previous) => ({ ...previous, active: true, url: payload.url, error: void 0 }));
      } catch {}
    };
    const onState = (event) => {
      try {
        setState(JSON.parse(event.data));
      } catch {}
    };
    source.addEventListener("frame", onFrame);
    source.addEventListener("state", onState);
    return () => {
      source.removeEventListener("frame", onFrame);
      source.removeEventListener("state", onState);
      source.close();
    };
  }, []);

  return React.createElement("section", {
    "aria-label": "Browser ao vivo",
    "data-mcf-inline-browser": "",
    style: {
      border: "1px solid var(--dsw-alias-border-l3)",
      borderRadius: 10,
      overflow: "hidden",
      background: "var(--dsw-alias-bg-layer-1)",
      marginTop: 6,
      marginBottom: 6
    }
  },
    React.createElement("header", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: 36,
        padding: "0 10px",
        borderBottom: "1px solid var(--dsw-alias-border-l3)"
      }
    },
      React.createElement("span", {
        "aria-hidden": "true",
        style: {
          width: 8,
          height: 8,
          borderRadius: 999,
          background: state.active ? "var(--dsw-alias-fill-success)" : "var(--dsw-alias-fill-secondary)",
          flex: "0 0 auto"
        }
      }),
      React.createElement("strong", { style: { fontSize: 13 } }, "Browser ao vivo"),
      React.createElement("span", { style: { fontSize: 12, opacity: 0.75 } }, statusLabel(state, callState)),
      React.createElement("span", { style: { marginLeft: "auto", fontSize: 11, opacity: 0.6 } }, "controlado pelo agente")
    ),
    React.createElement("div", { style: { padding: 8 } },
      React.createElement("div", {
        title: visibleUrl,
        style: {
          fontSize: 11,
          opacity: 0.72,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginBottom: 6
        }
      }, visibleUrl || "Aguardando abertura da página…"),
      frame !== null
        ? React.createElement("div", {
            style: {
              width: "100%",
              maxHeight: 520,
              overflow: "hidden",
              borderRadius: 7,
              background: "#111",
              display: "flex",
              justifyContent: "center"
            }
          },
          React.createElement("img", {
            src: "data:image/jpeg;base64," + frame.data,
            alt: "Visualização ao vivo da página que o agente está usando",
            style: {
              display: "block",
              width: "100%",
              height: "auto",
              maxHeight: 520,
              objectFit: "contain"
            }
          })
        )
        : React.createElement("div", {
            style: {
              minHeight: 180,
              display: "grid",
              placeItems: "center",
              borderRadius: 7,
              background: "var(--dsw-alias-bg-layer-2)",
              fontSize: 12,
              opacity: 0.72,
              textAlign: "center",
              padding: 20
            }
          }, state.error || "Abrindo o navegador dentro desta conversa…")
    )
  );
}

function apply(ctx) {
  ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
    name: "tool.call.toolview",
    key: "browser_goto"
  }, BrowserInlineRow));
}

exports.inject = ["slots"];
exports.apply = apply;
return module.exports;
} });
