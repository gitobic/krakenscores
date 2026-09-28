# Tournament operations and login

Reviewed 2026-09-28 for Nightmare on I-Drive, October 2–4.

## Which login is expiring?

**Firebase CLI / Google developer login:** used on the laptop for deployment and administrative scripts. Expiration stops those tools from working; it does not stop Firebase Hosting or sign spectators and scorekeepers out. Prior tournament tasks repeatedly needed this reauthorization. Use `firebase login --reauth` when required; verify access with a read-only `firebase projects:list`. Do not deploy just to test login. Organization account policies may shorten these sessions; no fixed renewal interval guarantees access all weekend.

**KrakenScores /login:** email/password staff login using the Firebase browser SDK. Code uses `getAuth(app)` with no custom inactivity timer or session-only persistence override. Firebase's normal browser default is local persistence where supported. ID tokens last about an hour, with refresh tokens supporting continued sessions; this does not imply hourly manual sign-in. Deleted/disabled accounts, changed credentials, revoked sessions, browser storage clearing, private browsing, and network failures can interrupt access.

One concrete diagnostic concern: AuthContext currently treats a failed Firestore role lookup as a public user. A temporary read/network failure can therefore appear to remove staff access without the Firebase user actually being signed out. This is a candidate for a tested recovery improvement, not a confirmed cause of the reported timeouts. No authentication behavior was changed during housekeeping.

Official references: [Firebase session lifecycle](https://firebase.google.com/docs/auth/admin/manage-sessions), [browser persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence), [Firebase CLI](https://firebase.google.com/docs/cli).

## Recommended event checks

1. **Thursday October 1:** verify the laptop's Firebase developer access; reauthorize if needed. Confirm recovery/MFA access, the correct project/site, the published schedule, and a retained schedule export. Rehearse staff login and save/finalize/correction in the isolated emulator, not by inventing production scores.
2. **Friday October 2, 30–60 minutes before the first game:** open https://krakenscores.web.app on every scoring device in a normal browser; sign in if required; confirm staff access, correct tournament, network, and battery. Check the public schedule in a separate signed-out browser. Keep a charged backup device and hotspot available.
3. **Saturday/Sunday, 30–60 minutes before play:** repeat access/network checks. Do not force sign-out of working devices. No scheduled hourly renewal is needed. Check laptop developer access each morning only if emergency deployment/data support may be needed.
4. During play, wait for saved confirmation; keep paper scores if connectivity fails. Never infer success from a number typed onscreen. Reconcile before entering delayed results.

If access fails: capture the exact error and whether it is the command-line tool or website; check connectivity; preserve unsaved scores; reload once online. If the account is still signed in but staff access is missing, have an administrator verify the admins/staff role record. Reauthenticate only the affected account/tool. Avoid password resets or token revocation during play unless required, since they can interrupt other devices.

## Release and rollback

Run app quality checks and emulator rules tests before a release. Obtain explicit authorization for each production target. For approved Hosting releases build in `krakenscores-web`, then run `firebase deploy --only hosting:krakenscores` from the root. If restrictive publication rules are part of a separately approved release, deploy the compatible frontend first; follow TOURNAMENT_PUBLICATION.md.

Record the Git commit, deployment time, Hosting release, and any separately deployed rules. Verify public schedule/standings and staff access without changing results. Retain the last known good Hosting release for a console rollback, subject to explicit approval. Hosting rollback does not roll back Firestore data or rules. Reverting to an older frontend may be incompatible with newer restrictive rules; assess both together. Preserve before/after data snapshots and never blindly replay an old import after scores have been entered.
