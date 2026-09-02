import type { Match, Pool, ScheduleBreak, Team } from '../types'

export function sortMatchesChronologically<T extends Pick<Match, 'scheduledDate' | 'scheduledTime' | 'matchNumber'>>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.scheduledDate.localeCompare(b.scheduledDate)
    || a.scheduledTime.localeCompare(b.scheduledTime)
    || a.matchNumber - b.matchNumber
  )
}

export function sortTeamsByName<T extends Pick<Team, 'name'>>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}

export function sortPoolsByName<T extends Pick<Pool, 'name'>>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}

export function sortBreaksChronologically<T extends Pick<ScheduleBreak, 'scheduledDate' | 'startTime'>>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.scheduledDate.localeCompare(b.scheduledDate)
    || a.startTime.localeCompare(b.startTime)
  )
}
