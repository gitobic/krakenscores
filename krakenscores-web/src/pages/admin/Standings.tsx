import { useState, useEffect } from 'react'
import type { Standing, Tournament, Division, Team, TeamStanding } from '../../types/index'
import { getStandingsByTournament, recalculateStandingsForDivision } from '../../services/standings'
import { getAllTournaments } from '../../services/tournaments'
import { getAllDivisions } from '../../services/divisions'
import { getAllTeams } from '../../services/teams'

export default function Standings() {
  const [standings, setStandings] = useState<Standing[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [teams, setTeams] = useState<Team[]>([])
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
      const [tournamentsData, divisionsData, teamsData] = await Promise.all([
        getAllTournaments(),
        getAllDivisions(),
        getAllTeams()
      ])
      setTournaments(tournamentsData)
      setDivisions(divisionsData)
      setTeams(teamsData)
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

  // Group team standings by bracket
  const groupByBracket = (teamStandings: TeamStanding[]): Map<string, TeamStanding[]> => {
    const groups = new Map<string, TeamStanding[]>()

    teamStandings.forEach(ts => {
      const team = teams.find(t => t.id === ts.teamId)
      const bracket = team?.bracket || 'No Bracket'

      if (!groups.has(bracket)) {
        groups.set(bracket, [])
      }
      groups.get(bracket)!.push(ts)
    })

    // Sort brackets alphabetically (No Bracket goes last)
    const sorted = new Map(
      Array.from(groups.entries()).sort(([a], [b]) => {
        if (a === 'No Bracket') return 1
        if (b === 'No Bracket') return -1
        return a.localeCompare(b)
      })
    )

    return sorted
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
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0
          }}>
            Standings
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginTop: '8px'
          }}>
            View team standings by division
          </p>
        </div>

        {/* Tournament Filter */}
        {tournaments.length > 0 && (
          <div style={{
            marginBottom: '24px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                whiteSpace: 'nowrap'
              }}>
                Tournament:
              </label>
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                style={{
                  flex: 1,
                  maxWidth: '400px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select Tournament</option>
                {tournaments.map(tournament => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>
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
                  {/* Division Header - Single Line */}
                  <div
                    style={{
                      backgroundColor: getDivisionColor(standing.divisionId),
                      padding: '12px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      flex: 1
                    }}>
                      {getDivisionName(standing.divisionId)}
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '12px', fontWeight: '400' }}>
                        Updated: {new Date(standing.updatedAt).toLocaleString()}
                      </span>
                    </h2>
                    <button
                      onClick={() => handleRecalculate(standing.divisionId)}
                      disabled={isRecalculating}
                      style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: isRecalculating ? '#6b7280' : '#16a34a',
                        backgroundColor: 'white',
                        border: isRecalculating ? '2px solid #9ca3af' : '2px solid #16a34a',
                        borderRadius: '6px',
                        cursor: isRecalculating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: isRecalculating ? 0.6 : 1,
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isRecalculating) {
                          e.currentTarget.style.backgroundColor = '#16a34a'
                          e.currentTarget.style.color = 'white'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isRecalculating) {
                          e.currentTarget.style.backgroundColor = 'white'
                          e.currentTarget.style.color = '#16a34a'
                        }
                      }}
                    >
                      {isRecalculating ? '⟳ Recalculating...' : '⟳ Recalculate'}
                    </button>
                  </div>

                  {/* Standings Tables Grouped by Bracket */}
                  {standing.table.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                      No teams in this division have completed matches yet.
                    </div>
                  ) : (
                    <>
                      {Array.from(groupByBracket(standing.table).entries()).map(([bracket, bracketTeams], bracketIndex) => (
                        <div key={bracket}>
                          {/* Bracket Header */}
                          {groupByBracket(standing.table).size > 1 && (
                            <div style={{
                              backgroundColor: '#f3f4f6',
                              padding: '8px 12px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#2563eb',
                              borderTop: bracketIndex > 0 ? '2px solid #e5e7eb' : 'none'
                            }}>
                              {bracket === 'No Bracket' ? 'Pool Play' : `Bracket ${bracket}`}
                            </div>
                          )}

                          {/* Bracket Table */}
                          <table className="min-w-full" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f9fafb' }}>
                              <tr>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                                  Rank
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                                  Team
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                                  GP
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                                  W
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                                  L
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                                  GF
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                                  GA
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                                  GD
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                                  Pts
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {bracketTeams.map((teamStanding, index) => (
                                <tr key={teamStanding.teamId} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                                    {teamStanding.rank}
                                  </td>
                                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                                    {teamStanding.teamName}
                                  </td>
                                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '12px', textAlign: 'center', color: '#374151' }}>
                                    {teamStanding.games}
                                  </td>
                                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '12px', textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>
                                    {teamStanding.wins}
                                  </td>
                                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '12px', textAlign: 'center', color: '#dc2626', fontWeight: '600' }}>
                                    {teamStanding.losses}
                                  </td>
                                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '12px', textAlign: 'center', color: '#374151' }}>
                                    {Math.round(teamStanding.goalsFor * 100) / 100}
                                  </td>
                                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '12px', textAlign: 'center', color: '#374151' }}>
                                    {Math.round(teamStanding.goalsAgainst * 100) / 100}
                                  </td>
                                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                                    {(() => {
                                      const rounded = Math.round(teamStanding.goalDiff * 100) / 100
                                      return rounded > 0 ? `+${rounded}` : rounded
                                    })()}
                                  </td>
                                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '13px', textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>
                                    {teamStanding.points}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </>
                  )}

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
