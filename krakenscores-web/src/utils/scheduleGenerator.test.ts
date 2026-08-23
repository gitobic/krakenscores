import { describe, expect, it } from 'vitest'
import { generateScheduleSlots } from './scheduleGenerator'

describe('schedule slot generation', () => {
  it('numbers simultaneous pools across 55-minute rounds', () => {
    const slots = generateScheduleSlots({
      date: '2026-10-10', startTime: '07:00',
      pools: [{ id: 'one', name: 'Pool 1' }, { id: 'two', name: 'Pool 2' }, { id: 'three', name: 'Pool 3' }],
      rounds: 2, firstMatchNumber: 1, intervalMinutes: 55, duration: 50, divisionId: 'division',
    })
    expect(slots).toHaveLength(6)
    expect(slots.map(slot => [slot.matchNumber, slot.poolName, slot.scheduledTime])).toEqual([
      [1, 'Pool 1', '07:00'], [2, 'Pool 2', '07:00'], [3, 'Pool 3', '07:00'],
      [4, 'Pool 1', '07:55'], [5, 'Pool 2', '07:55'], [6, 'Pool 3', '07:55'],
    ])
  })
})
