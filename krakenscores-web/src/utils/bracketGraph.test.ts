import { describe, expect, it } from 'vitest'
import type { Match, Team } from '../types'
import { bracketColumns, bracketEdges, isProgressionMatch, matchBracketGroup, provisionalParticipantLabel } from './bracketGraph'

const makeMatch = (id: string, matchNumber: number, overrides: Partial<Match> = {}) => ({
  id, matchNumber, tournamentId: 't1', divisionId: 'd1', poolId: 'p1', scheduledDate: '2026-10-10', scheduledTime: '10:00', duration: 55,
  darkTeamId: '', lightTeamId: '', status: 'scheduled', roundType: 'placement', isSemiFinal: false, isFinal: false, createdAt: new Date(), updatedAt: new Date(), ...overrides,
} as Match)

describe('bracket graph', () => {
  it('keeps scheduled pool pairings visible before progression games begin', () => {
    const poolMatch = makeMatch('pool', 1, { roundType: 'pool', darkTeamId: 'a', lightTeamId: 'b' })
    const teams = [
      { id: 'a', bracket: 'A' },
      { id: 'b', bracket: 'A' },
    ] as Team[]

    expect(isProgressionMatch(poolMatch)).toBe(false)
    expect(matchBracketGroup(poolMatch, teams)).toBe('A')
  })

  it('recognizes configured playoff and placement progression', () => {
    expect(isProgressionMatch(makeMatch('semi', 2, { roundType: 'semi' }))).toBe(true)
    expect(isProgressionMatch(makeMatch('final', 3, { roundType: 'final' }))).toBe(true)
    expect(isProgressionMatch(makeMatch('placement', 4, { roundType: 'placement' }))).toBe(true)
  })

  it('places dependent games in later columns and exposes winner/loser edges', () => {
    const semi = makeMatch('semi', 69)
    const final = makeMatch('final', 84, { darkParticipant: { source: 'matchOutcome', matchId: 'semi', outcome: 'winner' } })
    const third = makeMatch('third', 88, { darkParticipant: { source: 'matchOutcome', matchId: 'semi', outcome: 'loser' } })
    expect(bracketColumns([semi, final, third]).map(column => column.map(match => match.id))).toEqual([['semi'], ['final', 'third']])
    expect(bracketEdges([semi, final, third]).map(edge => edge.outcome)).toEqual(['winner', 'loser'])
  })

  it('keeps a readable provisional label until a team resolves', () => {
    const source = makeMatch('semi', 69)
    const final = makeMatch('final', 84, { darkParticipant: { source: 'matchOutcome', matchId: 'semi', outcome: 'winner' } })
    expect(provisionalParticipantLabel(final, 'dark', [source, final])).toBe('Winner of Game 69')
  })

  it('understands legacy winner-of metadata', () => {
    const source = makeMatch('source', 52)
    const target = makeMatch('target', 69, { feedsFrom: { darkFrom: { type: 'winnerOf', value: 52 } } })
    expect(bracketEdges([source, target])).toMatchObject([{ sourceMatchId: 'source', targetMatchId: 'target', outcome: 'winner' }])
  })

  it('understands historical winner and loser display labels', () => {
    const source = makeMatch('source', 69)
    const final = makeMatch('final', 84, { darkTeamLabel: 'Winner - 69' })
    const third = makeMatch('third', 88, { lightTeamLabel: 'Loser of Game 69' })
    expect(bracketEdges([source, final, third]).map(edge => edge.outcome)).toEqual(['winner', 'loser'])
    expect(bracketColumns([source, final, third]).map(column => column.map(match => match.id))).toEqual([['source'], ['final', 'third']])
  })
})
