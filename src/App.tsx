import { useState } from "react";
import { FaceStage } from "./components/FaceStage";
import {
  FACE_DEFAULTS,
  PRESENTATIONS,
  SLIDERS,
  withPresentation,
  type FaceParams,
  type Presentation,
} from "./lib/face";

export function App() {
  const [params, setParams] = useState<FaceParams>(FACE_DEFAULTS);

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="kicker">Free face studio</p>
          <h1>Nocturne</h1>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={() => setParams(FACE_DEFAULTS)}
        >
          Reset
        </button>
      </header>
      <p className="lede">
        Pick a look, drag the head to turn it, then shape the face with the sliders.
      </p>
      <FaceStage params={params} />
      <p className="hint">Drag on the head to rotate.</p>

      <section className="panel">
        <p className="panel-label">Look</p>
        <div className="chips">
          {PRESENTATIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={params.presentation === item.id ? "" : "ghost"}
              onClick={() => setParams((current) => withPresentation(current, item.id as Presentation))}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="sliders">
        {SLIDERS.map((field) => (
          <label key={field.key} className="slider">
            <span className="slider-row">
              <span>{field.label}</span>
              <span className="slider-value">{params[field.key].toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={0.01}
              value={params[field.key]}
              onChange={(event) =>
                setParams((current) => ({
                  ...current,
                  [field.key]: Number(event.target.value),
                }))
              }
            />
          </label>
        ))}
      </section>

      <p className="footer-note">No account. No paywall. Source on GitHub.</p>
    </div>
  );
}
