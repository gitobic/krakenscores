import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../hooks/usePublicStandings', () => ({
  usePublicStandings: () => ({
    tournaments: [], selectedTournamentId: '', setSelectedTournamentId: vi.fn(),
    standings: [], matches: [], divisions: [], teams: [], clubs: [], loading: true,
    error: '', standingsError: '', resultsError: '', standingsLoading: true, resultsLoading: true,
  }),
}))
vi.mock('../../components/layout/PublicNav', () => ({ default: () => <nav>Navigation</nav> }))
vi.mock('../../components/layout/PublicPageHero', () => ({ default: () => <h1>Standings</h1> }))
import PublicStandings from './PublicStandings'

describe('standings initial render', () => {
  it('shows navigation and page structure before any database request completes', () => {
    const html = renderToStaticMarkup(<PublicStandings />)
    expect(html).toContain('<nav>Navigation</nav>')
    expect(html).toContain('<h1>Standings</h1>')
    expect(html).toContain('Loading standings…')
    expect(html).toContain('Loading recent results…')
    expect(html).not.toContain('No standings available yet.')
    expect(html).not.toContain('No final results yet.')
    expect(html).not.toContain('There are no published tournaments')
  })
})
