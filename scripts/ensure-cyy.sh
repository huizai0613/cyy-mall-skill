#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[cyy-mall] %s\n' "$1"
}

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node.js 18+ first." >&2
  exit 1
fi

node_version="$(node --version)"
major="${node_version#v}"
major="${major%%.*}"
if [ "$major" -lt 18 ]; then
  echo "Node.js 18+ is required. Current version: $node_version" >&2
  exit 1
fi
log "Node.js $node_version"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found in PATH." >&2
  exit 1
fi

add_npm_global_bin_to_path() {
  npm_bin="$(npm bin -g 2>/dev/null || true)"
  if [ -z "$npm_bin" ]; then
    npm_prefix="$(npm config get prefix 2>/dev/null || true)"
    npm_bin="${npm_prefix%/}/bin"
  fi

  if [ -d "$npm_bin" ] && ! command -v cyy >/dev/null 2>&1; then
    case ":$PATH:" in
      *":$npm_bin:"*) ;;
      *)
        PATH="$npm_bin:$PATH"
        export PATH
        log "Added npm global bin to PATH for this process: $npm_bin"
        ;;
    esac
  fi
}

add_npm_global_bin_to_path

if ! command -v cyy >/dev/null 2>&1; then
  log "cyy not found; installing cyymall-cli globally with npm."
  npm install -g cyymall-cli
  add_npm_global_bin_to_path
else
  log "cyy found at $(command -v cyy)"
fi

if ! command -v cyy >/dev/null 2>&1; then
  echo "cyy is still not available after install. Check npm global bin directory in PATH." >&2
  exit 1
fi

log "cyy version $(cyy --version)"
log "Ready. Run 'cyy --help' for commands."
