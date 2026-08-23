import type { Club, Match, Pool, ScheduleBreak, Team } from '../types/index'
import { createsDependencyCycle, referencedMatchIds } from './participantSlots'

export type SetupIssueSeverity = 'error' | 'warning'

export interface SetupIssue {
  severity: SetupIssueSeverity
  code: string
  message: string
  matchIds?: string[]
}

export interface TournamentSetupDraft {
  name: string
  startDate: string
  endDate: string
  defaultMatchDuration: number
  divisionIds: string[]
  clubs: Club[]
  teams: Team[]
  pools: Pool[]
  matches: Match[]
  breaks: ScheduleBreak[]
  minimumRestMinutes?: number
}

const minutesAt = (date: string, time: string) => new Date(`${date}T${time}:00`).getTime() / 60000

function participantTeamIds(match: Match): string[] {
  const ids = [match.darkParticipant, match.lightParticipant]
    .filter((slot): slot is Extract<NonNullable<typeof slot>, { source: 'team' }> => slot?.source === 'team')
    .map(slot => slot.teamId)
  if (!match.darkParticipant && match.darkTeamId) ids.push(match.darkTeamId)
  if (!match.lightParticipant && match.lightTeamId) ids.push(match.lightTeamId)
  return ids
}

export function validateTournamentSetup(draft: TournamentSetupDraft): SetupIssue[] {
  const issues: SetupIssue[] = []
  const add = (severity: SetupIssueSeverity, code: string, message: string, matchIds?: string[]) =>
    issues.push({ severity, code, message, ...(matchIds ? { matchIds } : {}) })

  if (!draft.name.trim()) add('error', 'tournament.name', 'Tournament name is required.')
  if (!draft.startDate || !draft.endDate) add('error', 'tournament.dates', 'Start and end dates are required.')
  else if (draft.endDate < draft.startDate) add('error', 'tournament.dates', 'End date cannot be before start date.')
  if (draft.defaultMatchDuration < 10) add('error', 'tournament.duration', 'Default match duration must be at least 10 minutes.')
  if (draft.divisionIds.length === 0) add('error', 'divisions.empty', 'Select at least one division.')

  const clubIds = new Set(draft.clubs.map(club => club.id))
  const teamIds = new Set(draft.teams.map(team => team.id))
  const poolIds = new Set(draft.pools.map(pool => pool.id))
  const matchIds = new Set(draft.matches.map(match => match.id))
  const matchNumbers = new Map<number, string[]>()

  draft.teams.forEach(team => {
    if (!clubIds.has(team.clubId)) add('error', 'team.club', `${team.name || 'Unnamed team'} references a missing club.`)
    if (!draft.divisionIds.includes(team.divisionId)) add('error', 'team.division', `${team.name || 'Unnamed team'} is assigned to an unselected division.`)
    if (!team.name.trim()) add('error', 'team.name', 'Every team needs a distinct public name.')
  })

  draft.matches.forEach(match => {
    matchNumbers.set(match.matchNumber, [...(matchNumbers.get(match.matchNumber) || []), match.id])
    if (!poolIds.has(match.poolId)) add('error', 'match.pool', `Game ${match.matchNumber} references a missing pool.`, [match.id])
    if (!draft.divisionIds.includes(match.divisionId)) add('error', 'match.division', `Game ${match.matchNumber} uses an unselected division.`, [match.id])
    if (match.scheduledDate < draft.startDate || match.scheduledDate > draft.endDate) {
      add('error', 'match.date', `Game ${match.matchNumber} falls outside the tournament dates.`, [match.id])
    }
    participantTeamIds(match).forEach(teamId => {
      if (!teamIds.has(teamId)) add('error', 'match.team', `Game ${match.matchNumber} references a missing team.`, [match.id])
    })
    const sources = referencedMatchIds(match)
    sources.forEach(sourceId => {
      if (!matchIds.has(sourceId)) add('error', 'match.source', `Game ${match.matchNumber} references a missing source match.`, [match.id])
    })
    if (createsDependencyCycle(match.id, sources, draft.matches)) {
      add('error', 'match.cycle', `Game ${match.matchNumber} creates a circular advancement dependency.`, [match.id])
    }
  })

  matchNumbers.forEach((ids, number) => {
    if (ids.length > 1) add('error', 'match.number', `Game number ${number} is used more than once.`, ids)
  })

  const scheduled = [...draft.matches].sort((a, b) => minutesAt(a.scheduledDate, a.scheduledTime) - minutesAt(b.scheduledDate, b.scheduledTime))
  for (let firstIndex = 0; firstIndex < scheduled.length; firstIndex++) {
    const first = scheduled[firstIndex]
    const firstStart = minutesAt(first.scheduledDate, first.scheduledTime)
    const firstEnd = firstStart + first.duration
    for (let secondIndex = firstIndex + 1; secondIndex < scheduled.length; secondIndex++) {
      const second = scheduled[secondIndex]
      const secondStart = minutesAt(second.scheduledDate, second.scheduledTime)
      if (secondStart >= firstEnd && secondStart - firstEnd >= (draft.minimumRestMinutes ?? 0)) break
      if (first.poolId === second.poolId && secondStart < firstEnd) {
        add('error', 'schedule.poolConflict', `Games ${first.matchNumber} and ${second.matchNumber} overlap in the same pool.`, [first.id, second.id])
      }
      const sharedTeam = participantTeamIds(first).find(teamId => participantTeamIds(second).includes(teamId))
      if (sharedTeam && secondStart < firstEnd) {
        add('error', 'schedule.teamConflict', `A team is scheduled in overlapping games ${first.matchNumber} and ${second.matchNumber}.`, [first.id, second.id])
      } else if (sharedTeam && secondStart - firstEnd < (draft.minimumRestMinutes ?? 30)) {
        add('warning', 'schedule.rest', `A team has less than ${draft.minimumRestMinutes ?? 30} minutes of rest between games ${first.matchNumber} and ${second.matchNumber}.`, [first.id, second.id])
      }
    }
  }

  draft.breaks.forEach(scheduleBreak => {
    const breakStart = minutesAt(scheduleBreak.scheduledDate, scheduleBreak.startTime)
    const breakEnd = minutesAt(scheduleBreak.scheduledDate, scheduleBreak.endTime)
    scheduled.filter(match => match.poolId === scheduleBreak.poolId).forEach(match => {
      const matchStart = minutesAt(match.scheduledDate, match.scheduledTime)
      const matchEnd = matchStart + match.duration
      if (matchStart < breakEnd && matchEnd > breakStart) {
        add('error', 'schedule.breakConflict', `Game ${match.matchNumber} overlaps the ${scheduleBreak.reason} break.`, [match.id])
      }
    })
  })

  return issues
}
