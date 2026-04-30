#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# teebox.command — double-click launcher for macOS
# Opens Teebox at http://localhost:8787 in your default browser.
# ---------------------------------------------------------------------------

DIR="$( cd "$( dirname "$0" )" && pwd )"
PORT="${PORT:-8787}"
URL="http://localhost:$PORT"

# Node 18+ check
if ! command -v node &>/dev/null; then
  echo ""
  echo "  ✖  Node.js not found."
  echo ""
  echo "  Install it from https://nodejs.org (LTS) and try again."
  echo ""
  read -rp "  Press Enter to close..."
  exit 1
fi

NODE_MAJ=$(node -e "process.stdout.write(String(process.version.match(/^v(\d+)/)[1]))")
if [ "$NODE_MAJ" -lt 18 ]; then
  echo ""
  echo "  ✖  Node.js $( node -v ) is too old. Teebox requires v18 or newer."
  echo ""
  echo "  Download the latest LTS from https://nodejs.org and try again."
  echo ""
  read -rp "  Press Enter to close..."
  exit 1
fi

# Kill any leftover server on the same port
if lsof -ti :"$PORT" &>/dev/null; then
  echo "  ⚠  Port $PORT is in use — restarting Teebox..."
  lsof -ti :"$PORT" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo ""
echo "  ⛳  Starting Teebox on $URL"
echo "      Close this window (or press Ctrl-C) to stop."
echo ""

# Start server, trap Ctrl-C / window close so node exits cleanly
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

node "$DIR/server/index.js" &
SERVER_PID=$!

# Wait for server to be ready (up to 5s)
for i in $(seq 1 10); do
  if curl -sf "$URL" -o /dev/null 2>/dev/null; then
    break
  fi
  sleep 0.5
done

# Open browser
open "$URL"

# Keep terminal open; server logs appear here
wait "$SERVER_PID"
