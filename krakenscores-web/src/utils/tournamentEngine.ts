import type { Match, MatchParticipantSlot, Team } from '../types/index'
import { calculateStandings } from './standingsCalculator'
import { participantLabel, referencedMatchIds } from './participantSlots'

export interface ParticipantAssignment {
  matchId: string
  darkTeamId: string
  lightTeamId: string
  darkTeamLabel?: string
  lightTeamLabel?: string
}

function winnerAndLoser(match: Match | undefined): { winnerId: string; loserId: string } | null {
  if (!match || match.status !== 'final' || match.darkTeamScore === undefined || match.lightTeamScore === undefined) return null
  if (!match.darkTeamId || !match.lightTeamId || match.darkTeamScore === match.lightTeamScore) return null
  return match.darkTeamScore > match.lightTeamScore
    ? { winnerId: match.darkTeamId, loserId: match.lightTeamId }
    : { winnerId: match.lightTeamId, loserId: match.darkTeamId }
}

function groupSeeds(teams: Team[], matches: Match[]): Map<string, string> {
  const seeds = new Map<string, string>()
  const groupIds = new Set(teams.map(team => team.bracket).filter((group): group is string => Boolean(group)))

  groupIds.forEach(groupId => {
    const groupTeams = teams.filter(team => team.bracket === groupId)
    const teamIds = new Set(groupTeams.map(team => team.id))
    const groupMatches = matches.filter(match =>
      match.roundType === 'pool' && teamIds.has(match.darkTeamId) && teamIds.has(match.lightTeamId)
    )
    calculateStandings(groupTeams, groupMatches).table.forEach(row => seeds.set(`${groupId}:${row.rank}`, row.teamId))
  })

  return seeds
}

function resolveSlot(slot: MatchParticipantSlot | undefined, matches: Match[], seeds: Map<string, string>): string {
  if (!slot) return ''
  if (slot.source === 'team') return slot.teamId
  if (slot.source === 'groupSeed') return seeds.get(`${slot.groupId}:${slot.rank}`) || ''

  const outcome = winnerAndLoser(matches.find(match => match.id === slot.matchId))
  if (!outcome) return ''
  return slot.outcome === 'winner' ? outcome.winnerId : outcome.loserId
}

export function resolveParticipantAssignments(matches: Match[], teams: Team[]): ParticipantAssignment[] {
  const resolved = matches.map(match => ({ ...match }))
  const seeds = groupSeeds(teams, resolved)

  for (let pass = 0; pass < resolved.length; pass++) {
    let changed = false
    resolved.forEach(match => {
      const darkTeamId = match.darkParticipant ? resolveSlot(match.darkParticipant, resolved, seeds) : match.darkTeamId
      const lightTeamId = match.lightParticipant ? resolveSlot(match.lightParticipant, resolved, seeds) : match.lightTeamId
      if (darkTeamId !== match.darkTeamId || lightTeamId !== match.lightTeamId) changed = true
      match.darkTeamId = darkTeamId
      match.lightTeamId = lightTeamId
    })
    if (!changed) break
  }

  return resolved.map(match => ({
    matchId: match.id,
    darkTeamId: match.darkTeamId,
    lightTeamId: match.lightTeamId,
    ...(match.darkParticipant && match.darkParticipant.source !== 'team' ? { darkTeamLabel: participantLabel(match.darkParticipant, resolved) } : {}),
    ...(match.lightParticipant && match.lightParticipant.source !== 'team' ? { lightTeamLabel: participantLabel(match.lightParticipant, resolved) } : {}),
  }))
}

export function downstreamMatchIds(sourceMatchIds: string[], matches: Match[]): string[] {
  const found = new Set<string>()
  const queue = [...sourceMatchIds]
  while (queue.length > 0) {
    const sourceId = queue.shift()!
    matches.forEach(match => {
      if (!found.has(match.id) && referencedMatchIds(match).includes(sourceId)) {
        found.add(match.id)
        queue.push(match.id)
      }
    })
  }
  return [...found]
}

export function changedParticipantMatchIds(matches: Match[], assignments: ParticipantAssignment[]): string[] {
  const assignmentsById = new Map(assignments.map(assignment => [assignment.matchId, assignment]))
  return matches
    .filter(match => {
      const assignment = assignmentsById.get(match.id)
      return assignment && (assignment.darkTeamId !== match.darkTeamId || assignment.lightTeamId !== match.lightTeamId)
    })
    .map(match => match.id)
}
