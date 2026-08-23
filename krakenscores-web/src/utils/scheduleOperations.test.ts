import { describe, expect, it } from 'vitest'
import type { Match, ScheduleBreak } from '../types'
import { applyScheduleChanges, moveOneMatch, shiftPoolMatches, validateScheduleChanges } from './scheduleOperations'

const match = (id: string, number: number, time: string, overrides: Partial<Match> = {}): Match => ({
  id, matchNumber: number, tournamentId: 't1', divisionId: 'd1', poolId: 'p1', scheduledDate: '2026-10-10',
  scheduledTime: time, duration: 55, darkTeamId: `dark-${id}`, lightTeamId: `light-${id}`,
  status: 'scheduled', roundType: 'pool', isSemiFinal: false, isFinal: false, createdAt: new Date(), updatedAt: new Date(), ...overrides,
} as Match)

describe('schedule operations', () => {
  it('moves one match without changing its permanent identity', () => {
    const original = match('stable-id', 12, '09:00')
    const proposed = applyScheduleChanges([original], moveOneMatch(original, '2026-10-11', '10:15', 'p2'))[0]
    expect(proposed).toMatchObject({ id: 'stable-id', matchNumber: 12, scheduledDate: '2026-10-11', scheduledTime: '10:15', poolId: 'p2' })
  })

  it('shifts the anchor and all later pool matches, including across midnight', () => {
    const matches = [match('early', 1, '08:00'), match('anchor', 2, '23:30'), match('later', 3, '23:55'), match('other-pool', 4, '23:55', { poolId: 'p2' })]
    expect(shiftPoolMatches(matches, 'anchor', 30)).toEqual([
      { matchId: 'anchor', poolId: 'p1', scheduledDate: '2026-10-11', scheduledTime: '00:00' },
      { matchId: 'later', poolId: 'p1', scheduledDate: '2026-10-11', scheduledTime: '00:25' },
    ])
  })

  it('reports pool, team, and break conflicts before committing', () => {
    const moving = match('moving', 1, '08:00', { darkTeamId: 'shared' })
    const fixed = match('fixed', 2, '10:00', { poolId: 'p2', darkTeamId: 'shared' })
    const occupied = match('occupied', 3, '10:00', { poolId: 'p1' })
    const scheduleBreak: ScheduleBreak = { id: 'b1', tournamentId: 't1', poolId: 'p1', scheduledDate: '2026-10-10', startTime: '10:20', endTime: '10:40', reason: 'Lunch', createdAt: new Date(), updatedAt: new Date() }
    const conflicts = validateScheduleChanges([moving, fixed, occupied], [scheduleBreak], moveOneMatch(moving, '2026-10-10', '10:00', 'p1'))
    expect(conflicts.map(conflict => conflict.message).join(' ')).toContain('same pool')
    expect(conflicts.map(conflict => conflict.message).join(' ')).toContain('same team')
    expect(conflicts.map(conflict => conflict.message).join(' ')).toContain('Lunch')
  })
})
