# Tournament publication and draft privacy

Firestore rules enforce the publication boundary, independently of the website.

- Anonymous visitors, ordinary signed-in users, and scorekeepers can read only published tournaments and their tournament-owned records.
- Administrators can read and manage drafts, including unassigned legacy records.
- Teams, pools, matches, schedule breaks, announcements, and standings require a `tournamentId` pointing to a tournament with `isPublished: true` for public access. Missing parents, missing publication flags, and unassigned records fail closed.
- Clubs and divisions remain public shared reference catalogs. Their existence is not private, but draft tournament membership is protected.
- Scorekeepers can update their existing permitted result/advancement fields and standings only for published tournaments. They cannot move a standings document from a draft to a published tournament.

Public tournament discovery must query `isPublished == true`. Child queries must constrain `tournamentId` to a published tournament. Firestore rules reject broad queries; they do not remove unauthorized records from a result set.

## Verification and release

Run `npm run check` and `npm run test:rules` from `krakenscores-web`. Rules tests cover public document reads, constrained and unconstrained queries, draft/missing/unassigned records, administrator access, staff writes, and publish/unpublish transitions.

Before publishing legacy tournaments, assign every referenced team and pool to the correct tournament. Public pages no longer load unassigned records as a fallback. The newly imported 2026 Nightmare on I-Drive records already have tournament assignments.

Deploy the updated frontend before the restrictive rules, with explicit authorization for both deployments. The frontend changes work with the old rules; the old frontend's broad queries will fail with the new rules. Use Hosting target `hosting:krakenscores` and deploy Firestore rules separately. Local changes alone do not protect the production database.

After deployment, verify anonymous public queries against a published tournament and denied reads against the 2026 draft. Unpublishing blocks subsequent server reads; it cannot retract information already downloaded while a tournament was public.
