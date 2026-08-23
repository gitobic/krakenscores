# Local Tournament Rehearsal Environment

This sandbox is for mock tournament creation, scheduling, scoring, correction, and deletion. It uses the Firebase Authentication and Firestore emulators under the reserved project ID `demo-krakenscores`. It cannot write to `krakenscores-prod`.

## Start the sandbox

From the repository root:

```bash
./scripts/start-rehearsal.sh
```

The launcher starts:

- KrakenScores at `http://127.0.0.1:5173`
- Firebase Emulator UI at `http://127.0.0.1:4000`
- local Auth on port `9099`
- local Firestore on port `8080`

Sign in through `/login` with:

- Email: `admin@krakenscores.test`
- Password: `KrakenMock2026!`

These credentials exist only in the local emulator and are intentionally documented test data.

## Data behavior

- The sandbox starts with the standard divisions and one mock administrator.
- Create rehearsal tournaments as unpublished until the public preview is ready.
- Emulator data is stored under the gitignored `.firebase/rehearsal/` folder and restored on the next run.
- Stopping the launcher with Control-C exports the current emulator state.
- Production Firebase configuration remains untouched and is never printed by the launcher.
- A persistent **Local rehearsal · production protected** badge appears at the bottom of the app whenever emulator mode is active.

## Resetting later

The stored sandbox can be reset by removing only `.firebase/rehearsal/` while the launcher is stopped. That is destructive to mock data, so confirm the exact path before doing it.
