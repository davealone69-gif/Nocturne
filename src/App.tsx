import { FaceStage } from "./components/FaceStage";
import { FACE_DEFAULTS } from "./lib/face";

export function App() {
  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="kicker">Free face studio</p>
          <h1>Nocturne</h1>
        </div>
      </header>
      <p className="lede">
        Day 1 — a 3D head in the browser. Drag to turn it. Looks, hair, prompt, and save come next.
      </p>
      <FaceStage params={FACE_DEFAULTS} />
      <p className="hint">Drag on the head to rotate. Works on phone and desktop.</p>
      <p className="footer-note">No account. No paywall. Source on GitHub.</p>
    </div>
  );
}
