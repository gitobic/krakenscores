import type { Club, Team } from '../types/index'

export type TeamLookupResult =
  | { status: 'found'; team: Team }
  | { status: 'ambiguous'; teams: Team[] }
  | { status: 'notFound' }

const normalized = (value: string) => value.trim().toLocaleLowerCase()

export function teamPublicName(team: Team | undefined, club?: Club): string {
  return team?.name.trim() || club?.name.trim() || 'TBD'
}

export function teamCompactName(team: Team | undefined, club: Club | undefined, teams: Team[]): string {
  if (!team) return 'TBD'
  if (!club) return teamPublicName(team)

  const sameClubDivisionTeamIds = new Set(teams
    .filter(candidate => candidate.clubId === team.clubId && candidate.divisionId === team.divisionId)
    .map(candidate => candidate.id))
  return sameClubDivisionTeamIds.size > 1 ? teamPublicName(team, club) : club.abbreviation
}

export function resolveTeamIdentifier(
  identifier: string,
  divisionId: string,
  teams: Team[],
  clubs: Club[]
): TeamLookupResult {
  const value = normalized(identifier)
  const divisionTeams = teams.filter(team => team.divisionId === divisionId)
  const exactNameMatches = divisionTeams.filter(team => normalized(team.name) === value)

  if (exactNameMatches.length === 1) return { status: 'found', team: exactNameMatches[0] }
  if (exactNameMatches.length > 1) return { status: 'ambiguous', teams: exactNameMatches }

  const matchingClubIds = new Set(clubs
    .filter(club => normalized(club.abbreviation) === value || normalized(club.name) === value)
    .map(club => club.id))
  const clubTeams = divisionTeams.filter(team => matchingClubIds.has(team.clubId))

  if (clubTeams.length === 1) return { status: 'found', team: clubTeams[0] }
  if (clubTeams.length > 1) return { status: 'ambiguous', teams: clubTeams }
  return { status: 'notFound' }
}
