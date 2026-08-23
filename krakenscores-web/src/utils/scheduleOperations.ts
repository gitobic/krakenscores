import type { Match, ScheduleBreak } from '../types'
import { checkPoolTimeConflict, checkScheduleBreakConflict, checkTeamConflict } from './matchValidation'

export interface ScheduleChange {
  matchId: string
  scheduledDate: string
  scheduledTime: string
  poolId: string
}

export interface ScheduleConflict {
  matchId: string
  message: string
}

const timestamp = (date: string, time: string) => Date.parse(`${date}T${time}:00Z`)

function dateAndTime(value: number): Pick<ScheduleChange, 'scheduledDate' | 'scheduledTime'> {
  const iso = new Date(value).toISOString()
  return { scheduledDate: iso.slice(0, 10), scheduledTime: iso.slice(11, 16) }
}

export function moveOneMatch(match: Match, scheduledDate: string, scheduledTime: string, poolId: string): ScheduleChange[] {
  return [{ matchId: match.id, scheduledDate, scheduledTime, poolId }]
}

export function shiftPoolMatches(matches: Match[], anchorMatchId: string, minutes: number): ScheduleChange[] {
  const anchor = matches.find(match => match.id === anchorMatchId)
  if (!anchor || !Number.isFinite(minutes) || minutes === 0) return []
  const anchorTime = timestamp(anchor.scheduledDate, anchor.scheduledTime)
  return matches
    .filter(match => match.poolId === anchor.poolId && timestamp(match.scheduledDate, match.scheduledTime) >= anchorTime)
    .sort((a, b) => timestamp(a.scheduledDate, a.scheduledTime) - timestamp(b.scheduledDate, b.scheduledTime))
    .map(match => ({
      matchId: match.id,
      poolId: match.poolId,
      ...dateAndTime(timestamp(match.scheduledDate, match.scheduledTime) + minutes * 60_000),
    }))
}

export function applyScheduleChanges(matches: Match[], changes: ScheduleChange[]): Match[] {
  const byId = new Map(changes.map(change => [change.matchId, change]))
  return matches.map(match => {
    const change = byId.get(match.id)
    return change ? { ...match, ...change, id: match.id } : match
  })
}

export function validateScheduleChanges(matches: Match[], breaks: ScheduleBreak[], changes: ScheduleChange[]): ScheduleConflict[] {
  const proposed = applyScheduleChanges(matches, changes)
  const changedIds = new Set(changes.map(change => change.matchId))
  const conflicts: ScheduleConflict[] = []
  const seen = new Set<string>()
  const add = (matchId: string, message: string) => {
    const key = `${matchId}:${message}`
    if (!seen.has(key)) conflicts.push({ matchId, message })
    seen.add(key)
  }

  proposed.filter(match => changedIds.has(match.id)).forEach(match => {
    const others = proposed.filter(other => other.id !== match.id)
    const poolConflict = checkPoolTimeConflict(match.poolId, match.scheduledDate, match.scheduledTime, match.duration, others)
    if (poolConflict) add(match.id, `Game ${match.matchNumber} overlaps Game ${poolConflict.matchNumber} in the same pool.`)
    const teamConflict = checkTeamConflict(match.darkTeamId, match.lightTeamId, match.scheduledDate, match.scheduledTime, others)
    if (teamConflict) add(match.id, `Game ${match.matchNumber} overlaps Game ${teamConflict.conflict.matchNumber} for the same team.`)
    const scheduleBreak = checkScheduleBreakConflict(match.poolId, match.scheduledDate, match.scheduledTime, match.duration, breaks)
    if (scheduleBreak) add(match.id, `Game ${match.matchNumber} overlaps ${scheduleBreak.reason}.`)
  })
  return conflicts
}
