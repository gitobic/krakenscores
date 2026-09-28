# KrakenScores current context

Last reconciled: 2026-09-28. Start here for a new work session, then read AGENTS.md and only the specialist document needed. This is repository knowledge, not a promise that every historical chat is loaded automatically.

## Purpose and priorities

Team Orlando Water Polo Club's twice-yearly tournament app. Spectators need no account. Keep costs near zero; prioritize dependable setup, scheduling, scoring, advancement, and corrections. Coach works from paper, photos, and Excel; volunteers need focused controls. Do not replatform or expand into commercialization for October.

## Current event

2026 Nightmare on I-Drive, October 2–4, 2026. The latest completed task, “Create NOID 2026 tournament,” reports the published schedule verified on September 28 with **64 games and 31 teams**, including conditional **Game 110**. This housekeeping review did not re-query production.

- Game 110: 10U championship tiebreaker, if needed; Team Orlando vs Orlando Thunder; Saturday October 3, 3:20 PM, Pool 3. It is a scoreable match, replacing the former reservation.
- G8 remains 10U; Saturday/Sunday lower PDF blocks mean Pool 3; G9 means Orlando Thunder Blue. G8 and the tiebreaker were originally provisional interpretations pending Coach confirmation; preserve the user's accepted schedule unless instructed otherwise.
- 18U Girls: Thunder Green removed; Patriot moved to H. H = Team Orlando Black, Orlando United, Patriot. J = Orlando Thunder Blue, NL Cayman, Team Orlando Blue.
- Latest Coach handoff: `outputs/noid-coach-2026/2026 Nightmare on I-Drive - Coach Schedule.xlsx`. Edit amber cells; preserve grey permanent IDs. Compare returned files against this baseline before applying changes.
- Reference folder now present: `/Users/tobic/Documents/krakenscores-ref`. Older notes spell it `krakenscores-referance`; use the existing folder and treat reference material as read-only.
- May 2026 Trident's 88-game fixture is historical rehearsal material, not the October schedule. 2030/2031 workbooks are earlier setup exercises.

## Implemented behavior

The source and readiness checklist include permanent match IDs; fixed/team, pool-seed, winner and loser slots; automatic advancement; correction impact previews; distinct same-club teams; tied-team mini-table standings; cloning and guided setup; import/export preview; schedule moves and shifts; volunteer score entry; connected public brackets; team search and device-local favorites; announcements; system/light/dark themes; route splitting.

Match numbers are editable labels, never relational keys. Preserve IDs when renumbering. Tournament formats are hybrid graphs. Default standings use 2/1/0 points, tied-team mini-table points and goal difference, then overall goal difference, goals scored, goals conceded, and name. Corrections can reopen completed descendants and clear affected scores. See the focused guides below before changing these behaviors.

Public queries are scoped to published tournaments. Current rules restrict draft records to admins; shared clubs/divisions remain public. Source changes and deployment status must be distinguished: a local rules file alone does not establish production protection. See TOURNAMENT_PUBLICATION.md for release ordering.

## Design and theme

Mobile-first, compact readable schedules, clear dark/light cap labels, full team names where abbreviations are ambiguous, system fonts, and touch-friendly controls. Preserve the exact division palette in AGENTS.md. Never replace the palette with colors sampled from Coach's spreadsheet.

Runtime theme source: `krakenscores-web/src/index.css` (`--ks-*` variables) and `src/contexts/ThemeContext.tsx`. Default follows the operating system; explicit light/dark preference is stored locally as `krakenscores.theme`. Light surfaces: #f9fafb / #ffffff; dark surfaces: #020617 / #0f172a; text: #111827 / #f8fafc. Shared sizing and legacy colors live in `src/styles/theme.ts`. Primary blue #2563eb; win green #16a34a; loss red #dc2626. Use `utils/colorContrast.ts` for contrasting division text; the old “always black text” style-guide rule is obsolete. STYLE_GUIDE.md remains a pattern reference, subordinate to current theme behavior and accessibility.

## Architecture and deployment

- React 19, TypeScript, React Router, Vite 7; Tailwind 4 plus shared CSS/inline styles.
- Firebase Auth for staff; Cloud Firestore for data; Firebase Hosting serves the built single-page app. Public routes do not wait for staff Auth.
- Source: `krakenscores-web/`; domain types: `src/types/index.ts`; services: `src/services/`; tests alongside logic and in `tests/firestore.rules.test.ts`.
- Production project: `krakenscores-prod`; Hosting target/site: `krakenscores`; live URL: https://krakenscores.web.app. Do not confuse the project ID with the public site name.
- `firebase.json` serves `krakenscores-web/dist` and rewrites routes to index.html. `.firebaserc` and `.env.local` are local, ignored configuration; never copy their values into docs or Git.
- Node 22 / npm 10; tracked lockfile; `npm ci`, then `npm run check` in the app directory. Rules: `npm run test:rules`, requiring Java and Firebase CLI. GitHub workflow: `.github/workflows/quality.yml`.
- With explicit deployment approval: build, return to repository root, then `firebase deploy --only hosting:krakenscores`. Hosting deployment does not deploy rules, indexes, or data. Those need separate explicit authorization.
- GA4 exists and is deferred after rendering; no new tag/stream is needed merely for a new tournament. The current tag is G-BRNTDD0BTQ in `krakenscores-web/index.html`; older chat references to G-0Y41XLFQSZ are stale.
- GitHub: https://github.com/gitobic/krakenscores. Use codex/ branches. GitHub pushes do not automatically deploy Firebase in the current quality workflow.

## Remaining release work

Reconcile the unchecked rehearsal/release items in OCTOBER_2026_READINESS.md: full 88-result rehearsal, volunteer exercise, delay/correction/substitution scenarios, agreed mobile performance target, and rollback verification. Recent targeted checks do not establish that the entire rehearsal is complete. Investigate reported login failures with exact screen/error and network context; see TOURNAMENT_OPERATIONS.md. Several large page components remain candidates for focused extraction.

## Knowledge map

- `OCTOBER_2026_READINESS.md`: delivery checklist and decisions.
- `docs/TOURNAMENT_OPERATIONS.md`: login, event preparation, recovery, deployment.
- `docs/CLEANUP_INVENTORY.md`: removable files and protected reference artifacts.
- `docs/DEVELOPMENT_BASELINE.md`: dated validation results.
- `docs/TOURNAMENT_PUBLICATION.md`: draft privacy and release sequence.
- `docs/GUIDED_TOURNAMENT_SETUP.md`, `docs/TEAM_IDENTITY.md`: setup and stable references.
- `docs/VOLUNTEER_SCOREKEEPER_GUIDE.md`: volunteer workflow.
- `docs/REHEARSAL_ENVIRONMENT.md`, `docs/TRIDENT_2026_TOURNAMENT_FORMAT.md`: isolated testing and historical fixture.
- PRD.md, TECHNICAL_SPEC_FIREBASE.md, REFACTORING_SUMMARY.md, STYLING_SYSTEM_SUMMARY.md and STYLING_MIGRATION_EXAMPLE.md: historical design material, not current completion status.

Update this summary when decisions change; update the readiness checklist with implementation work. Preserve receipts and source workbooks separately from short operational context. Old chats can be archived after their unique decisions and artifacts are saved; deleting chats is not needed for this repository-based workflow.
