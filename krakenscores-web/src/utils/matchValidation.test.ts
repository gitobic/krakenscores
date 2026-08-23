import { describe, expect, it } from 'vitest'
import type { Match, ScheduleBreak } from '../types/index'
import {
  checkDuplicateMatchNumber,
  checkPoolTimeConflict,
  checkScheduleBreakConflict,
  minutesToTime,
  timeToMinutes,
} from './matchValidation'

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  tournamentId: 'tournament-1',
  divisionId: 'division-1',
  poolId: 'pool-1',
  matchNumber: 1,
  scheduledDate: '2026-10-10',
  scheduledTime: '09:00',
  duration: 55,
  darkTeamId: 'team-1',
  lightTeamId: 'team-2',
  status: 'scheduled',
  roundType: 'pool',
  isSemiFinal: false,
  isFinal: false,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
})

const makeBreak = (overrides: Partial<ScheduleBreak> = {}): ScheduleBreak => ({
  id: 'break-1',
  tournamentId: 'tournament-1',
  poolId: 'pool-1',
  scheduledDate: '2026-10-10',
  startTime: '10:00',
  endTime: '10:30',
  reason: 'Equipment change',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
})

describe('time helpers', () => {
  it('converts tournament slot times in both directions', () => {
    expect(timeToMinutes('07:55')).toBe(475)
    expect(minutesToTime(475)).toBe('07:55')
  })
})

describe('match scheduling validation', () => {
  it('scopes duplicate match numbers to a tournament', () => {
    const matches = [makeMatch()]

    expect(checkDuplicateMatchNumber(1, 'tournament-1', matches)?.id).toBe('match-1')
    expect(checkDuplicateMatchNumber(1, 'tournament-2', matches)).toBeNull()
    expect(checkDuplicateMatchNumber(1, 'tournament-1', matches, 'match-1')).toBeNull()
  })

  it('detects overlapping matches in the same pool on the same date', () => {
    const matches = [makeMatch()]

    expect(checkPoolTimeConflict('pool-1', '2026-10-10', '09:30', 55, matches)?.id).toBe('match-1')
  })

  it('allows adjacent slots and the same time on another date or pool', () => {
    const matches = [makeMatch()]

    expect(checkPoolTimeConflict('pool-1', '2026-10-10', '09:55', 55, matches)).toBeNull()
    expect(checkPoolTimeConflict('pool-1', '2026-10-11', '09:00', 55, matches)).toBeNull()
    expect(checkPoolTimeConflict('pool-2', '2026-10-10', '09:00', 55, matches)).toBeNull()
  })

  it('detects overlap with a break in the same pool and date', () => {
    const breaks = [makeBreak()]

    expect(checkScheduleBreakConflict('pool-1', '2026-10-10', '09:45', 30, breaks)?.id).toBe('break-1')
  })

  it('allows a match ending exactly when a break starts', () => {
    const breaks = [makeBreak()]

    expect(checkScheduleBreakConflict('pool-1', '2026-10-10', '09:05', 55, breaks)).toBeNull()
  })
})
