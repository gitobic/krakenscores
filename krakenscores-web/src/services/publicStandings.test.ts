import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Standing } from '../types'

const mocks = vi.hoisted(() => ({ standings: vi.fn(), getDocs: vi.fn() }))
vi.mock('./standings', () => ({ getStandingsByTournament: mocks.standings }))
vi.mock('../lib/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => name,
  where: (field: string, op: string, value: string) => ({ field, op, value }),
  query: (...args: unknown[]) => args,
  getDocs: mocks.getDocs,
}))
import { getFinalMatchesByTournament, loadStandingsSections } from './publicStandings'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const callbacks = () => ({
  standings: { ready: vi.fn(), failed: vi.fn() },
  results: { ready: vi.fn(), failed: vi.fn() },
})
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)) }

beforeEach(() => vi.resetAllMocks())

describe('public standings loading', () => {
  it('requests only final matches within the selected tournament', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] })
    await getFinalMatchesByTournament('published-tournament')
    expect(mocks.getDocs).toHaveBeenCalledWith([
      'matches',
      { field: 'tournamentId', op: '==', value: 'published-tournament' },
      { field: 'status', op: '==', value: 'final' },
    ])
  })

  it('delivers standings while results are still waiting on the network', async () => {
    const standings = deferred<Standing[]>()
    const results = deferred<{ docs: [] }>()
    mocks.standings.mockReturnValue(standings.promise)
    mocks.getDocs.mockReturnValue(results.promise)
    const sections = callbacks()
    loadStandingsSections('tournament', sections)
    standings.resolve([])
    await flush()
    expect(sections.standings.ready).toHaveBeenCalledWith([])
    expect(sections.results.ready).not.toHaveBeenCalled()
    results.resolve({ docs: [] })
    await flush()
    expect(sections.results.ready).toHaveBeenCalledWith([])
  })

  it('preserves standings when the recent-results request fails', async () => {
    mocks.standings.mockResolvedValue([])
    mocks.getDocs.mockRejectedValue(new Error('Network unavailable'))
    const sections = callbacks()
    loadStandingsSections('tournament', sections)
    await flush()
    expect(sections.standings.ready).toHaveBeenCalledWith([])
    expect(sections.results.failed).toHaveBeenCalledOnce()
    expect(sections.standings.failed).not.toHaveBeenCalled()
  })

  it('ignores late data and errors after navigating to a different tournament', async () => {
    const standings = deferred<Standing[]>()
    const results = deferred<{ docs: [] }>()
    mocks.standings.mockReturnValue(standings.promise)
    mocks.getDocs.mockReturnValue(results.promise)
    const sections = callbacks()
    const cancel = loadStandingsSections('old-tournament', sections)
    cancel()
    standings.resolve([]); results.reject(new Error('Permission denied'))
    await flush()
    for (const section of Object.values(sections)) {
      expect(section.ready).not.toHaveBeenCalled()
      expect(section.failed).not.toHaveBeenCalled()
    }
  })
})
