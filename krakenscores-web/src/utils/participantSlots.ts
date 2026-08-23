import type { Match, MatchParticipantSlot } from '../types/index'

export type MatchSide = 'dark' | 'light'

export function fixedTeamSlot(teamId: string): MatchParticipantSlot {
  return { source: 'team', teamId }
}

export function parseGroupSeed(value: string): MatchParticipantSlot | null {
  const match = value.trim().match(/^(\d+)\s*([A-Za-z][A-Za-z0-9_-]*)$/)
  if (!match) return null

  const rank = Number(match[1])
  if (!Number.isInteger(rank) || rank < 1) return null

  return { source: 'groupSeed', groupId: match[2].toUpperCase(), rank }
}

export function parseParticipantLabel(value: string, matches: Match[]): MatchParticipantSlot | null {
  const seed = parseGroupSeed(value)
  if (seed) return seed

  const outcome = value.trim().match(/^(winner|loser)\s*(?:of\s*)?(?:game\s*)?-?\s*(\d+)$/i)
  if (!outcome) return null

  const sourceMatch = matches.find(match => match.matchNumber === Number(outcome[2]))
  if (!sourceMatch) return null

  return {
    source: 'matchOutcome',
    matchId: sourceMatch.id,
    outcome: outcome[1].toLowerCase() as 'winner' | 'loser',
  }
}

export function participantLabel(slot: MatchParticipantSlot, matches: Match[] = []): string {
  if (slot.source === 'team') return ''
  if (slot.source === 'groupSeed') return `${slot.rank}${slot.groupId}`

  const sourceMatch = matches.find(match => match.id === slot.matchId)
  const sourceLabel = sourceMatch ? `Game ${sourceMatch.matchNumber}` : 'unknown game'
  return `${slot.outcome === 'winner' ? 'Winner' : 'Loser'} of ${sourceLabel}`
}

export function getParticipantSlot(match: Match, side: MatchSide): MatchParticipantSlot | null {
  const canonical = side === 'dark' ? match.darkParticipant : match.lightParticipant
  if (canonical) return canonical

  const teamId = side === 'dark' ? match.darkTeamId : match.lightTeamId
  if (teamId) return fixedTeamSlot(teamId)

  const label = side === 'dark' ? match.darkTeamLabel : match.lightTeamLabel
  return label ? parseGroupSeed(label) : null
}

export function referencedMatchIds(match: Match): string[] {
  return [match.darkParticipant, match.lightParticipant]
    .filter((slot): slot is Extract<MatchParticipantSlot, { source: 'matchOutcome' }> => slot?.source === 'matchOutcome')
    .map(slot => slot.matchId)
}

export function createsDependencyCycle(matchId: string, sourceMatchIds: string[], matches: Match[]): boolean {
  const matchesById = new Map(matches.map(match => [match.id, match]))

  const reachesEditedMatch = (sourceId: string, visited: Set<string>): boolean => {
    if (sourceId === matchId) return true
    if (visited.has(sourceId)) return false
    visited.add(sourceId)

    const source = matchesById.get(sourceId)
    return source ? referencedMatchIds(source).some(id => reachesEditedMatch(id, visited)) : false
  }

  return sourceMatchIds.some(sourceId => reachesEditedMatch(sourceId, new Set()))
}
