import type { Club, Match, Team } from '../types'

export interface SpectatorMatch {
  match: Match
}

export interface SpectatorQueue<T extends SpectatorMatch> {
  live: T[]
  recent: T[]
  next: T[]
}

const startsAt = (match: Match) => new Date(`${match.scheduledDate}T${match.scheduledTime}:00`).getTime()

export function buildSpectatorQueue<T extends SpectatorMatch>(items: T[], now = new Date()): SpectatorQueue<T> {
  const nowMs = now.getTime()
  const ordered = [...items].sort((a, b) => startsAt(a.match) - startsAt(b.match) || a.match.matchNumber - b.match.matchNumber)
  return {
    live: ordered.filter(item => item.match.status === 'in_progress'),
    recent: ordered.filter(item => ['final', 'forfeit'].includes(item.match.status) && startsAt(item.match) <= nowMs).slice(-6).reverse(),
    next: ordered.filter(item => item.match.status === 'scheduled' && startsAt(item.match) >= nowMs).slice(0, 8),
  }
}

export function matchIncludesTeams(match: Match, teamIds: Set<string>): boolean {
  return teamIds.size === 0 || teamIds.has(match.darkTeamId) || teamIds.has(match.lightTeamId)
}

export function searchTeams(teams: Team[], clubs: Club[], query: string): Team[] {
  const value = query.trim().toLocaleLowerCase()
  if (!value) return []
  const clubById = new Map(clubs.map(club => [club.id, club]))
  return teams.filter(team => {
    const club = clubById.get(team.clubId)
    return [team.name, club?.name, club?.abbreviation].some(candidate => candidate?.toLocaleLowerCase().includes(value))
  }).sort((a, b) => a.name.localeCompare(b.name))
}
