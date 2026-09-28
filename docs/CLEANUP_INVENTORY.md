# Cleanup inventory — 2026-09-28

This is a review list, not a deletion script. No tournament data, references, or chats were deleted during consolidation.

## Safe to remove when not in use

| Path | Reason / consequence |
| --- | --- |
| `krakenscores-web/node_modules/` (~328 MB) | Recreated by npm ci; stop dev tools first. Keeping it is convenient before the tournament. |
| `krakenscores-web/dist/` (~1.3 MB) | Recreated by npm run build; needed for deployment/preview. |
| `firestore-debug.log`, other `*-debug.log`, `.DS_Store` | Diagnostic/OS debris; preserve logs while investigating a failure. |
| `GEMINI.md` | Broken symlink to deleted CLAUDE.md; AGENTS.md is authoritative. |
| Root `2026 Nightmare on I-Drive Schedule.pdf` | Byte-identical to the PDF in `/Users/tobic/Documents/krakenscores-ref`; retain that reference copy. |
| `outputs/noid-coach-2026/*.png`, `*.ndjson`, `*.inspect.ndjson` | Generated workbook inspection/previews; keep the final xlsx and baseline source.json. |
| `outputs/coach-template-2031/*.inspect.ndjson` | Generated inspection output. |

## Archive first, then consider removal

- Root `2026 Trident Schedule-from_Coach.xlsx` and `2026-Trident-Cup-google-published.xlsx` match reference-folder copies byte for byte. They are tracked in Git; removing them should be a separate explicit cleanup commit after updating any references.
- REFACTORING_SUMMARY.md, STYLING_SYSTEM_SUMMARY.md, STYLING_MIGRATION_EXAMPLE.md: historical implementation notes. Prefer an archive folder if still useful; the current context file replaces them as onboarding material.
- PRD.md and TECHNICAL_SPEC_FIREBASE.md: historical requirements/design rationale. Keep or archive, not operational instructions.
- `exports/clubs.csv`, `exports/teams.csv`, `exports/matches-with-names.csv`: old snapshots, not known current exports. Keep a backup until their tournament and recovery value are confirmed.
- `outputs/coach-template-2031/Coach-Tournament-Template.xlsx`: older template; compare with the reference-folder template before deciding whether it is redundant.
- Older KrakenScores chats: archive after preserving decisions/artifacts. Keep “Create NOID 2026 tournament” available through the event because it contains the recent schedule history. This task did not archive or delete chats.

## Keep through the tournament

- `outputs/noid-coach-2026/2026 Nightmare on I-Drive - Coach Schedule.xlsx` and `source.json`: latest Coach handoff and comparison baseline.
- `outputs/noid-2026-import/`, `outputs/noid-2026-revision-0928/`, `outputs/noid-game110/`: before snapshots, write plans, validation and receipts; useful audit/recovery material. Do not blindly rerun their production scripts. Back these up privately; outputs are excluded from routine source commits.
- All documents in `/Users/tobic/Documents/krakenscores-ref`: historical source cases, current PDF and templates; read-only reference archive.
- `.firebase/rehearsal/` if present: mock tournament state. Removing it resets the rehearsal; other Firebase cache files are regenerable but do not delete the entire folder casually.
- `.env.local`, `.firebaserc`: ignored local configuration required for setup/deployment; keep private and backed up securely.
- `.git/`, source, tests, lockfile, `.nvmrc`, `.github/`, Firebase rules/indexes/config, scripts, current docs and memory index.

Ignoring a file does not back it up. GitHub source commits do not include live Firestore data, Auth accounts, local environment configuration, or ignored tournament artifacts.
