#!/usr/bin/env bash
# Recompila os launchers do Windows (precisa de Go 1.21+). Opcional: só se mudar launcher/*.go ou o ícone.
#   1) (opcional) node scripts/make_ico.js        -> launcher/app.ico
#   2) go install github.com/akavel/rsrc@latest   -> ícone embutido no .exe
set -euo pipefail
cd "$(dirname "$0")/../launcher"
RSRC="$(command -v rsrc || echo "$HOME/go/bin/rsrc")"
"$RSRC" -ico app.ico -arch amd64 -o rsrc_windows_amd64.syso
for name in "AI Engineer Study Tracker" "Fechar AI Engineer Study Tracker"; do
  GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-s -w -H=windowsgui" -o "../$name.exe" .
done
echo "ok: AI Engineer Study Tracker.exe e Fechar AI Engineer Study Tracker.exe"
