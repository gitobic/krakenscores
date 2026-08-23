import { describe, expect, it } from 'vitest'
import type { Club, Match, Team } from '../types'
import { buildSpectatorQueue, matchIncludesTeams, searchTeams } from './spectatorHome'

const match = (id: string, time: string, status: Match['status'], overrides: Partial<Match> = {}) => ({
  id, tournamentId: 't1', divisionId: 'd1', poolId: 'p1', matchNumber: Number(id), scheduledDate: '2026-10-10', scheduledTime: time,
  duration: 55, darkTeamId: 'a', lightTeamId: 'b', status, roundType: 'pool', isSemiFinal: false, isFinal: false,
  createdAt: new Date(), updatedAt: new Date(), ...overrides,
} as Match)

describe('spectator home', () => {
  it('builds live, recent, and next queues', () => {
    const items = [
      { match: match('1', '08:00', 'final') },
      { match: match('2', '09:00', 'in_progress') },
      { match: match('3', '10:00', 'scheduled') },
    ]
    const queue = buildSpectatorQueue(items, new Date('2026-10-10T09:30:00'))
    expect(queue.live.map(item => item.match.id)).toEqual(['2'])
    expect(queue.recent.map(item => item.match.id)).toEqual(['1'])
    expect(queue.next.map(item => item.match.id)).toEqual(['3'])
  })

  it('filters games by favorite teams', () => {
    expect(matchIncludesTeams(match('1', '08:00', 'scheduled'), new Set(['a']))).toBe(true)
    expect(matchIncludesTeams(match('1', '08:00', 'scheduled'), new Set(['c']))).toBe(false)
  })

  it('finds teams by team, club, or abbreviation', () => {
    const clubs = [{ id: 'c1', name: 'Team Orlando Water Polo Club', abbreviation: 'TOWPC' }] as Club[]
    const teams = [{ id: 'a', name: 'Team Orlando Blue', clubId: 'c1' }, { id: 'b', name: 'Wolverines Yellow', clubId: 'c2' }] as Team[]
    expect(searchTeams(teams, clubs, 'blue').map(team => team.id)).toEqual(['a'])
    expect(searchTeams(teams, clubs, 'towpc').map(team => team.id)).toEqual(['a'])
  })
})
