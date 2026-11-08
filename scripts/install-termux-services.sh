#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

NOCTURNE_DIR="${NOCTURNE_DIR:-$HOME/Nocturne}"
FREELLMAPI_DIR="${FREELLMAPI_DIR:-$HOME/freellmapi}"
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

if [ ! -f "$NOCTURNE_DIR/.env" ]; then
  echo "Missing $NOCTURNE_DIR/.env. Copy .env.example and add FREELLMAPI_KEY first."
  exit 1
fi
if [ ! -f "$FREELLMAPI_DIR/server/package.json" ]; then
  echo "FreeLLMAPI not found at $FREELLMAPI_DIR. Set FREELLMAPI_DIR if it lives elsewhere."
  exit 1
fi

cat > "$BIN_DIR/nocturne-services" <<'SCRIPT'
#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
NOCTURNE_DIR="${NOCTURNE_DIR:-$HOME/Nocturne}"
FREELLMAPI_DIR="${FREELLMAPI_DIR:-$HOME/freellmapi}"
RUN_DIR="$HOME/.local/state/nocturne"
mkdir -p "$RUN_DIR"

port_open() { (echo >/dev/tcp/127.0.0.1/"$1") >/dev/null 2>&1; }
start_one() {
  local name="$1" port="$2"; shift 2
  if port_open "$port"; then echo "$name already running on $port"; return; fi
  nohup "$@" >"$RUN_DIR/$name.log" 2>&1 </dev/null &
  echo $! > "$RUN_DIR/$name.pid"
}
stop_one() {
  local name="$1"
  if [ -f "$RUN_DIR/$name.pid" ]; then
    local pid; pid="$(cat "$RUN_DIR/$name.pid")"
    if kill -0 "$pid" 2>/dev/null; then kill "$pid" || true; fi
    rm -f "$RUN_DIR/$name.pid"
  fi
}
case "${1:-start}" in
  start)
    if ! port_open 3001; then
      if [ ! -f "$FREELLMAPI_DIR/server/dist/index.js" ]; then
        (cd "$FREELLMAPI_DIR" && npm run build:server)
      fi
      start_one freellmapi 3001 bash -lc "cd '$FREELLMAPI_DIR' && npm run start -w server"
    fi
    if ! port_open 4173; then
      start_one nocturne-proxy 4173 bash -lc "cd '$NOCTURNE_DIR' && node scripts/mobile-proxy.mjs"
    fi
    sleep 2
    port_open 3001 && echo "FreeLLMAPI: listening" || echo "FreeLLMAPI: not ready (see $RUN_DIR/freellmapi.log)"
    port_open 4173 && echo "Nocturne proxy: listening" || echo "Nocturne proxy: not ready (see $RUN_DIR/nocturne-proxy.log)"
    ;;
  stop)
    stop_one nocturne-proxy
    stop_one freellmapi
    echo "Stop requested. Existing services not launched by this script were left untouched."
    ;;
  status)
    port_open 3001 && echo "FreeLLMAPI: listening" || echo "FreeLLMAPI: stopped"
    port_open 4173 && echo "Nocturne proxy: listening" || echo "Nocturne proxy: stopped"
    ;;
  *) echo "Usage: nocturne-services start|stop|status"; exit 2 ;;
esac
SCRIPT
chmod 700 "$BIN_DIR/nocturne-services"
echo "Installed $BIN_DIR/nocturne-services"
echo "Next: enable Termux RUN_COMMAND permission, then open Nocturne and tap Start services."
