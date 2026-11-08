# Nocturne for Android

The Android build packages the existing Vite/React/Three.js studio as local Capacitor assets. It does not replace the 3D editor with a web link.

## Build an APK

GitHub Actions runs **Android APK** on pushes, pull requests and manual dispatch. Download the `nocturne-android-debug` artifact from the completed workflow run. This is an unsigned-by-you debug APK for direct testing, not a Play Store release.

## Local Termux services

The studio itself is bundled in the APK. Photoreal generation still uses your existing FreeLLMAPI service, so the app can request that Termux start the services when needed.

Requirements:
- Termux installed from F-Droid (do not mix Termux builds/signatures from different sources).
- Your existing `~/freellmapi` checkout and its configured server environment.
- Your Nocturne checkout at `~/Nocturne`, with a real `FREELLMAPI_KEY` in its ignored `.env` file.
- Android permission for Termux's `com.termux.permission.RUN_COMMAND`. In Termux, enable **Allow external apps** in Settings, then grant the permission when Android offers it.

From Termux, run:

```bash
cd ~/Nocturne
bash scripts/install-termux-services.sh
```

The installer creates `~/.local/bin/nocturne-services`. The app's **Start services** action asks Termux to run it. It starts FreeLLMAPI on port 3001 (building its server first only if `server/dist/index.js` is absent) and the small loopback-only Nocturne auth proxy on port 4173. The proxy reads `FREELLMAPI_KEY` from Nocturne's server-side `.env`; the key is never compiled into the APK or sent to the WebView.

You can also run these manually in Termux:

```bash
~/.local/bin/nocturne-services start
~/.local/bin/nocturne-services status
~/.local/bin/nocturne-services stop
```

Logs are written to `~/.local/state/nocturne/`.

## Honest limitations

- Android cannot silently launch another app's services without the Termux integration and its permission. The first setup is a one-time user action.
- Services started by Termux are not guaranteed to survive Android force-stop, battery restrictions or device reboot. Start them again from Nocturne if needed.
- The app's 3D editor works from packaged assets. Portrait generation requires both local services and a configured FreeLLMAPI image model/key.
- No release keystore, Play Store signing, or publishing configuration is included.
