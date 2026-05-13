---
name: Project Overview
description: KrakenScores app purpose, live URL, Firebase setup, and deployment commands
type: project
---

KrakenScores is a water polo tournament scoring/scheduling app for Team Orlando Water Polo Club. Replaces a manual Google Sheets system.

**Live URL:** https://krakenscores.web.app
**Firebase project:** krakenscores-prod (internal name; URL uses site ID "krakenscores")
**Repo:** git@github.com:gitobic/krakenscores.git
**Firebase credentials:** stored in `krakenscores-web/.env.local` (gitignored — must be created manually on new installs)

**Deploy commands:**
```bash
firebase login --reauth          # if CLI auth expires (happens after months of inactivity)
cd krakenscores-web && npm run build
cd .. && firebase deploy --only hosting:krakenscores
```
Note: Must use `hosting:krakenscores` target (not `hosting` alone) — two sites exist in project: `krakenscores` (active) and `krakenscores-prod` (default/legacy, ignore).

**Why:** Firebase CLI auth expired at start of session — reauth needed whenever picking up after long break.

**How to apply:** Always use `firebase deploy --only hosting:krakenscores` for deploys. If deploy fails with auth error, run `firebase login --reauth` first.
