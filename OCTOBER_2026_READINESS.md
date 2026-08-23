# October 2026 Readiness Checklist

This is the canonical delivery checklist for preparing KrakenScores for the October 2026 tournament. Update it in the same commit as completed work so repository status stays accurate.

## Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete and verified
- `[!]` Blocked or requires a decision

## Phase 0 — Reproducible development baseline

**Status:** In progress

- [x] Establish working Git branch and GitHub push access.
- [x] Replace legacy `CLAUDE.md` with repository-level `AGENTS.md` guidance.
- [ ] Track `package-lock.json` and verify clean installation with `npm ci`.
- [ ] Pin Node.js 22 for contributors and CI.
- [ ] Add explicit `typecheck`, `test`, and combined `check` scripts.
- [ ] Reproduce and record the current ESLint errors and warnings.
- [ ] Reproduce and record the production build and bundle sizes.
- [ ] Fix ESLint errors; triage remaining warnings explicitly.
- [ ] Select and configure the automated test framework.
- [ ] Add a GitHub Actions workflow for install, lint, type-check, tests, and build.
- [ ] Establish a Firebase Emulator or isolated non-production test workflow.
- [ ] Review Firestore rules against public, scorekeeper, and admin roles.
- [ ] Remove or update stale dependency and phase documentation.

### Phase 0 exit criteria

- [ ] A fresh checkout succeeds with the documented Node version and `npm ci`.
- [ ] Lint, type-check, tests, and build pass locally and in CI.
- [ ] Development and test workflows do not require production writes.

## Phase 1 — Tournament engine and data integrity

**Status:** Not started

- [ ] Document each 2026 division's pool, seeding, placement, and advancement rules.
- [ ] Create representative test fixtures from the May 2026 tournament.
- [ ] Separate permanent match identity from editable `matchNumber` display/order.
- [ ] Model each participant slot as fixed team, pool seed, match winner, or match loser.
- [ ] Make club and team identity distinct throughout data loading and display.
- [ ] Support multiple same-club teams in one division without ambiguous labels.
- [ ] Implement pool/group seed resolution.
- [ ] Implement automatic winner and loser advancement when a match is finalized.
- [ ] Implement safe reopening or correction of a finalized result.
- [ ] Warn before a correction invalidates a downstream completed match.
- [ ] Define and implement the required standings tie-break rules.
- [ ] Make advancement and related updates atomic where practical.
- [ ] Add automated tests for advancement, corrections, standings, and conflicts.

### Phase 1 exit criteria

- [ ] Replaying the May 2026 results resolves all seed and winner/loser placeholders.
- [ ] Renumbering or moving a match does not break its dependencies.
- [ ] A corrected result produces predictable, tested downstream behavior.
- [ ] Same-club opponents display distinct team names.

## Phase 2 — Simplified tournament setup

**Status:** Not started

- [ ] Design a guided setup workflow around Coach's real source material.
- [ ] Add tournament cloning from a previous event.
- [ ] Select only the divisions participating in the new tournament.
- [ ] Add clubs with one or more division-specific teams.
- [ ] Assign teams to pool/group brackets.
- [ ] Generate configurable match slots with a 55-minute default cadence.
- [ ] Define one canonical import/export format.
- [ ] Provide import preview, normalization, and row-level validation errors.
- [ ] Resolve team references using explicit team abbreviations and safe fallbacks.
- [ ] Configure seed/winner/loser dependencies without raw database editing.
- [ ] Validate pool conflicts, team conflicts, breaks, and insufficient rest time.
- [ ] Provide a complete public preview before publishing.

### Phase 2 exit criteria

- [ ] A new tournament can be configured without several separate ad hoc imports.
- [ ] Exported data can be imported again without manual restructuring.
- [ ] Invalid or ambiguous rows are caught before Firestore writes.
- [ ] The administrator can preview the entire schedule and playoff flow before publishing.

## Phase 3 — Tournament-day operations

**Status:** Not started

- [ ] Redesign scorekeeper mode around current, next, and recently completed games.
- [ ] Provide large, clear dark/light score controls.
- [ ] Show unambiguous full team names for same-club teams.
- [ ] Show saving, saved, offline, and error states clearly.
- [ ] Finalize a match with a concise advancement summary.
- [ ] Reopen/correct a match with an impact preview.
- [ ] Move one match to a new time or pool safely.
- [ ] Shift a selected block or all later matches in one pool by N minutes.
- [ ] Re-run conflict validation before committing schedule changes.
- [ ] Verify scorekeeper permissions with emulator-backed rules tests.
- [ ] Write a short volunteer operating guide.

### Phase 3 exit criteria

- [ ] A new volunteer can learn score entry in approximately ten minutes.
- [ ] Common delay and correction scenarios can be handled without database access.
- [ ] Scorekeeper credentials cannot edit unrelated tournament configuration.

## Phase 4 — Spectator experience

**Status:** Not started

- [ ] Create a tournament-day home view with live, recent, and up-next games.
- [ ] Add quick team search and filtering.
- [ ] Allow local device favorites without an account.
- [ ] Render connected brackets and placement paths by division.
- [ ] Replace unresolved codes with actual teams as soon as results allow.
- [ ] Keep useful provisional labels visible before teams are known.
- [ ] Present delay and high-priority announcement banners prominently.
- [ ] Add automatic light/dark mode with a local manual override.
- [ ] Retain colorblind-aware division colors and validate contrast.
- [ ] Add route-level code splitting and measure bundle improvements.
- [ ] Test key public views at common phone sizes.

### Phase 4 exit criteria

- [ ] A spectator can find their team's next match in under ten seconds.
- [ ] Each division's path to first, second, and third place is understandable.
- [ ] Public pages remain usable without login, installation, or personal data.
- [ ] Mobile performance meets an agreed measured target.

## Phase 5 — October rehearsal and release readiness

**Status:** Not started

- [ ] Load a safe test copy of the May 2026 tournament.
- [ ] Replay all 88 results in chronological order.
- [ ] Verify standings, pool seeds, advancements, placements, and public labels.
- [ ] Simulate overtime and a pool-wide schedule delay.
- [ ] Simulate a pool change and team substitution.
- [ ] Correct a previously finalized result with downstream dependencies.
- [ ] Run a scorekeeper rehearsal with someone other than the developer.
- [ ] Test representative iPhone and Android viewport sizes.
- [ ] Record defects and repeat the rehearsal after fixes.
- [ ] Prepare a rollback and tournament-day support checklist.
- [ ] Obtain explicit user approval before any production deployment.
- [ ] Deploy only the explicitly approved Firebase targets.
- [ ] Perform a post-deployment smoke test without modifying tournament results.

### Phase 5 exit criteria

- [ ] All rehearsal-blocking defects are resolved or explicitly accepted.
- [ ] A volunteer has successfully operated the scorekeeper workflow.
- [ ] Production deployment and rollback steps are documented and verified.
- [ ] The October tournament owner approves release.

## Deferred roadmap

These items are intentionally outside October readiness unless the user reprioritizes them:

- [ ] Fun statistics and novelty views.
- [ ] Club-logo expansion beyond clearly useful placements.
- [ ] Native mobile applications.
- [ ] Commercial billing and one-time tournament purchases.
- [ ] Multi-tenant organization onboarding and self-service administration.
- [ ] Broad drag-and-drop scheduling beyond reliable targeted move/shift operations.

## Decisions log

Record consequential scope or domain decisions here so later work does not silently reverse them.

- **2026-08-22:** Continue with React, TypeScript, Vite, and Firebase; do not replatform for October.
- **2026-08-22:** Spectator access remains anonymous and account-free.
- **2026-08-22:** Treat tournament progression as a hybrid pool/seeding/placement graph rather than one universal bracket type.
- **2026-08-22:** Do not deploy or modify production without explicit authorization.
