#!/usr/bin/env bash
set -euo pipefail

rehearsal_root="$(cd "$(dirname "$0")/.." && pwd)"
emulator_data="$rehearsal_root/.firebase/rehearsal"
java_bin="$(brew --prefix openjdk@21 2>/dev/null)/bin"

if [[ ! -x "$java_bin/java" ]]; then
  echo "Java 21 is required. Install it with: brew install openjdk@21"
  exit 1
fi

export PATH="$java_bin:$PATH"
mkdir -p "$emulator_data"
cd "$rehearsal_root"

firebase emulators:start --project demo-krakenscores --only auth,firestore --import="$emulator_data" --export-on-exit="$emulator_data" &
emulator_pid=$!
cleanup() {
  kill "$emulator_pid" 2>/dev/null || true
  wait "$emulator_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in {1..60}; do
  if curl --silent http://127.0.0.1:8080 >/dev/null && curl --silent http://127.0.0.1:9099 >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl --silent http://127.0.0.1:8080 >/dev/null; then
  echo "Firebase emulators did not start."
  exit 1
fi

node scripts/seed-rehearsal.mjs
echo "App: http://127.0.0.1:5173"
echo "Emulator data viewer: http://127.0.0.1:4000"
npm --prefix krakenscores-web run dev:rehearsal
