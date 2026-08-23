import { describe, expect, it } from 'vitest'
import { trident2026Girls16uProgression, trident2026SeedTierExamples } from './trident2026'

describe('Trident Cup 2026 progression fixtures', () => {
  it('references stable source match IDs that exist in the fixture', () => {
    const ids = new Set(trident2026Girls16uProgression.map(match => match.id))
    const dependencies = trident2026Girls16uProgression.flatMap(match => [match.dark, match.light])
      .filter(source => source.type === 'winnerOf' || source.type === 'loserOf')

    expect(dependencies).toHaveLength(8)
    dependencies.forEach(source => expect(ids.has(source.matchId)).toBe(true))
  })

  it('keeps dependency identity unchanged when display numbers change', () => {
    const semifinal = trident2026Girls16uProgression.find(match => match.matchNumber === 69)!
    const sourceBeforeRenumbering = semifinal.light
    const renumberedPlayIn = { ...trident2026Girls16uProgression[0], matchNumber: 152 }

    expect(renumberedPlayIn.id).toBe('trident-2026-g52')
    expect(sourceBeforeRenumbering).toEqual({ type: 'winnerOf', matchId: 'trident-2026-g52' })
  })

  it('represents seed-tier mini-leagues and direct placement crossovers without fake winner dependencies', () => {
    const sources = trident2026SeedTierExamples.flatMap(match => [match.dark, match.light])

    expect(sources.every(source => source.type === 'seed')).toBe(true)
  })
})
