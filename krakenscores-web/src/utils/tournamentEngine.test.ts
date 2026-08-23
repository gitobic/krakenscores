import { describe, expect, it } from 'vitest'
import type { Match, Team } from '../types/index'
import { trident2026Girls16uProgression } from '../test/fixtures/trident2026'
import { changedParticipantMatchIds, downstreamMatchIds, resolveParticipantAssignments } from './tournamentEngine'

const makeTeam = (id: string, bracket: string): Team => ({ id, clubId: `club-${id}`, divisionId: 'division', name: id, bracket } as Team)
const makeMatch = (id: string, matchNumber: number, overrides: Partial<Match> = {}): Match => ({
  id,
  tournamentId: 'tournament',
  divisionId: 'division',
  poolId: 'pool',
  matchNumber,
  scheduledDate: '2026-10-10',
  scheduledTime: '10:00',
  duration: 55,
  darkTeamId: '',
  lightTeamId: '',
  status: 'scheduled',
  roundType: 'placement',
  isSemiFinal: false,
  isFinal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('tournament participant resolution', () => {
  it('replays the complete May 2026 16u Girls progression graph', () => {
    const teams = ['F1', 'F2', 'F3', 'G1', 'G2', 'G3'].map(id => makeTeam(id, id[0]))
    const poolMatches = [
      makeMatch('f-1', 1, { roundType: 'pool', darkTeamId: 'F1', lightTeamId: 'F2', darkTeamScore: 9, lightTeamScore: 6, status: 'final' }),
      makeMatch('f-2', 2, { roundType: 'pool', darkTeamId: 'F1', lightTeamId: 'F3', darkTeamScore: 8, lightTeamScore: 4, status: 'final' }),
      makeMatch('f-3', 3, { roundType: 'pool', darkTeamId: 'F2', lightTeamId: 'F3', darkTeamScore: 7, lightTeamScore: 5, status: 'final' }),
      makeMatch('g-1', 4, { roundType: 'pool', darkTeamId: 'G1', lightTeamId: 'G2', darkTeamScore: 9, lightTeamScore: 6, status: 'final' }),
      makeMatch('g-2', 5, { roundType: 'pool', darkTeamId: 'G1', lightTeamId: 'G3', darkTeamScore: 8, lightTeamScore: 4, status: 'final' }),
      makeMatch('g-3', 6, { roundType: 'pool', darkTeamId: 'G2', lightTeamId: 'G3', darkTeamScore: 7, lightTeamScore: 5, status: 'final' }),
    ]
    const playoffScores = new Map([[52, [8, 5]], [54, [7, 6]], [69, [9, 7]], [72, [8, 6]]])
    const playoffs = trident2026Girls16uProgression.map(item => {
      const slot = (source: typeof item.dark) => source.type === 'seed'
        ? { source: 'groupSeed' as const, groupId: source.group, rank: source.rank }
        : { source: 'matchOutcome' as const, matchId: source.matchId, outcome: source.type === 'winnerOf' ? 'winner' as const : 'loser' as const }
      const scores = playoffScores.get(item.matchNumber)
      return makeMatch(item.id, item.matchNumber, {
        darkParticipant: slot(item.dark),
        lightParticipant: slot(item.light),
        ...(scores ? { darkTeamScore: scores[0], lightTeamScore: scores[1], status: 'final' as const } : {}),
      })
    })

    const assignments = resolveParticipantAssignments([...poolMatches, ...playoffs], teams)
      .filter(item => item.matchId.startsWith('trident-2026'))

    expect(assignments).toHaveLength(7)
    expect(assignments.every(item => item.darkTeamId && item.lightTeamId)).toBe(true)
    expect(assignments.find(item => item.matchId.endsWith('g84'))).toMatchObject({ darkTeamId: 'F1', lightTeamId: 'G1' })
    expect(assignments.find(item => item.matchId.endsWith('g88'))).toMatchObject({ darkTeamId: 'F2', lightTeamId: 'G2' })
  })

  it('resolves group seeds from final preliminary matches', () => {
    const teams = [makeTeam('F-one', 'F'), makeTeam('F-two', 'F'), makeTeam('G-one', 'G')]
    const poolMatch = makeMatch('pool-F', 1, { roundType: 'pool', darkTeamId: 'F-one', lightTeamId: 'F-two', darkTeamScore: 8, lightTeamScore: 5, status: 'final' })
    const seeded = makeMatch('seeded', 2, {
      darkParticipant: { source: 'groupSeed', groupId: 'F', rank: 1 },
      lightParticipant: { source: 'groupSeed', groupId: 'F', rank: 2 },
    })

    expect(resolveParticipantAssignments([poolMatch, seeded], teams).find(item => item.matchId === 'seeded')).toMatchObject({ darkTeamId: 'F-one', lightTeamId: 'F-two' })
  })

  it('resolves winner and loser chains using stable match IDs', () => {
    const teams = [makeTeam('A', 'F'), makeTeam('B', 'G'), makeTeam('C', 'F'), makeTeam('D', 'G')]
    const playIn = makeMatch('play-in-id', 52, { darkTeamId: 'A', lightTeamId: 'B', darkTeamScore: 6, lightTeamScore: 4, status: 'final' })
    const semifinal = makeMatch('semi-id', 69, {
      darkTeamId: 'C',
      darkParticipant: { source: 'team', teamId: 'C' },
      lightParticipant: { source: 'matchOutcome', matchId: 'play-in-id', outcome: 'winner' },
      darkTeamScore: 7,
      lightTeamScore: 8,
      status: 'final',
    })
    const final = makeMatch('final-id', 84, {
      darkParticipant: { source: 'matchOutcome', matchId: 'semi-id', outcome: 'winner' },
      lightParticipant: { source: 'team', teamId: 'D' },
    })

    const assignments = resolveParticipantAssignments([playIn, semifinal, final], teams)
    expect(assignments.find(item => item.matchId === 'semi-id')).toMatchObject({ lightTeamId: 'A' })
    expect(assignments.find(item => item.matchId === 'final-id')).toMatchObject({ darkTeamId: 'A', lightTeamId: 'D' })

    semifinal.matchNumber = 999
    expect(resolveParticipantAssignments([playIn, semifinal, final], teams).find(item => item.matchId === 'final-id'))
      .toMatchObject({ darkTeamId: 'A' })
  })

  it('identifies changed completed participants and all descendants after a correction', () => {
    const playIn = makeMatch('play-in', 52, { darkTeamId: 'A', lightTeamId: 'B', darkTeamScore: 4, lightTeamScore: 6, status: 'final' })
    const semifinal = makeMatch('semi', 69, { darkTeamId: 'C', lightTeamId: 'A', lightParticipant: { source: 'matchOutcome', matchId: 'play-in', outcome: 'winner' }, status: 'final', darkTeamScore: 8, lightTeamScore: 7 })
    const final = makeMatch('final', 84, { darkTeamId: 'C', lightTeamId: 'D', darkParticipant: { source: 'matchOutcome', matchId: 'semi', outcome: 'winner' } })

    const assignments = resolveParticipantAssignments([playIn, semifinal, final], [])
    expect(changedParticipantMatchIds([playIn, semifinal, final], assignments)).toContain('semi')
    expect(downstreamMatchIds(['play-in'], [playIn, semifinal, final])).toEqual(['semi', 'final'])
  })
})
