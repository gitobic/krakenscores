import { describe, expect, it } from 'vitest'
import type { Match } from '../types/index'
import { buildScorekeeperQueue } from './scorekeeperQueue'

const match = (id: string, time: string, status: Match['status'], duration = 55) => ({ id, matchNumber: Number(id), scheduledDate: '2026-10-10', scheduledTime: time, status, duration } as Match)

describe('scorekeeper queue', () => {
  it('separates active, upcoming, and recently final games', () => {
    const items = [
      { match: match('1', '08:00', 'final') },
      { match: match('2', '09:00', 'scheduled') },
      { match: match('3', '10:00', 'scheduled') },
      { match: match('4', '07:00', 'final') },
    ]
    const queue = buildScorekeeperQueue(items, new Date('2026-10-10T09:20:00'))
    expect(queue.current.map(item => item.match.id)).toEqual(['2'])
    expect(queue.next.map(item => item.match.id)).toEqual(['3'])
    expect(queue.recent.map(item => item.match.id)).toEqual(['1', '4'])
  })
})
