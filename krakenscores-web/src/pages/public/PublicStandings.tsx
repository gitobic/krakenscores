import { useState, useMemo } from 'react'
import type { Match, Division, Team, Club, Standing } from '../../types/index'
import PublicNav from '../../components/layout/PublicNav'
import PublicPageHero from '../../components/layout/PublicPageHero'
import { teamCompactName } from '../../utils/teamIdentity'
import { usePublicStandings } from '../../hooks/usePublicStandings'

interface MatchWithDetails {
  match: Match
  division: Division
  darkTeam: Team
  lightTeam: Team
  darkTeamClub: Club
  lightTeamClub: Club
}

interface StandingWithClub {
  teamStanding: Standing['table'][number]
  clubName: string
}

export default function PublicStandings() {
  const { tournaments, selectedTournamentId, setSelectedTournamentId, standings,
    matches: finalMatches, divisions: allDivisions, teams, clubs, loading, error,
    standingsLoading, resultsLoading, standingsError, resultsError } = usePublicStandings()
  const [selectedDivisionId, setSelectedDivisionId] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const divisions = useMemo(() => {
    const ids = new Set([
      ...(tournaments.find(t => t.id === selectedTournamentId)?.divisionIds || []),
      ...standings.map(s => s.divisionId), ...finalMatches.map(m => m.divisionId),
    ])
    return allDivisions.filter(d => ids.has(d.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [allDivisions, tournaments, selectedTournamentId, standings, finalMatches])

  const matches = useMemo<MatchWithDetails[]>(() => {
    const divisionMap = new Map(allDivisions.map(d => [d.id, d]))
    const teamMap = new Map(teams.map(t => [t.id, t]))
    const clubMap = new Map(clubs.map(c => [c.id, c]))
    return finalMatches.flatMap(match => {
      const division = divisionMap.get(match.divisionId)
      const darkTeam = teamMap.get(match.darkTeamId), lightTeam = teamMap.get(match.lightTeamId)
      const darkTeamClub = darkTeam && clubMap.get(darkTeam.clubId)
      const lightTeamClub = lightTeam && clubMap.get(lightTeam.clubId)
      return division && darkTeam && lightTeam && darkTeamClub && lightTeamClub
        ? [{ match, division, darkTeam, lightTeam, darkTeamClub, lightTeamClub }] : []
    }).sort((a, b) => b.match.matchNumber - a.match.matchNumber)
  }, [finalMatches, allDivisions, teams, clubs])

  // Group team standings by bracket
  const groupByBracket = (teamStandings: StandingWithClub[], teamsMap: Map<string, Team>): Map<string, StandingWithClub[]> => {
    const groups = new Map<string, StandingWithClub[]>()

    teamStandings.forEach(ts => {
      const team = teamsMap.get(ts.teamStanding.teamId)
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

  // Enrich standings with club names and filter
  const filteredStandings = useMemo(() => {
    let filtered = standings

    // Filter by division
    if (selectedDivisionId !== 'all') {
      filtered = filtered.filter(s => s.divisionId === selectedDivisionId)
    }

    // Enrich with club names
    const enriched = filtered.map(standing => {
      const tableWithClubs = standing.table.map(teamStanding => {
        const team = teams.find(t => t.id === teamStanding.teamId)
        const club = team ? clubs.find(c => c.id === team.clubId) : undefined
        return {
          teamStanding,
          clubName: club?.name || teamStanding.teamName
        }
      })
      return { ...standing, tableWithClubs }
    })

    // Filter by search term (club name)
    if (searchTerm) {
      return enriched.map(standing => ({
        ...standing,
        tableWithClubs: standing.tableWithClubs.filter(item =>
          item.clubName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(standing => standing.tableWithClubs.length > 0)
    }

    return enriched
  }, [standings, selectedDivisionId, searchTerm, teams, clubs])

  // Filter matches by division and search term
  const filteredMatches = useMemo(() => {
    let filtered = matches

    // Filter by division
    if (selectedDivisionId !== 'all') {
      filtered = filtered.filter(m => m.match.divisionId === selectedDivisionId)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(m => {
        const darkClubMatch = m.darkTeamClub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              m.darkTeamClub.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              m.darkTeam.name.toLowerCase().includes(searchTerm.toLowerCase())
        const lightClubMatch = m.lightTeamClub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               m.lightTeamClub.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               m.lightTeam.name.toLowerCase().includes(searchTerm.toLowerCase())
        return darkClubMatch || lightClubMatch
      })
    }

    // Limit to most recent 20 matches
    return filtered.slice(0, 20)
  }, [matches, selectedDivisionId, searchTerm])

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId)

  const getDivisionName = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId)
    return division?.name || 'Unknown'
  }

  const getDivisionColor = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId)
    return division?.colorHex || '#9ca3af'
  }

  return (
    <div style={{
      minHeight: '100vh',
      overflowX: 'hidden',
      backgroundColor: 'var(--ks-page-bg)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Public Navigation Menu */}
      <PublicNav />

      <PublicPageHero
        eyebrow="Division race"
        title="Standings"
        subtitle="Pool records, points, and recent results as the tournament unfolds."
        tournamentName={selectedTournament?.name}
        logoUrl={selectedTournament?.logoUrl}
      />

      {error && <p role="alert" className="mx-auto max-w-7xl p-4 text-red-700">{error}</p>}
      {!loading && !error && tournaments.length === 0 && <p className="mx-auto max-w-7xl p-4">There are no published tournaments at this time.</p>}

      {/* Filters */}
      <div className="relative z-10 mx-auto -mt-4 max-w-7xl rounded-2xl shadow-xl sm:-mt-6" style={{
        padding: '16px',
        backgroundColor: 'var(--ks-surface)',
        borderBottom: '1px solid var(--ks-border-subtle)'
      }}>
        {/* Tournament Selector (if multiple tournaments) */}
        {tournaments.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--ks-text-secondary)',
              marginBottom: '8px'
            }}>
              Tournament
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => { setSelectedTournamentId(e.target.value); setSelectedDivisionId('all') }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'var(--ks-surface)',
                cursor: 'pointer'
              }}
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Division Filter */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--ks-text-secondary)',
            marginBottom: '8px'
          }}>
            Division
          </label>
          <select
            value={selectedDivisionId}
            onChange={(e) => setSelectedDivisionId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'var(--ks-surface)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Divisions</option>
            {divisions.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--ks-text-secondary)',
            marginBottom: '8px'
          }}>
            Search Team or Club
          </label>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'var(--ks-surface)'
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl" style={{ padding: '32px 16px' }}>
        {/* Standings Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--ks-text)',
            marginBottom: '16px'
          }}>
            Standings
          </h2>

          {standingsError ? <p role="alert">{standingsError}</p> : standingsLoading && (loading || tournaments.length > 0) ? <p role="status">Loading standings…</p> : filteredStandings.length === 0 ? (
            <div style={{
              backgroundColor: 'var(--ks-surface)',
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: '8px',
              border: '1px solid var(--ks-border-subtle)'
            }}>
              <p style={{ color: 'var(--ks-text-muted)', fontSize: '16px' }}>
                No standings available yet.
              </p>
            </div>
          ) : (
            filteredStandings.map(standing => {
              const teamsMap = new Map(teams.map(t => [t.id, t]))
              const bracketGroups = groupByBracket(standing.tableWithClubs, teamsMap)

              return (
                <div key={standing.divisionId} className="overflow-hidden rounded-xl shadow-md" style={{ marginBottom: '24px' }}>
                  {/* Division Header */}
                  <div style={{
                    backgroundColor: getDivisionColor(standing.divisionId),
                    color: 'var(--ks-text)',
                    padding: '12px 16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    borderRadius: '6px 6px 0 0'
                  }}>
                    {getDivisionName(standing.divisionId)}
                  </div>

                  {/* Standings Tables Grouped by Bracket */}
                  <div style={{
                    backgroundColor: 'var(--ks-surface)',
                    borderRadius: '0 0 6px 6px',
                    overflow: 'hidden',
                    border: '1px solid var(--ks-border-subtle)',
                    borderTop: 'none'
                  }}>
                    {Array.from(bracketGroups.entries()).map(([bracket, bracketTeams], bracketIndex) => (
                      <div key={bracket}>
                        {/* Bracket Header */}
                        {bracketGroups.size > 1 && (
                          <div style={{
                            backgroundColor: 'var(--ks-surface-subtle)',
                            padding: '8px 12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#2563eb',
                            borderTop: bracketIndex > 0 ? '2px solid var(--ks-border-subtle)' : 'none'
                          }}>
                            {bracket === 'No Bracket' ? 'Pool Play' : `Bracket ${bracket}`}
                          </div>
                        )}

                        {/* Bracket Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                          <colgroup>
                            <col style={{ width: '45px' }} />
                            <col style={{ width: '30%' }} />
                            <col style={{ width: '42px' }} />
                            <col style={{ width: '38px' }} />
                            <col style={{ width: '38px' }} />
                            <col style={{ width: '45px' }} />
                            <col style={{ width: '45px' }} />
                            <col style={{ width: '50px' }} />
                            <col style={{ width: '48px' }} />
                          </colgroup>
                          <thead>
                            <tr style={{ backgroundColor: 'var(--ks-page-bg)', borderBottom: '1px solid var(--ks-border-subtle)' }}>
                              <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                Rank
                              </th>
                              <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'left', color: 'var(--ks-text-secondary)' }}>
                                Team
                              </th>
                              <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                GP
                              </th>
                              <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                W
                              </th>
                              <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                L
                              </th>
                              <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                GF
                              </th>
                              <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                GA
                              </th>
                              <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                GD
                              </th>
                              <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                Pts
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {bracketTeams.map((item, idx) => {
                              const { teamStanding, clubName } = item
                              const isEven = idx % 2 === 0
                              return (
                                <tr
                                  key={teamStanding.teamId}
                                  style={{
                                    backgroundColor: isEven ? 'var(--ks-surface)' : 'var(--ks-page-bg)',
                                    borderBottom: '1px solid var(--ks-border-subtle)'
                                  }}
                                >
                                  <td style={{ padding: '6px 2px', fontSize: '13px', textAlign: 'center', fontWeight: '600', color: 'var(--ks-text)' }}>
                                    {teamStanding.rank}
                                  </td>
                                  <td style={{ padding: '6px 4px', fontSize: '13px', textAlign: 'left', fontWeight: '500', color: 'var(--ks-text)' }}>
                                    {clubName}
                                  </td>
                                  <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                    {teamStanding.games}
                                  </td>
                                  <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>
                                    {teamStanding.wins}
                                  </td>
                                  <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: '#dc2626', fontWeight: '600' }}>
                                    {teamStanding.losses}
                                  </td>
                                  <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                    {Math.round(teamStanding.goalsFor * 100) / 100}
                                  </td>
                                  <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: 'var(--ks-text-secondary)' }}>
                                    {Math.round(teamStanding.goalsAgainst * 100) / 100}
                                  </td>
                                  <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: 'var(--ks-text-secondary)', fontWeight: '600' }}>
                                    {(() => {
                                      const rounded = Math.round(teamStanding.goalDiff * 100) / 100
                                      return rounded > 0 ? `+${rounded}` : rounded
                                    })()}
                                  </td>
                                  <td style={{ padding: '6px 2px', fontSize: '13px', textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>
                                    {teamStanding.points}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Recent Results Section */}
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--ks-text)',
            marginBottom: '16px'
          }}>
            Recent Results
          </h2>

          {resultsError ? <p role="alert">{resultsError}</p> : resultsLoading && (loading || tournaments.length > 0) ? <p role="status">Loading recent results…</p> : filteredMatches.length === 0 ? (
            <div style={{
              backgroundColor: 'var(--ks-surface)',
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: '8px',
              border: '1px solid var(--ks-border-subtle)'
            }}>
              <p style={{ color: 'var(--ks-text-muted)', fontSize: '16px' }}>
                No final results yet.
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'var(--ks-surface)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--ks-border-subtle)'
            }}>
              {filteredMatches.map((item, idx) => {
                const { match, division, darkTeam, lightTeam, darkTeamClub, lightTeamClub } = item
                const darkWon = (match.darkTeamScore ?? 0) > (match.lightTeamScore ?? 0)
                const lightWon = (match.lightTeamScore ?? 0) > (match.darkTeamScore ?? 0)

                return (
                  <div
                    key={match.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < filteredMatches.length - 1 ? '1px solid var(--ks-border-subtle)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    {/* Division Badge */}
                    <div style={{
                      backgroundColor: division.colorHex,
                      color: 'var(--ks-text)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      minWidth: '60px',
                      textAlign: 'center'
                    }}>
                      {division.name}
                    </div>

                    {/* Match Info */}
                    <div style={{ flex: 1, fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: darkWon ? '700' : '500', color: darkWon ? 'var(--ks-text)' : 'var(--ks-text-muted)' }}>
                          {teamCompactName(darkTeam, darkTeamClub, teams)}
                        </span>
                        <span style={{ fontWeight: '700', color: darkWon ? '#16a34a' : 'var(--ks-text-secondary)' }}>
                          {match.darkTeamScore}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: lightWon ? '700' : '500', color: lightWon ? 'var(--ks-text)' : 'var(--ks-text-muted)' }}>
                          {teamCompactName(lightTeam, lightTeamClub, teams)}
                        </span>
                        <span style={{ fontWeight: '700', color: lightWon ? '#16a34a' : 'var(--ks-text-secondary)' }}>
                          {match.lightTeamScore}
                        </span>
                      </div>
                    </div>

                    {/* Match Number */}
                    <div style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      whiteSpace: 'nowrap'
                    }}>
                      #{match.matchNumber}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Legend / Notes Section */}
        <div style={{
          backgroundColor: 'var(--ks-surface)',
          borderRadius: '8px',
          border: '1px solid var(--ks-border-subtle)',
          padding: '20px',
          marginTop: '32px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--ks-text)',
            marginBottom: '12px'
          }}>
            Legend
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            fontSize: '13px',
            color: 'var(--ks-text-muted)',
            marginBottom: '16px'
          }}>
            <div><span style={{ fontWeight: '500' }}>GP:</span> Games Played</div>
            <div><span style={{ fontWeight: '500' }}>W:</span> Wins</div>
            <div><span style={{ fontWeight: '500' }}>L:</span> Losses</div>
            <div><span style={{ fontWeight: '500' }}>GF:</span> Goals For</div>
            <div><span style={{ fontWeight: '500' }}>GA:</span> Goals Against</div>
            <div><span style={{ fontWeight: '500' }}>GD:</span> Goal Difference</div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontWeight: '500' }}>Pts:</span> Points (2 per win)
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--ks-text-muted)',
            paddingTop: '12px',
            borderTop: '1px solid var(--ks-border-subtle)'
          }}>
            <p style={{ fontWeight: '500', marginBottom: '8px' }}>Tiebreaker Order:</p>
            <ol style={{
              paddingLeft: '20px',
              listStyleType: 'decimal',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <li>Total points (2 per win)</li>
              <li>Head-to-head record</li>
              <li>Goal difference</li>
              <li>Goals for</li>
              <li>Fewest goals against</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: 'var(--ks-text-muted)',
        fontSize: '12px'
      }}>
        <p>KrakenScores - Tournament Management System</p>
      </div>
    </div>
  )
}
