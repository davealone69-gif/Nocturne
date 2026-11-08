import { useCallback, useEffect, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

type ServiceCommand = { action: "start" | "stop" | "status" };
type TermuxServicesPlugin = { run(options: ServiceCommand): Promise<{ accepted: boolean; action: string }> };
const TermuxServices = registerPlugin<TermuxServicesPlugin>("TermuxServices");
type Health = { proxy?: boolean; freellmapi?: boolean; apiKeyConfigured?: boolean };
type State = { health: Health | null; error: string | null; busy: boolean; message: string };

export function AndroidServicePanel() {
  const native = Capacitor.isNativePlatform();
  const [state, setState] = useState<State>({ health: null, error: null, busy: false, message: "" });
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("http://127.0.0.1:4173/health", { cache: "no-store" });
      const health = (await response.json()) as Health;
      setState((current) => ({ ...current, health, error: null }));
    } catch {
      setState((current) => ({ ...current, health: null, error: "Local proxy is not responding." }));
    }
  }, []);
  useEffect(() => {
    if (!native) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [native, refresh]);
  const command = async (action: "start" | "stop") => {
    setState((current) => ({ ...current, busy: true, message: "" }));
    try {
      await TermuxServices.run({ action });
      setState((current) => ({ ...current, message: action === "start" ? "Start request sent to Termux. Waiting for services…" : "Stop request sent to Termux." }));
      window.setTimeout(() => void refresh(), 1800);
    } catch (error) {
      setState((current) => ({ ...current, error: error instanceof Error ? error.message : "Could not contact Termux." }));
    } finally {
      setState((current) => ({ ...current, busy: false }));
    }
  };
  if (!native) return null;
  const proxyReady = Boolean(state.health?.proxy);
  const apiReady = Boolean(state.health?.freellmapi);
  const keyReady = Boolean(state.health?.apiKeyConfigured);
  return (
    <section className="service-panel" aria-label="Local services">
      <div className="service-heading">
        <div><p className="panel-label">Android services</p><p className="service-description">Start local services for photoreal portrait generation.</p></div>
        <span className={proxyReady && apiReady && keyReady ? "service-state ready" : "service-state"}>{proxyReady && apiReady && keyReady ? "Ready" : "Needs startup"}</span>
      </div>
      <div className="service-list">
        <ServiceLine label="Nocturne local proxy" ready={proxyReady} />
        <ServiceLine label="FreeLLMAPI" ready={apiReady} />
        <ServiceLine label="Server-side API key" ready={keyReady} readyText="Present" notReadyText="Missing" />
      </div>
      <div className="service-actions">
        <button type="button" disabled={state.busy} onClick={() => void command("start")}>{state.busy ? "Sending…" : "Start services"}</button>
        <button type="button" className="ghost" disabled={state.busy} onClick={() => void command("stop")}>Stop services</button>
        <button type="button" className="ghost" onClick={() => void refresh()}>Refresh</button>
      </div>
      {state.message ? <p className="service-message">{state.message}</p> : null}
      {state.error ? <p className="service-error">{state.error}</p> : null}
      {!keyReady && <p className="hint">Portrait generation also needs FREELLMAPI_KEY in ~/Nocturne/.env and an enabled image model in FreeLLMAPI.</p>}
    </section>
  );
}
function ServiceLine({ label, ready, readyText = "Running", notReadyText = "Unavailable" }: { label: string; ready: boolean; readyText?: string; notReadyText?: string }) {
  return <div className="service-line"><span>{label}</span><span className={ready ? "service-state ready" : "service-state"}>{ready ? readyText : notReadyText}</span></div>;
}
