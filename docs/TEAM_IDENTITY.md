# Club and Team Identity

A Club is the organization. A Team is one tournament/division entry belonging to that club. KrakenScores must never assume one club has only one team in a division.

Examples:

- Club: `Team Orlando Water Polo Club`; teams: `Team Orlando Black`, `Team Orlando Blue`.
- Club: `Wolverines`; teams: `Wolverines Blue`, `Wolverines Yellow`.

## Naming rules

- `Team.name` is the public, unambiguous team identity and may include a color or other variant.
- `Club.name` and `Club.abbreviation` identify the parent organization, not a particular team.
- Compact schedules may show the club abbreviation only when that club has exactly one team in the division.
- When a club has multiple teams in a division, compact and full views show `Team.name`.
- Bracket labels and unresolved participant sources remain labels such as `1F` or `Winner of Game 52`; they are not teams.

## Import and export rules

The canonical team CSV columns are:

```text
Club Abbreviation,Division Name,Team Name,Bracket
TO,Masters,Team Orlando Black,P
TO,Masters,Team Orlando Blue,P
WOLV,14u CoEd,Wolverines Blue,C
WOLV,14u CoEd,Wolverines Yellow,E
```

`Team Name` may be omitted when a club has one team in the division. It is required to distinguish multiple same-club teams. Team export includes this column so the data round-trips without collapsing variants.

Match import resolves an exact team name first. A club abbreviation or club name is accepted only when it identifies exactly one team in the selected division. Ambiguous identifiers are rejected with the exact team names the administrator can use.

Existing teams remain compatible because the distinction already exists structurally through `Team.id` and `Team.clubId`; no production migration was performed in this slice.
