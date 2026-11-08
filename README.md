# Nocturne — Faces

Free 3D face studio in the browser and on Android.

- Looks: Female, Male, Cyborg, Vampire
- Hair style and colour, facial hair, eye colour
- Shape sliders, text prompt, generate and reset
- Save faces on this device
- Photoreal generation through FreeLLMAPI (local router)

## Run in a browser

```bash
git clone https://github.com/davealone69-gif/Nocturne.git
cd Nocturne
cp .env.example .env
# Edit .env and set FREELLMAPI_KEY (server-side only).
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

### Termux browser development

Run commands from inside the project directory:

```bash
cd ~
git clone https://github.com/davealone69-gif/Nocturne.git
cd Nocturne
cp .env.example .env
# Put your real FreeLLMAPI unified key in FREELLMAPI_KEY.
npm install
npm run dev
```

Do not run the npm commands from `~`; npm must be able to find this repository's `package.json`.

## Photoreal generation (FreeLLMAPI)

See the [FreeLLMAPI REST API documentation](https://github.com/tashfeenahmed/freellmapi/blob/main/docs/en/api/01-rest-api.md).

1. Run FreeLLMAPI locally, normally at `http://127.0.0.1:3001`.
2. Enable an image model under **Models → Image** and create a unified API key.
3. Put the key in the Nocturne server-side `.env` file as `FREELLMAPI_KEY`.
4. Start Nocturne. Its server-side proxy injects authentication; the browser client must not receive the secret.

Default image model: `@cf/black-forest-labs/flux-1-schnell`.

Never use `VITE_FREELLMAPI_KEY`. Vite-prefixed variables are exposed to browser code and are not suitable for secrets.

## Android APK

The Android app packages the existing React/Three.js studio using Capacitor. The studio assets are bundled in the APK; a Vite development server is **not** required after installation.

### Download the current debug APK

The Android workflow builds a debug APK on GitHub Actions:

- [Android APK workflow runs](https://github.com/davealone69-gif/Nocturne/actions/workflows/android-apk.yml)
- [Current implementation pull request](https://github.com/davealone69-gif/Nocturne/pull/1)

For the latest verified build recorded in this README update, download the `nocturne-android-debug` artifact from [workflow run 42465900730](https://github.com/davealone69-gif/Nocturne/actions/runs/42465900730).

**APK SHA-256**

```text
9f7e4c657322ec4d0ab40265d3c00732d4ee30a658cedeb02380632be4eb1662
```

This artifact was built successfully by CI. The workflow checked the APK archive, Android manifest requirements and APK signature. It is a debug-signed testing build, not a Play Store release. Android requires APKs to be signed even for local installation.

### First-time Termux setup

Photoreal generation uses your existing FreeLLMAPI installation in Termux. The APK does not contain FreeLLMAPI or your API key.

Requirements:

- Termux installed from F-Droid. Do not mix Termux installations signed by different sources.
- Existing FreeLLMAPI checkout at `~/freellmapi`, with its server environment configured.
- Nocturne checkout at `~/Nocturne`, with a real `FREELLMAPI_KEY` in its ignored `.env` file.
- Termux's `allow-external-apps = true` setting.
- Android's `com.termux.permission.RUN_COMMAND` permission granted to Nocturne.

In Termux, enable external command access:

```bash
mkdir -p ~/.termux
touch ~/.termux/termux.properties
sed -i '/^[[:space:]]*allow-external-apps[[:space:]]*=/d' ~/.termux/termux.properties
printf '\nallow-external-apps = true\n' >> ~/.termux/termux.properties
termux-reload-settings
```

This is security-sensitive: it allows apps that also hold the Android RUN_COMMAND permission to execute commands in Termux. Grant that Android permission only to an app build you trust.

Install the Nocturne Termux service launcher:

```bash
cd ~/Nocturne
bash scripts/install-termux-services.sh
```

Then open Android Settings and grant Nocturne the additional permission named **Run commands in Termux environment**. The path is generally:

```text
Settings → Apps → Nocturne → Permissions
→ Additional permissions → Run commands in Termux environment
```

Names and menu locations can vary by Android/One UI version.

### Start and stop services

In Nocturne, use **Start services**. The app asks Termux to run:

```text
~/.local/bin/nocturne-services
```

The launcher starts:

- FreeLLMAPI on port `3001`.
- Nocturne's loopback-only authentication proxy on port `4173`.

The proxy reads `FREELLMAPI_KEY` from the server-side Nocturne `.env`. The key is not compiled into the APK or sent to the WebView.

You can also control the services directly in Termux:

```bash
~/.local/bin/nocturne-services start
~/.local/bin/nocturne-services status
~/.local/bin/nocturne-services stop
```

Logs are stored under `~/.local/state/nocturne/`.

### Updating an installed debug APK

**Important:** GitHub-hosted CI runners may generate a different debug-signing certificate for different workflow runs. Android will reject an APK update when its signing certificate does not match the installed app's certificate.

If Android reports a signature/package conflict, do not immediately uninstall the existing app if you have saved faces or other local data. Uninstalling normally deletes app-local data. Export or otherwise preserve anything important before considering an uninstall.

A stable development signing key has not been configured for CI. Therefore, update compatibility between separately generated CI APKs is **not guaranteed**.

### Android verification status

Status at the time of this README update:

| Check | Status | Evidence |
|---|---|---|
| Android debug APK build | **REAL + VERIFIED** | [Successful CI run](https://github.com/davealone69-gif/Nocturne/actions/runs/42465900730) |
| APK archive integrity | **REAL + VERIFIED** | CI validation and independent archive check |
| Required manifest entries | **REAL + VERIFIED** | CI checked INTERNET, Termux RUN_COMMAND, package visibility and cleartext configuration |
| APK signature | **REAL + VERIFIED** | CI `apksigner verify` check |
| Install on a physical Android phone | **UNVERIFIED** | No device installation evidence yet |
| App launch and 3D editor runtime | **UNVERIFIED** | No physical-device runtime evidence yet |
| Termux permission and RUN_COMMAND execution | **UNVERIFIED** | Device-side permission/execution test still required |
| FreeLLMAPI and image-generation end-to-end flow | **UNVERIFIED** | Device-side service and real image-generation test still required |

A successful CI build is not proof that the app installs, launches or works on a physical phone. Do not mark the Android app fully verified until those device tests pass.

See [ANDROID.md](ANDROID.md) for the complete Android workflow and service setup details.

## Scripts

```bash
npm test        # portrait unit tests (mocked API)
npm run build
npm run dev
```

## Security

- Keep the real key in `FREELLMAPI_KEY` on the server/proxy side only.
- Do not use `VITE_FREELLMAPI_KEY`.
- Do not commit `.env`, API keys, private signing keys or credentials.

## License

Free to use. No account required.
