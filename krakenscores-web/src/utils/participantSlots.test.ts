import { describe, expect, it } from 'vitest'
import type { Match } from '../types/index'
import { createsDependencyCycle, getParticipantSlot, parseGroupSeed, parseParticipantLabel, participantLabel, referencedMatchIds } from './participantSlots'

const sourceMatch = {
  id: 'source-match-id',
  matchNumber: 52,
  darkTeamId: 'team-a',
  lightTeamId: 'team-b',
} as Match

describe('participant slots', () => {
  it('parses compact group seeds into explicit group and rank fields', () => {
    expect(parseGroupSeed(' 3 o ')).toEqual({ source: 'groupSeed', groupId: 'O', rank: 3 })
    expect(parseGroupSeed('Pool O third')).toBeNull()
  })

  it('renders match outcomes using the editable display number', () => {
    const slot = { source: 'matchOutcome', matchId: sourceMatch.id, outcome: 'winner' } as const

    expect(participantLabel(slot, [sourceMatch])).toBe('Winner of Game 52')
    expect(participantLabel(slot, [{ ...sourceMatch, matchNumber: 152 }])).toBe('Winner of Game 152')
    expect(slot.matchId).toBe('source-match-id')
  })

  it('resolves imported winner and loser labels to stable match IDs', () => {
    expect(parseParticipantLabel('Winner - 52', [sourceMatch])).toEqual({ source: 'matchOutcome', matchId: 'source-match-id', outcome: 'winner' })
    expect(parseParticipantLabel('Loser of game 52', [sourceMatch])).toEqual({ source: 'matchOutcome', matchId: 'source-match-id', outcome: 'loser' })
    expect(parseParticipantLabel('Winner 99', [sourceMatch])).toBeNull()
  })

  it('reads canonical slots first and supports fixed-team legacy records', () => {
    const legacyFixed = { darkTeamId: 'legacy-team' } as Match
    const canonical = {
      darkTeamId: 'resolved-team',
      darkParticipant: { source: 'matchOutcome', matchId: 'source-match-id', outcome: 'winner' },
    } as Match

    expect(getParticipantSlot(legacyFixed, 'dark')).toEqual({ source: 'team', teamId: 'legacy-team' })
    expect(getParticipantSlot(canonical, 'dark')).toEqual(canonical.darkParticipant)
    expect(referencedMatchIds(canonical)).toEqual(['source-match-id'])
  })

  it('detects direct and transitive dependency cycles', () => {
    const semifinal = { id: 'semi', darkParticipant: { source: 'matchOutcome', matchId: 'play-in', outcome: 'winner' } } as Match
    const final = { id: 'final', darkParticipant: { source: 'matchOutcome', matchId: 'semi', outcome: 'winner' } } as Match

    expect(createsDependencyCycle('play-in', ['semi'], [semifinal, final])).toBe(true)
    expect(createsDependencyCycle('play-in', ['final'], [semifinal, final])).toBe(true)
    expect(createsDependencyCycle('new-match', ['final'], [semifinal, final])).toBe(false)
  })
})
