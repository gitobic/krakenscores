# KrakenScores Repository Guidance

## Product mission

KrakenScores is a water polo tournament operations and spectator web app for Team Orlando Water Polo Club. It should let an administrator prepare a tournament, allow a minimally trained volunteer to enter scores, and let spectators follow schedules, scores, standings, and bracket advancement without creating an account.

The immediate target is the October 2026 tournament. Prioritize reliable Division, Team, Match, schedule, score, standings, and bracket workflows over speculative features or commercialization.

## Product principles

- Spectator access must remain public and require no login or account.
- Keep hosting and operating costs at or near zero for the current twice-yearly, low-traffic usage.
- Optimize administrative flows for a coach who is not highly technical and may provide a paper schedule, a rough Excel workbook, or a phone photo.
- Optimize score entry for volunteers who need a focused, low-risk interface with little training.
- Tournament-day changes such as delays, overtime, pool changes, team substitutions, and corrected scores are normal operations, not edge cases.
- Preserve the established colorblind-aware division colors and sufficient text/background contrast.
- Prefer clear tournament concepts and workflows over exposing underlying database structure.

## October 2026 priorities

Work in this order unless the user explicitly changes it:

1. Make the development baseline reproducible: tracked lockfile, pinned Node version, clean lint/type checks, tests, and CI.
2. Correct the tournament model: stable match identity, club/team variants, pool seeds, winner/loser dependencies, automatic advancement, and safe score corrections.
3. Simplify tournament setup: cloning, guided setup, canonical import/export, generated time slots, conflict validation, and preview before publishing.
4. Improve tournament-day operations: current/next games, fast score entry, schedule shifting, save state, and impact warnings.
5. Improve spectator presentation: connected brackets, now/next views, team finding/favorites without accounts, full team names, announcements, and automatic light/dark mode.

Defer fun statistics, billing, multi-tenant self-service, native mobile apps, and broad visual polish until the October-critical workflows are reliable.

## Tournament model

- A Tournament contains the participating Divisions, Teams, Pools, Matches, Schedule Breaks, Announcements, and standings.
- A Club can field multiple Teams in one Division. Examples include `Team Orlando Black` and `Team Orlando Blue`, or `Wolverines Blue` and `Wolverines Yellow`.
- Club identity and team identity must remain distinct. Do not display only the club abbreviation when that makes two opponents indistinguishable.
- A Division is an age/gender group. Not every tournament uses every standard division.
- A Match has a permanent Firestore document ID. `matchNumber` is an editable public display/order value and must not be used as durable relational identity.
- Either participant slot may come from a fixed Team, a group/pool seed, the winner of another Match, or the loser of another Match.
- The tournament format is hybrid: pool or round-robin play followed by seeded placement/elimination games. Do not assume one global single- or double-elimination bracket type.
- Finalizing or correcting a result can affect standings and downstream participant slots. Handle those effects atomically where practical and warn before invalidating downstream completed games.
- Pool/time and team-overlap conflicts must remain date-aware and duration-aware.

## Standard divisions

- 10u is mixed-gender.
- 12u and 14u default to mixed-gender but may be gender-specific.
- 16u and 18u are separated into Boys and Girls.
- Masters is separated into Men and Women when applicable.
- A tournament may use only a subset of these divisions.

Typical tournaments use three pools. Matches commonly occupy 50 minutes plus a 5-minute changeover, producing 55-minute start-time offsets. Smaller-course divisions (10u, 12u, and 14u) should generally remain in one pool to minimize equipment changes.

## Division colors

Preserve the established colorblind-aware mappings unless the user explicitly approves a redesign:

| Division | Color |
| --- | --- |
| 10u CoEd | `#F0E442` |
| 12u CoEd | `#8DD3C7` |
| 13u CoEd | `#CAB2D6` |
| 14u CoEd | `#E69F00` |
| 15u Boys | `#6A3D9A` |
| 16u Boys | `#56B4E9` |
| 16u Girls | `#CC79A7` |
| 18u Boys | `#D55E00` |
| 18u Girls | `#009E73` |
| Masters | `#0072B2` |
| Mens Open | `#B3DE69` |
| Womens Open | `#EE95A8` |
| First place | `#FFD700` |
| Second place | `#C0C0C0` |
| Third place | `#CD7F32` |

## Technology and repository layout

- Frontend: React 19, TypeScript, React Router, and Vite 7.
- Backend: Firebase Authentication and Cloud Firestore.
- Hosting: Firebase Hosting in project `krakenscores-prod`.
- Application directory: `krakenscores-web/`.
- Firebase configuration and security rules are at the repository root.
- Core TypeScript domain types are in `krakenscores-web/src/types/index.ts`.
- Firebase data operations are in `krakenscores-web/src/services/`.
- Public pages are in `krakenscores-web/src/pages/public/`.
- Administrative pages are in `krakenscores-web/src/pages/admin/`.

Keep domain logic out of large page components. Prefer testable pure functions and focused services/hooks. When a component grows beyond roughly 500 lines, consider extracting forms, tables, data loading, and domain behavior rather than continuing to expand it.

## Local development

Run frontend commands from `krakenscores-web/`:

```bash
npm ci
npm run dev
npm run lint
npm run build
```

The repository has a small Vitest unit suite and emulator-backed Firestore rules suite. Run `npm run check` for application quality gates and `npm run test:rules` where Java and the Firebase CLI are available. Add relevant tests for every behavior change.

Do not weaken lint, TypeScript, tests, or Firebase rules merely to make a check pass. Fix or explicitly document the underlying issue.

## Firebase and deployment safety

- `.env.local` and `.firebaserc` are gitignored and may contain project configuration. Never print, commit, paste, or expose their values.
- Never deploy Hosting, Firestore rules, Storage rules, indexes, or production data changes without explicit user authorization in the current task.
- When deployment is explicitly authorized, use the configured Hosting target: `firebase deploy --only hosting:krakenscores`.
- Prefer Firebase emulators or a clearly isolated test environment for rules and tournament replay testing.
- Preserve anonymous public reads required by spectators while ensuring only intended staff/admin roles can write.
- Treat score finalization, advancement, standings recalculation, and downstream corrections as integrity-sensitive operations.

## Git and change discipline

- Use `codex/`-prefixed branches unless the user requests another name.
- Preserve unrelated user changes and keep commits focused.
- Do not push directly to `main` unless the user explicitly requests it.
- Do not create or merge a pull request unless requested.
- Do not commit generated build output, environment files, Firebase local state, or credentials.

## Reference material

- `README.md`: public project overview and setup.
- `PRD.md`: original product requirements; treat completed-phase statements as historical rather than authoritative current status.
- `TECHNICAL_SPEC_FIREBASE.md`: original architecture specification; verify details against the current code and dependencies.
- `STYLE_GUIDE.md`: established interface and color guidance.
- `memory/`: historical development notes and tournament feedback.
- `/Users/tobic/Documents/krakenscores-referance`: historical source case, Coach workbook, published workbook export, and earlier project snapshot. Treat this folder as read-only unless the user explicitly requests changes there. Never expose its `.env.local` or `.firebaserc` values.

## Current known technical debt

- ESLint passes with zero errors and zero warnings.
- The production bundle is approximately 1.07 MB and needs measurement plus route-level splitting.
- The lockfile, Node pin, initial Vitest suite, and CI workflow are now present; test coverage remains minimal.
- Several page components remain large and combine data access, transformation, and rendering concerns.
- Head-to-head standings tie-breaking is not integrated.
- `feedsFrom` exists in the Match type and editor, but score finalization does not currently advance downstream teams.
- The bracket page groups playoff matches but does not render a connected bracket.
- `PRD.md` and `TECHNICAL_SPEC_FIREBASE.md` are historical design documents; current status is tracked in `OCTOBER_2026_READINESS.md` and `docs/DEVELOPMENT_BASELINE.md`.

Reconfirm these items after the baseline is made reproducible; do not assume historical counts remain exact.
