import { describe, expect, it } from 'vitest'
import type { Match, Team } from '../types/index'
import { calculateStandings } from '../utils/standingsCalculator'

const teams = ['A', 'B', 'C'].map(id => ({ id, name: id, clubId: id, divisionId: 'division' } as Team))
const match = (id: string, darkTeamId: string, lightTeamId: string, darkTeamScore: number, lightTeamScore: number): Match => ({
  id,
  tournamentId: 'tournament',
  divisionId: 'division',
  poolId: 'pool',
  matchNumber: Number(id),
  scheduledDate: '2026-10-10',
  scheduledTime: '10:00',
  duration: 55,
  darkTeamId,
  lightTeamId,
  darkTeamScore,
  lightTeamScore,
  status: 'final',
  roundType: 'pool',
  isSemiFinal: false,
  isFinal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('standings tie-break rules', () => {
  it('awards two points for a win and one for a preliminary draw', () => {
    const result = calculateStandings(teams, [match('1', 'A', 'B', 5, 5), match('2', 'A', 'C', 7, 4)])
    expect(result.table.find(row => row.teamId === 'A')).toMatchObject({ wins: 1, draws: 1, points: 3 })
    expect(result.table.find(row => row.teamId === 'B')).toMatchObject({ draws: 1, points: 1 })
  })

  it('uses head-to-head before overall goal differential for teams tied on points', () => {
    const result = calculateStandings(teams, [
      match('1', 'A', 'B', 5, 4),
      match('2', 'A', 'C', 1, 10),
      match('3', 'B', 'C', 8, 1),
    ])
    expect(result.table.map(row => row.teamId)).toEqual(['B', 'C', 'A'])
    expect(result.tiebreakerNotes?.some(note => note.includes('head-to-head'))).toBe(true)
  })
})
