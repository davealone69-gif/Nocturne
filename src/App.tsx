import { useEffect, useState, type ReactNode } from "react";
import { FaceStage } from "./components/FaceStage";
import {
  EYE_COLORS,
  FACE_DEFAULTS,
  FACIAL_HAIR,
  HAIR_COLORS,
  HAIR_STYLES,
  PRESENTATIONS,
  SLIDERS,
  applyPrompt,
  loadFaces,
  paramsFromSeed,
  storeFaces,
  withPresentation,
  type EyeColor,
  type FaceParams,
  type FacialHair,
  type HairColor,
  type HairStyle,
  type Presentation,
  type SavedFace,
} from "./lib/face";
import { renderPortrait } from "./lib/portrait";

export function App() {
  const [seed, setSeed] = useState(7);
  const [params, setParams] = useState<FaceParams>(FACE_DEFAULTS);
  const [prompt, setPrompt] = useState("vampire, long black hair, red eyes");
  const [name, setName] = useState("Night one");
  const [saved, setSaved] = useState<SavedFace[]>([]);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    setSaved(loadFaces());
  }, []);

  const remember = (next: SavedFace[]) => {
    setSaved(next);
    storeFaces(next);
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="kicker">Free face studio</p>
          <h1>Nocturne</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            onClick={() => {
              const next = seed + 1;
              setSeed(next);
              setParams(paramsFromSeed(next));
              setPhotoNote(null);
              setPhotoUrl(null);
            }}
          >
            Generate
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setParams(FACE_DEFAULTS);
              setPhotoNote(null);
              setPhotoUrl(null);
            }}
          >
            Reset
          </button>
        </div>
      </header>
      <p className="lede">
        Free 3D face studio. Pick a look, style the hair, type a prompt, save faces on this device.
      </p>
      <FaceStage params={params} />
      <p className="hint">Drag on the head to rotate.</p>

      <ChipRow label="Look">
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
      </ChipRow>
      <ChipRow label="Hair">
        {HAIR_STYLES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={params.hairStyle === item.id ? "" : "ghost"}
            onClick={() => setParams((current) => ({ ...current, hairStyle: item.id as HairStyle }))}
          >
            {item.label}
          </button>
        ))}
      </ChipRow>
      <ChipRow label="Colour">
        {HAIR_COLORS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={params.hairColor === item.id ? "" : "ghost"}
            onClick={() => setParams((current) => ({ ...current, hairColor: item.id as HairColor }))}
          >
            {item.label}
          </button>
        ))}
      </ChipRow>
      <ChipRow label="Face hair">
        {FACIAL_HAIR.map((item) => (
          <button
            key={item.id}
            type="button"
            className={params.facialHair === item.id ? "" : "ghost"}
            onClick={() => setParams((current) => ({ ...current, facialHair: item.id as FacialHair }))}
          >
            {item.label}
          </button>
        ))}
      </ChipRow>
      <ChipRow label="Eyes">
        {EYE_COLORS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={params.eyeColor === item.id ? "" : "ghost"}
            onClick={() => setParams((current) => ({ ...current, eyeColor: item.id as EyeColor }))}
          >
            {item.label}
          </button>
        ))}
      </ChipRow>

      <label className="prompt-block">
        <span className="panel-label">Prompt</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={2}
          placeholder="vampire woman, long red hair, pale, red eyes"
        />
      </label>
      <div className="chips">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setParams((current) => applyPrompt(prompt, current));
            setPhotoNote(null);
          }}
        >
          Apply prompt
        </button>
        <button
          type="button"
          className="ghost"
          disabled={photoBusy}
          onClick={() => {
            setPhotoBusy(true);
            setPhotoNote("Generating via FreeLLMAPI…");
            setPhotoUrl(null);
            void renderPortrait(params, prompt)
              .then((result) => {
                setPhotoUrl(result.imageUrl);
                setPhotoNote(`Photoreal · ${result.model}`);
              })
              .catch((error: unknown) => {
                setPhotoUrl(null);
                setPhotoNote(
                  error instanceof Error
                    ? error.message
                    : "Portrait failed. Is FreeLLMAPI running on port 3001?",
                );
              })
              .finally(() => setPhotoBusy(false));
          }}
        >
          {photoBusy ? "Generating…" : "Photoreal portrait"}
        </button>
      </div>
      {photoNote ? <p className="hint">{photoNote}</p> : null}
      {photoUrl ? (
        <div className="portrait-wrap">
          <img className="portrait" src={photoUrl} alt="Photoreal portrait" />
        </div>
      ) : null}

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

      <section className="saved">
        <h2>Saved faces</h2>
        <div className="save-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name this face"
          />
          <button
            type="button"
            onClick={() => {
              const entry: SavedFace = {
                id: `${Date.now().toString(36)}`,
                name: name.trim() || "Untitled",
                params,
                prompt,
                at: Date.now(),
              };
              remember([entry, ...saved].slice(0, 8));
            }}
          >
            Save face
          </button>
        </div>
        {saved.length === 0 ? (
          <p className="hint">Nothing kept yet. Saves stay on this device.</p>
        ) : (
          <ul className="saved-list">
            {saved.map((face) => (
              <li key={face.id}>
                <span>{face.name}</span>
                <span className="chips">
                  <button
                    type="button"
                    className="ghost compact"
                    onClick={() => {
                      setParams(face.params);
                      setPrompt(face.prompt);
                      setName(face.name);
                    }}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="ghost compact"
                    onClick={() => remember(saved.filter((item) => item.id !== face.id))}
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="footer-note">No account. No paywall. Source on GitHub.</p>
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="panel">
      <p className="panel-label">{label}</p>
      <div className="chips">{children}</div>
    </section>
  );
}
