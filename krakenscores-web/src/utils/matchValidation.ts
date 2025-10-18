import type { Match, ScheduleBreak, Pool, Team } from '../types/index'

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Check if a match number is already in use
 */
export function checkDuplicateMatchNumber(
  matchNumber: number,
  matches: Match[],
  excludeMatchId?: string
): Match | null {
  const duplicate = matches.find(
    m => m.matchNumber === matchNumber && m.id !== excludeMatchId
  )
  return duplicate || null
}

/**
 * Check for pool/date/time conflicts (overlapping time windows on the same date)
 */
export function checkPoolTimeConflict(
  poolId: string,
  scheduledDate: string,
  scheduledTime: string,
  duration: number,
  matches: Match[],
  excludeMatchId?: string
): Match | null {
  const currentStart = timeToMinutes(scheduledTime)
  const currentEnd = currentStart + duration

  const conflict = matches.find(m => {
    if (m.id === excludeMatchId) return false
    if (m.poolId !== poolId) return false
    if (m.scheduledDate !== scheduledDate) return false // Must be same date

    const existingStart = timeToMinutes(m.scheduledTime)
    const existingEnd = existingStart + m.duration

    // Check if time windows overlap
    return currentStart < existingEnd && currentEnd > existingStart
  })

  return conflict || null
}

/**
 * Check for team conflicts (team playing in two matches at same date/time)
 */
export function checkTeamConflict(
  darkTeamId: string,
  lightTeamId: string,
  scheduledDate: string,
  scheduledTime: string,
  matches: Match[],
  excludeMatchId?: string
): { conflict: Match; teamId: string } | null {
  const conflict = matches.find(m => {
    if (m.id === excludeMatchId) return false
    if (m.scheduledDate !== scheduledDate) return false // Must be same date
    if (m.scheduledTime !== scheduledTime) return false

    const conflictTeams = [m.darkTeamId, m.lightTeamId]
    const currentTeams = [darkTeamId, lightTeamId]

    return conflictTeams.some(teamId => currentTeams.includes(teamId))
  })

  if (!conflict) return null

  const conflictTeamId = [conflict.darkTeamId, conflict.lightTeamId]
    .find(teamId => [darkTeamId, lightTeamId].includes(teamId))

  return conflictTeamId ? { conflict, teamId: conflictTeamId } : null
}

/**
 * Check for schedule break conflicts (schedule breaks don't have dates - they apply to all days)
 */
export function checkScheduleBreakConflict(
  poolId: string,
  startTime: string,
  duration: number,
  breaks: ScheduleBreak[]
): ScheduleBreak | null {
  const matchStart = timeToMinutes(startTime)
  const matchEnd = matchStart + duration

  for (const scheduleBreak of breaks) {
    if (scheduleBreak.poolId !== poolId) continue

    const breakStart = timeToMinutes(scheduleBreak.startTime)
    const breakEnd = timeToMinutes(scheduleBreak.endTime)

    // Check if time windows overlap
    if (matchStart < breakEnd && matchEnd > breakStart) {
      return scheduleBreak
    }
  }

  return null
}

/**
 * Validate all match constraints
 * Returns error message if validation fails, null if valid
 */
export function validateMatch(
  formData: {
    matchNumber: number
    poolId: string
    scheduledDate: string
    scheduledTime: string
    duration: number
    darkTeamId: string
    lightTeamId: string
  },
  matches: Match[],
  pools: Pool[],
  teams: Team[],
  scheduleBreaks: ScheduleBreak[],
  excludeMatchId?: string
): string | null {
  // Check same team constraint
  if (formData.darkTeamId === formData.lightTeamId) {
    return 'Dark team and light team cannot be the same'
  }

  // Check duplicate match number
  const duplicateMatch = checkDuplicateMatchNumber(
    formData.matchNumber,
    matches,
    excludeMatchId
  )
  if (duplicateMatch) {
    return `Match number ${formData.matchNumber} is already assigned. Please use a different match number.`
  }

  // Check pool/date/time conflicts
  const poolTimeConflict = checkPoolTimeConflict(
    formData.poolId,
    formData.scheduledDate,
    formData.scheduledTime,
    formData.duration,
    matches,
    excludeMatchId
  )
  if (poolTimeConflict) {
    const conflictPool = pools.find(p => p.id === formData.poolId)
    const existingStart = poolTimeConflict.scheduledTime
    const existingEnd = minutesToTime(
      timeToMinutes(existingStart) + poolTimeConflict.duration
    )
    return `Pool "${conflictPool?.name}" is occupied on ${formData.scheduledDate} from ${existingStart} to ${existingEnd} (Match #${poolTimeConflict.matchNumber}). Your match overlaps with this. Please choose a different time, date, or pool.`
  }

  // Check team conflicts
  const teamConflict = checkTeamConflict(
    formData.darkTeamId,
    formData.lightTeamId,
    formData.scheduledDate,
    formData.scheduledTime,
    matches,
    excludeMatchId
  )
  if (teamConflict) {
    const conflictTeamName = teams.find(t => t.id === teamConflict.teamId)?.name
    return `Team "${conflictTeamName}" is already scheduled to play on ${formData.scheduledDate} at ${formData.scheduledTime} in Match #${teamConflict.conflict.matchNumber}. A team cannot play in two matches at the same time.`
  }

  // Check schedule break conflicts
  const breakConflict = checkScheduleBreakConflict(
    formData.poolId,
    formData.scheduledTime,
    formData.duration,
    scheduleBreaks
  )
  if (breakConflict) {
    const conflictPool = pools.find(p => p.id === formData.poolId)
    return `This match conflicts with a schedule break in "${conflictPool?.name}" from ${breakConflict.startTime} to ${breakConflict.endTime} (${breakConflict.reason}). Please choose a different time.`
  }

  return null
}
