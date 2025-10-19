import { useState, useEffect } from 'react'
import type { Standing, Tournament, Division } from '../../types/index'
import { getStandingsByTournament, recalculateStandingsForDivision } from '../../services/standings'
import { getAllTournaments } from '../../services/tournaments'
import { getAllDivisions } from '../../services/divisions'

export default function Standings() {
  const [standings, setStandings] = useState<Standing[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [recalculating, setRecalculating] = useState<string | null>(null) // divisionId being recalculated

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Auto-select first tournament when tournaments load
    if (tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0].id)
    }
  }, [tournaments, selectedTournamentId])

  useEffect(() => {
    // Load standings when tournament changes
    if (selectedTournamentId) {
      loadStandings()
    }
  }, [selectedTournamentId])

  const loadData = async () => {
    try {
      const [tournamentsData, divisionsData] = await Promise.all([
        getAllTournaments(),
        getAllDivisions()
      ])
      setTournaments(tournamentsData)
      setDivisions(divisionsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStandings = async () => {
    if (!selectedTournamentId) return

    try {
      const standingsData = await getStandingsByTournament(selectedTournamentId)
      setStandings(standingsData)
    } catch (error) {
      console.error('Error loading standings:', error)
    }
  }

  const handleRecalculate = async (divisionId: string) => {
    setRecalculating(divisionId)
    try {
      await recalculateStandingsForDivision(divisionId)
      await loadStandings()
      alert('Standings recalculated successfully!')
    } catch (error) {
      console.error('Error recalculating standings:', error)
      alert('Failed to recalculate standings. Please try again.')
    } finally {
      setRecalculating(null)
    }
  }

  const getDivisionName = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId)
    return division?.name || 'Unknown'
  }

  const getDivisionColor = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId)
    return division?.colorHex || '#9ca3af'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading standings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-6">
          <a
            href="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            ← Back to Dashboard
          </a>
        </nav>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Standings</h1>
            <p className="text-gray-600 mt-1">View team standings by division</p>
          </div>
        </div>

        {/* Tournament Filter */}
        {tournaments.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Tournament
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Tournament</option>
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Standings by Division */}
        {!selectedTournamentId ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Please select a tournament to view standings
          </div>
        ) : standings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No standings available. Standings are calculated automatically when matches are finalized.
          </div>
        ) : (
          <div className="space-y-8">
            {standings.map(standing => {
              const isRecalculating = recalculating === standing.divisionId

              return (
                <div key={standing.divisionId} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Division Header */}
                  <div
                    style={{
                      backgroundColor: getDivisionColor(standing.divisionId),
                      padding: '16px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {getDivisionName(standing.divisionId)}
                      </h2>
                      <p style={{ fontSize: '13px', color: '#6b7280' }}>
                        Last updated: {new Date(standing.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRecalculate(standing.divisionId)}
                      disabled={isRecalculating}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'white',
                        backgroundColor: isRecalculating ? '#9ca3af' : '#16a34a',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isRecalculating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: isRecalculating ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isRecalculating) e.currentTarget.style.backgroundColor = '#15803d'
                      }}
                      onMouseLeave={(e) => {
                        if (!isRecalculating) e.currentTarget.style.backgroundColor = '#16a34a'
                      }}
                    >
                      {isRecalculating ? '⟳ Recalculating...' : '⟳ Recalculate'}
                    </button>
                  </div>

                  {/* Standings Table */}
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GP
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          W
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          L
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GF
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GA
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GD
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {standing.table.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                            No teams in this division have completed matches yet.
                          </td>
                        </tr>
                      ) : (
                        standing.table.map((teamStanding, index) => (
                          <tr key={teamStanding.teamId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {teamStanding.rank}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {teamStanding.teamName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {teamStanding.games}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {teamStanding.wins}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {teamStanding.losses}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {teamStanding.goalsFor}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {teamStanding.goalsAgainst}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                              {teamStanding.goalDiff > 0 ? '+' : ''}{teamStanding.goalDiff}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600">
                              {teamStanding.points}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Tiebreaker Notes */}
                  {standing.tiebreakerNotes && standing.tiebreakerNotes.length > 0 && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      borderTop: '1px solid #fbbf24',
                      padding: '12px 24px'
                    }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                        Tiebreaker Notes:
                      </p>
                      <ul style={{ fontSize: '12px', color: '#92400e', paddingLeft: '20px', margin: 0 }}>
                        {standing.tiebreakerNotes.map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
            <div><span className="font-medium">GP:</span> Games Played</div>
            <div><span className="font-medium">W:</span> Wins</div>
            <div><span className="font-medium">L:</span> Losses</div>
            <div><span className="font-medium">GF:</span> Goals For</div>
            <div><span className="font-medium">GA:</span> Goals Against</div>
            <div><span className="font-medium">GD:</span> Goal Difference</div>
            <div><span className="font-medium">Pts:</span> Points (2 per win)</div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p className="font-medium mb-1">Tiebreaker Order:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Total points (2 per win)</li>
              <li>Head-to-head record (future implementation)</li>
              <li>Goal difference</li>
              <li>Goals for</li>
              <li>Fewest goals against</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
