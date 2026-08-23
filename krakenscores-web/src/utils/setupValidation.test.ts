import { describe, expect, it } from 'vitest'
import type { Club, Match, Pool, Team } from '../types/index'
import { validateTournamentSetup, type TournamentSetupDraft } from './setupValidation'

const dated = { createdAt: new Date(), updatedAt: new Date() }
const club = { id: 'club', name: 'Team Orlando', abbreviation: 'TO', ...dated } as Club
const pool = { id: 'pool', tournamentId: 'tournament', name: '1', location: 'Main', defaultStartTime: '08:00', ...dated } as Pool
const team = (id: string) => ({ id, tournamentId: 'tournament', clubId: 'club', divisionId: 'division', name: id, bracket: 'A', ...dated } as Team)
const match = (id: string, number: number, time: string, darkTeamId: string, lightTeamId: string, poolId = 'pool') => ({
  id, tournamentId: 'tournament', divisionId: 'division', poolId, matchNumber: number,
  scheduledDate: '2026-10-10', scheduledTime: time, duration: 55,
  darkTeamId, lightTeamId, darkParticipant: { source: 'team', teamId: darkTeamId },
  lightParticipant: { source: 'team', teamId: lightTeamId }, status: 'scheduled', roundType: 'pool',
  isSemiFinal: false, isFinal: false, ...dated,
} as Match)

const draft = (matches: Match[]): TournamentSetupDraft => ({
  name: 'October Trident Cup', startDate: '2026-10-09', endDate: '2026-10-11',
  defaultMatchDuration: 55, divisionIds: ['division'], clubs: [club],
  teams: [team('A'), team('B'), team('C')], pools: [pool], matches, breaks: [], minimumRestMinutes: 30,
})

describe('tournament setup validation', () => {
  it('accepts a valid draft', () => {
    expect(validateTournamentSetup(draft([match('one', 1, '08:00', 'A', 'B'), match('two', 2, '09:25', 'A', 'C')]))).toEqual([])
  })

  it('reports duplicate numbers, pool overlap, team overlap, and insufficient rest', () => {
    const issues = validateTournamentSetup(draft([
      match('one', 1, '08:00', 'A', 'B'),
      match('two', 1, '08:30', 'A', 'C'),
      match('three', 3, '09:10', 'B', 'C'),
    ]))
    expect(issues.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'match.number', 'schedule.poolConflict', 'schedule.teamConflict', 'schedule.rest',
    ]))
  })

  it('reports missing sources and dependency cycles', () => {
    const first = match('first', 1, '08:00', 'A', 'B')
    const second = match('second', 2, '09:00', 'B', 'C')
    first.darkParticipant = { source: 'matchOutcome', matchId: 'second', outcome: 'winner' }
    second.darkParticipant = { source: 'matchOutcome', matchId: 'first', outcome: 'winner' }
    const missing = match('missing', 3, '10:00', 'A', 'C')
    missing.lightParticipant = { source: 'matchOutcome', matchId: 'not-found', outcome: 'loser' }

    const codes = validateTournamentSetup(draft([first, second, missing])).map(issue => issue.code)
    expect(codes).toContain('match.source')
    expect(codes).toContain('match.cycle')
  })
})
