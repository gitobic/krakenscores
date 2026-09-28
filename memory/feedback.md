---
name: Feedback and Preferences
description: Corrections and confirmed preferences from working sessions
type: feedback
---

**Export CSV buttons on every admin page**
Add export to every admin list page (Clubs, Teams, Matches). Format should match the bulk import format so data can be round-tripped. Confirmed approach: blue "⬇ Export CSV" button below the table.
**Why:** User needs to get data out easily — clubs export gives abbreviations needed for match import.
**How to apply:** Any new admin list page should include an export button from day one.

---

**Bulk import should use club abbreviations, not full team names**
Matches bulk import was updated to accept club abbreviations (same as Teams page) with full team name as fallback.
**Why:** Full team names are auto-generated and hard to know/type; club abbreviations are short and already used in the Teams import format.
**How to apply:** Use explicit team abbreviations as the primary lookup key; club abbreviations are only safe when unambiguous within the division/tournament. Never collapse same-club team variants. See docs/TEAM_IDENTITY.md.

---

**Always deploy to `hosting:krakenscores` target**
Use `firebase deploy --only hosting:krakenscores` — not `--only hosting`.
**Why:** Two hosting sites exist in the project; the default site is the legacy `-prod` URL.
**How to apply:** Every deploy command in this project.

---

**Division colors: Okabe-Ito colorblind-safe palette**
Colors were updated from the original set to the Okabe-Ito palette after user flagged that 13u/14u and 18u Boys/Masters were too similar under colorblindness.
**Why:** Tournament has colorblind participants/spectators.
**How to apply:** New divisions should use colors from the AGENTS.md color table. "Sync Standard Colors" button in admin/divisions updates existing Firestore records.

---

**Sync Standard Colors button**
Admin → Divisions page has a purple "Sync Standard Colors" button that updates existing Firestore division records to match the code's STANDARD_DIVISIONS palette. Use this after any color constant changes.
