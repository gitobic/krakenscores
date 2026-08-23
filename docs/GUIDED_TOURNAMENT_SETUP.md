# Guided Tournament Setup

Phase 2 replaces the current collection-by-collection workflow with one unpublished tournament workspace. The workflow is designed for an organizer translating Coach's paper, Excel, screenshot, or Google Sheet schedule—not for someone who understands the Firestore data model.

## Workflow

1. **Tournament** — name, dates, default 55-minute game slot, and an optional previous tournament to use as a template.
2. **Divisions** — select only the age/gender divisions participating in this event.
3. **Clubs and teams** — reuse clubs, then add one or more explicitly named teams per division (for example, `Team Orlando Black` and `Team Orlando Blue`).
4. **Groups and pools** — assign teams to preliminary groups and configure the physical pools in use.
5. **Schedule** — generate time slots, enter or import games, and configure fixed-team, group-seed, winner, and loser participant sources.
6. **Validate and preview** — review the complete public schedule and progression graph before any publish action is offered.

Setup always creates or edits a draft. Publishing remains a separate, deliberate action after preview.

The initial guided workflow supports creating missing clubs inline, entering multiple distinctly named teams per club/division, assigning preliminary group letters, configuring physical pools, and generating simultaneous pool slots in configurable rounds. The default cadence is 55 minutes. Each generated participant slot can be assigned a fixed team, group seed, winner of an earlier game, or loser of an earlier game. Only earlier games are offered as outcome sources, which prevents forward references and circular bracket paths. Friendly game-number labels are converted to preallocated document-ID dependencies during the atomic save.

An organizer can also load a previous tournament as an in-memory template. The clone reuses clubs; copies its selected divisions, distinctly named teams, group assignments, physical pools, schedule structure, and advancement graph; shifts each game by its day offset from the new start date; and remaps every team, pool, and match dependency to new document IDs. Scores, live status, standings, announcements, and publication state are deliberately not copied.

## Canonical draft boundary

The setup workspace owns one tournament and contains its selected division IDs, clubs referenced by its teams, tournament-scoped teams, tournament-scoped pools, matches, and schedule breaks. Existing legacy records remain readable, but all newly created teams and pools require a `tournamentId`.

The canonical import/export format will represent the same draft boundary rather than requiring separate team and match files. Human-friendly game numbers and labels are accepted at the import boundary, then normalized to stable IDs before Firestore writes.

## Validation policy

Errors block preview/publish readiness; warnings require review but may be accepted.

Blocking errors include:

- missing names, dates, divisions, clubs, teams, pools, or participant sources;
- duplicate public game numbers;
- games outside tournament dates;
- overlapping games in one physical pool;
- a team scheduled into overlapping games;
- games overlapping a configured pool break; and
- missing or circular winner/loser dependencies.

Warnings include insufficient rest between known fixed-team games. The initial default is 30 minutes and will be configurable. Future-team paths cannot always be proven conflict-free before preliminary results, so the preview will identify those as dependency risks rather than claiming certainty.

## Write strategy

Validation and preview operate on a pure in-memory draft. Firestore receives normalized records only after validation succeeds. Related records use preallocated document IDs and batched writes so team, pool, match, and dependency references cannot be partially remapped. Publishing is never part of the setup save batch.
