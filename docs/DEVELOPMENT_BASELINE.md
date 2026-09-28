# Development Baseline

## Current verification — 2026-09-28

`npm run check` passed: lint, TypeScript, 70 tests across 18 files, and production build. Checks were repeated with the project-compatible Node 22.23.3 / npm 10.9.9 after an initial run on the machine default Node 26.10.0 / npm 11.19.1. This is not a fresh npm ci verification.

All 17 Firestore rules tests passed against demo-krakenscores using Java 21. On this Mac, prepend `/opt/homebrew/opt/node@22/bin:/opt/homebrew/opt/openjdk@21/bin` to PATH; the sandbox must allow local emulator ports.

The build is now split: entry JavaScript 238.21 kB (76.28 kB gzip), Firebase chunk 470.82 kB (140.20 kB gzip), plus route/shared chunks. These are individual chunk sizes, not total initial transfer. The old monolithic 1.07 MB warning is obsolete.

## Historical baseline — August 22


Verified on 2026-08-22 with Node 22.23.2 and npm 10.9.8.

## Reproducibility

- `npm ci` succeeds from the tracked lockfile.
- npm reports zero known dependency vulnerabilities.
- `npm run typecheck` passes.
- `npm test` passes 6 scheduling-validation tests in 1 test file.
- `npm run build` passes.

## Lint

The initial baseline was 25 errors and 8 warnings. ESLint now passes with zero errors and zero warnings. The data-loading effects use stable callbacks with explicit dependencies; no lint rules were disabled globally.

## Production build

The 2026-08-22 build produced:

- JavaScript: 1,067.58 kB minified, 293.61 kB gzip
- CSS: 6.29 kB minified, 1.57 kB gzip
- HTML: 0.46 kB, 0.30 kB gzip

Vite reports that the JavaScript chunk exceeds 500 kB. Route-level splitting and chunk analysis remain required.

The build also reports that a dynamic Firestore import in `services/standings.ts` cannot create a separate chunk because Firestore is statically imported elsewhere. Remove that ineffective dynamic import during bundle cleanup.

## Dependency maintenance

The clean install reports that the resolved ESLint 9 release is unsupported. Plan a deliberate ESLint major-version upgrade with configuration compatibility verification; do not mix it into unrelated feature work.

## Firebase rules tests

Run `npm run test:rules` from `krakenscores-web/`. The command uses Firebase project ID `demo-krakenscores`, starts only the local Firestore emulator, executes the rules suite, and shuts the emulator down. Firebase's `rules-unit-testing` environment is emulator-only and does not access production.

The Firestore emulator requires Java. GitHub Actions provides Java and runs the rules suite on every push and pull request. At the original baseline Java was unavailable on PATH. A later local installation is at /opt/homebrew/opt/openjdk@21/bin; see current verification above.

The initial suite contains 10 passing access-control tests. It was verified in [GitHub Actions run 32609613093](https://github.com/gitobic/krakenscores/actions/runs/32609613093).
