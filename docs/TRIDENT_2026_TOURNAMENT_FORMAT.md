# Trident Cup 2026 Tournament Format

This document records the tournament structures observed in the May 15–17, 2026 Trident Cup. It is evidence for the October 2026 tournament engine, not a universal rulebook.

## Sources and authority

The sources were inspected read-only on 2026-08-22:

1. The published Google Sheet is authoritative for final opponents and winners.
2. `2026-Trident-Cup-google-published.xlsx` preserves formulas, bracket labels, and layout, but many formula results are not cached in the downloaded file.
3. `2026 Trident Schedule-from_Coach.xlsx` is the original scheduling input.
4. `exports/matches-with-names.csv` records the names imported into KrakenScores.

Where these disagree, the published sheet wins. For example, the downloaded `Game_Scores` formula cache does not reliably align with the final schedule.

## Tournament-wide observations

- There were 88 games across three pools.
- Normal starts were separated by 55 minutes.
- Divisions were generally kept on a consistent course size: 18u Boys and Masters in Pool 1; 16u divisions and 18u Girls mainly in Pool 2; 10u, 12u, and 14u mainly in Pool 3.
- A Saturday Pool 3 break occupied the 4:10 PM slot.
- The tournament combined round robins, seed-based placement games, seed-tier mini-leagues, and a small elimination graph. It was neither one single-elimination nor one double-elimination tournament.
- Seed codes such as `1C` and `3O` mean a rank within a preliminary group. They are participant sources, not team IDs.
- Labels such as `Winner - 52` and `Loser - 54` mean outcome dependencies on a prior match. They must reference a stable match ID internally, even if the public game number changes.

## Division formats

| Division | Preliminary play | Placement/playoff structure |
| --- | --- | --- |
| 10u CoEd | Two teams played games 13 and 23. | No separate placement game was present. Orlando Thunder won both. |
| 12u CoEd | One four-team group (`B`), six-game round robin. | `1B` vs `2B` in game 67 determined first/second; `3B` vs `4B` in game 70 determined third/fourth. |
| 14u CoEd | Three three-team groups (`C`, `D`, `E`), each a round robin. | Teams entered three seed-tier mini-leagues: group winners played games 66, 75, 86; second-place teams played 61, 76, 87; third-place teams played 57, 64, 79. These are round robins within placement bands, not elimination rounds. |
| 16u Girls | Two three-team groups (`F`, `G`), each a round robin. | Games 52 (`2F` vs `3G`) and 54 (`2G` vs `3F`) were play-ins. Their winners faced `1F` and `1G` in semifinals 69 and 72. Game 73 matched the play-in losers for fifth/sixth, game 84 matched semifinal winners for first/second, and game 88 matched semifinal losers for third/fourth. |
| 16u Boys | Two four-team groups (`H`, `J`), each a six-game round robin. | Same-seed crossovers determined placement bands: game 78 (`1H` vs `1J`), 81 (`2H` vs `2J`), 82 (`3H` vs `3J`), and 85 (`4H` vs `4J`). |
| 18u Girls | One three-team group (`L`), three-game round robin. | No separate placement game was present. |
| 18u Boys | Three three-team groups (`M`, `N`, `O`), each a round robin. | Each seed tier formed another three-team mini-league. First-place seeds played games 56, 65, 83; second-place seeds played 50, 62, 74; third-place seeds played 47, 59, 71. |
| Masters | One five-team group (`P`), ten-game round robin. | No separate placement games were present. Draws occurred and must be supported. |

## Verified 16u Girls dependency graph

This is the representative elimination graph for model and advancement tests:

| Game | Dark participant source | Light participant source | Purpose |
| --- | --- | --- | --- |
| 52 | `2F` | `3G` | Play-in |
| 54 | `2G` | `3F` | Play-in |
| 69 | `1F` | Winner of game 52 | Semifinal |
| 72 | `1G` | Winner of game 54 | Semifinal |
| 73 | Loser of game 52 | Loser of game 54 | Fifth/sixth |
| 84 | Winner of game 69 | Winner of game 72 | First/second |
| 88 | Loser of game 69 | Loser of game 72 | Third/fourth |

The final published opponents show that these placeholders were resolved manually in 2026. KrakenScores must resolve them automatically.

## Model requirements derived from the evidence

- A participant slot must be one of: fixed team, group seed, winner of match, or loser of match.
- A match dependency must store the source match document ID, never only `matchNumber` or a text bracket label.
- `matchNumber` must remain editable without changing dependency resolution.
- Group identity and seed rank must be explicit enough to distinguish `1F` from `1G` in the same division.
- Placement games need a purpose or placement range; `roundType` alone cannot distinguish a semifinal, fifth-place game, seed-tier mini-league, or direct same-seed crossover.
- The engine must support both draws in preliminary/round-robin play and a decisive outcome where advancement requires a winner.
- Reopening a source result must identify every downstream slot and completed match affected by the correction.

## Implemented canonical participant shape

New or edited matches now store `darkParticipant` and `lightParticipant` as one of:

- `{ source: "team", teamId }`
- `{ source: "groupSeed", groupId, rank }`
- `{ source: "matchOutcome", matchId, outcome: "winner" | "loser" }`

`matchId` is the permanent Firestore document ID. The editor and bulk importer may display or accept a game number, but resolve it to that ID before writing. Existing records without these fields remain readable through `darkTeamId`, `lightTeamId`, labels, and the legacy `feedsFrom` shape. Editing such a record writes the canonical slots and removes obsolete source metadata where appropriate; no production migration is required for this compatibility step.

## Unresolved rules requiring tournament-owner confirmation

- The preliminary ranking tie-break order is not recoverable reliably from the workbook. The `16u Boys J` group, for example, contains a multi-team win tie.
- The policy for tied advancement or medal games (overtime, shootout, recorded tie, or manual winner) is not stated.
- Whether the two 10u games are intentionally a two-game series and how a 1–1 split is ranked is not stated.
- The final placement mapping for seed-tier mini-leagues must be confirmed, including whether preliminary results carry over or the placement mini-league starts fresh.
- Masters gender configuration is not explicit in the 2026 sheet and should not be inferred from the generic division name.
