import { describe, expect, it } from 'vitest'
import { parseSetupCsv } from './setupCsv'

const context = {
  pools: [{ key: 'pool', name: 'Pool 1' }], divisions: [{ key: 'division', name: '16u Girls' }],
  clubs: [{ key: 'orlando', name: 'Team Orlando', abbreviation: 'TO' }],
  teams: [{ key: 'black', name: 'Team Orlando Black', divisionId: 'division', clubKey: 'orlando' }, { key: 'blue', name: 'Team Orlando Blue', divisionId: 'division', clubKey: 'orlando' }], defaultDuration: 55,
}

describe('canonical setup CSV', () => {
  it('normalizes exact teams, seeds, and earlier-game outcomes', () => {
    const csv = `game_number,date,time,pool,division,dark,light,duration,round_type
1,2026-10-10,07:00,Pool 1,16u Girls,Team Orlando Black,2F,55,pool
2,2026-10-10,07:55,Pool 1,16u Girls,Winner of Game 1,TO: Team Orlando Blue,55,final`
    const result = parseSetupCsv(csv, context)
    expect(result.issues).toEqual([])
    expect(result.slots[0].darkParticipant).toEqual({ source: 'team', teamKey: 'black' })
    expect(result.slots[0].lightParticipant).toEqual({ source: 'groupSeed', groupId: 'F', rank: 2 })
    expect(result.slots[1].darkParticipant).toEqual({ source: 'matchOutcome', matchKey: 'csv-row-2', outcome: 'winner' })
    expect(result.slots[1].roundType).toBe('final')
  })

  it('reports ambiguous abbreviations and row-specific lookup errors', () => {
    const csv = `game_number,date,time,pool,division,dark,light,duration,round_type
1,2026-10-10,07:00,Pool 1,16u Girls,TO,Unknown Team,55,pool`
    const result = parseSetupCsv(csv, context)
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, field: 'dark', message: expect.stringContaining('ambiguous') }),
      expect.objectContaining({ row: 2, field: 'light', message: expect.stringContaining('does not match') }),
    ]))
  })
})
