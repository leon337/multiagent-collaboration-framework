#!/usr/bin/env bash
set -euo pipefail
APP="/home/leo/Projetos/gemini-live-studio"
URL="http://127.0.0.1:18371"
if ! curl --silent --fail --max-time 2 "$URL/api/status" > /dev/null 2>&1; then
  cd "$APP"
  nohup node "$APP/server.js" >> "$APP/server.log" 2>&1 < /dev/null &
  sleep 1
fi
if ! curl --silent --fail --max-time 3 "$URL/api/status" > /dev/null; then
  echo "Não foi possível iniciar o Gemini Live Studio. Verifique $APP/server.log" >&2
  exit 1
fi
xdg-open "$URL" > /dev/null 2>&1 &
echo "Gemini Live Studio: $URL"
