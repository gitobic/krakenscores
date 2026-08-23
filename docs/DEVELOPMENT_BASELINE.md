# Development Baseline

Verified on 2026-08-22 with Node 22.23.2 and npm 10.9.8.

## Reproducibility

- `npm ci` succeeds from the tracked lockfile.
- npm reports zero known dependency vulnerabilities.
- `npm run typecheck` passes.
- `npm test` passes 6 scheduling-validation tests in 1 test file.
- `npm run build` passes.

## Lint

The initial baseline was 25 errors and 8 warnings. The errors were resolved without disabling the rules globally. Eight `react-hooks/exhaustive-deps` warnings remain in data-loading effects:

- Admin Announcements
- Admin Scorekeeper
- Admin Standings
- Public Announcements
- Public Brackets
- Public Master Schedule
- Public Standings
- Public Team Schedule

These warnings must be addressed through stable callbacks or effect-local loading logic; do not silence the rule globally.

## Production build

The 2026-08-22 build produced:

- JavaScript: 1,067.58 kB minified, 293.61 kB gzip
- CSS: 6.29 kB minified, 1.57 kB gzip
- HTML: 0.46 kB, 0.30 kB gzip

Vite reports that the JavaScript chunk exceeds 500 kB. Route-level splitting and chunk analysis remain required.

The build also reports that a dynamic Firestore import in `services/standings.ts` cannot create a separate chunk because Firestore is statically imported elsewhere. Remove that ineffective dynamic import during bundle cleanup.

## Dependency maintenance

The clean install reports that the resolved ESLint 9 release is unsupported. Plan a deliberate ESLint major-version upgrade with configuration compatibility verification; do not mix it into unrelated feature work.
