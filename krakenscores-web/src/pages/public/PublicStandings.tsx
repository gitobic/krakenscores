import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Match, Tournament, Division, Team, Club, Standing } from '../../types/index'

interface MatchWithDetails {
  match: Match
  division: Division
  darkTeam: Team
  lightTeam: Team
  darkTeamClub: Club
  lightTeamClub: Club
}

export default function PublicStandings() {
  const [standings, setStandings] = useState<Standing[]>([])
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Auto-select first published tournament
    if (tournaments.length > 0 && !selectedTournamentId) {
      const firstPublished = tournaments.find(t => t.isPublished)
      if (firstPublished) {
        setSelectedTournamentId(firstPublished.id)
      }
    }
  }, [tournaments, selectedTournamentId])

  useEffect(() => {
    if (selectedTournamentId) {
      loadTournamentData()
    }
  }, [selectedTournamentId])

  const loadData = async () => {
    try {
      // Only load published tournaments for public view
      const tournamentsSnapshot = await getDocs(
        query(collection(db, 'tournaments'), where('isPublished', '==', true))
      )
      const tournamentsData = tournamentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: (doc.data().startDate as Timestamp)?.toDate() || new Date(),
        endDate: (doc.data().endDate as Timestamp)?.toDate() || new Date(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Tournament))
      setTournaments(tournamentsData)
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTournamentData = async () => {
    if (!selectedTournamentId) return

    try {
      // Load standings, matches, divisions, teams, clubs
      const [standingsSnap, matchesSnap, divisionsSnap, teamsSnap, clubsSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'standings'),
          where('tournamentId', '==', selectedTournamentId)
        )),
        getDocs(query(
          collection(db, 'matches'),
          where('tournamentId', '==', selectedTournamentId),
          where('status', '==', 'final')
        )),
        getDocs(collection(db, 'divisions')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'clubs'))
      ])

      // Parse standings
      const standingsData = standingsSnap.docs.map(doc => ({
        divisionId: doc.id,
        ...doc.data(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Standing))
      setStandings(standingsData)

      // Create lookup maps
      const divisionsMap = new Map(divisionsSnap.docs.map(doc => [doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Division]))

      const teamsData = teamsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Team))
      setTeams(teamsData)
      const teamsMap = new Map(teamsData.map(t => [t.id, t]))

      const clubsData = clubsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Club))
      setClubs(clubsData)
      const clubsMap = new Map(clubsData.map(c => [c.id, c]))

      // Parse matches with details
      const matchesWithDetails: MatchWithDetails[] = matchesSnap.docs
        .map(doc => {
          const matchData = {
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
            updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
          } as Match

          const division = divisionsMap.get(matchData.divisionId)
          const darkTeam = teamsMap.get(matchData.darkTeamId)
          const lightTeam = teamsMap.get(matchData.lightTeamId)
          const darkTeamClub = darkTeam ? clubsMap.get(darkTeam.clubId) : undefined
          const lightTeamClub = lightTeam ? clubsMap.get(lightTeam.clubId) : undefined

          if (!division || !darkTeam || !lightTeam || !darkTeamClub || !lightTeamClub) {
            return null
          }

          return {
            match: matchData,
            division,
            darkTeam,
            lightTeam,
            darkTeamClub,
            lightTeamClub,
          }
        })
        .filter((m): m is MatchWithDetails => m !== null)
        // Sort by match number descending (most recent first)
        .sort((a, b) => b.match.matchNumber - a.match.matchNumber)

      setMatches(matchesWithDetails)

      // Extract unique divisions from standings
      const uniqueDivisions = Array.from(
        new Map(standingsData.map(s => {
          const div = divisionsMap.get(s.divisionId)
          return div ? [s.divisionId, div] : null
        }).filter((pair): pair is [string, Division] => pair !== null))
        .values()
      ).sort((a, b) => a.name.localeCompare(b.name))
      setDivisions(uniqueDivisions)
    } catch (error) {
      console.error('Error loading tournament data:', error)
    }
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
                              m.darkTeamClub.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
        const lightClubMatch = m.lightTeamClub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               m.lightTeamClub.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading standings...</p>
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>No Tournaments Available</h2>
        <p style={{ color: '#6b7280' }}>There are no published tournaments at this time.</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        {/* Tournament Logo */}
        {selectedTournament?.logoUrl && (
          <img
            src={selectedTournament.logoUrl}
            alt={selectedTournament.name}
            style={{
              maxHeight: '60px',
              maxWidth: '60px',
              objectFit: 'contain'
            }}
          />
        )}

        {/* Title and Tournament Name */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Standings
          </h1>
          {selectedTournament && (
            <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
              {selectedTournament.name}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {/* Tournament Selector (if multiple tournaments) */}
        {tournaments.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Tournament
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
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
            color: '#374151',
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
              backgroundColor: 'white',
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
            color: '#374151',
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
              backgroundColor: 'white'
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Standings Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Standings
          </h2>

          {filteredStandings.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>
                No standings available yet.
              </p>
            </div>
          ) : (
            filteredStandings.map(standing => (
              <div key={standing.divisionId} style={{ marginBottom: '24px' }}>
                {/* Division Header */}
                <div style={{
                  backgroundColor: getDivisionColor(standing.divisionId),
                  color: '#000000',
                  padding: '12px 16px',
                  fontSize: '18px',
                  fontWeight: '600',
                  borderRadius: '6px 6px 0 0'
                }}>
                  {getDivisionName(standing.divisionId)}
                </div>

                {/* Standings Table */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '0 0 6px 6px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  borderTop: 'none'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '50px' }} />
                      <col style={{ width: 'auto' }} />
                      <col style={{ width: '45px' }} />
                      <col style={{ width: '40px' }} />
                      <col style={{ width: '40px' }} />
                      <col style={{ width: '50px' }} />
                      <col style={{ width: '50px' }} />
                      <col style={{ width: '55px' }} />
                      <col style={{ width: '50px' }} />
                    </colgroup>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>Rank</th>
                        <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'left', color: '#374151' }}>Team</th>
                        <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>GP</th>
                        <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>W</th>
                        <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>L</th>
                        <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>GF</th>
                        <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>GA</th>
                        <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>GD</th>
                        <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standing.tableWithClubs.map((item, idx) => {
                        const { teamStanding, clubName } = item
                        const isEven = idx % 2 === 0
                        return (
                          <tr
                            key={teamStanding.teamId}
                            style={{
                              backgroundColor: isEven ? '#ffffff' : '#f9fafb',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                          >
                            <td style={{ padding: '8px 4px', fontSize: '13px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>
                              {teamStanding.rank}
                            </td>
                            <td style={{ padding: '8px 4px', fontSize: '13px', textAlign: 'left', fontWeight: '500', color: '#111827' }}>
                              {clubName}
                            </td>
                            <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', color: '#374151' }}>
                              {teamStanding.games}
                            </td>
                            <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>
                              {teamStanding.wins}
                            </td>
                            <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', color: '#dc2626', fontWeight: '600' }}>
                              {teamStanding.losses}
                            </td>
                            <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', color: '#374151' }}>
                              {Math.round(teamStanding.goalsFor * 100) / 100}
                            </td>
                            <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', color: '#374151' }}>
                              {Math.round(teamStanding.goalsAgainst * 100) / 100}
                            </td>
                            <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', color: '#374151', fontWeight: '600' }}>
                              {(() => {
                                const rounded = Math.round(teamStanding.goalDiff * 100) / 100
                                return rounded > 0 ? `+${rounded}` : rounded
                              })()}
                            </td>
                            <td style={{ padding: '8px 4px', fontSize: '13px', textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>
                              {teamStanding.points}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Results Section */}
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Recent Results
          </h2>

          {filteredMatches.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>
                No final results yet.
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb'
            }}>
              {filteredMatches.map((item, idx) => {
                const { match, division, darkTeamClub, lightTeamClub } = item
                const darkWon = (match.darkTeamScore ?? 0) > (match.lightTeamScore ?? 0)
                const lightWon = (match.lightTeamScore ?? 0) > (match.darkTeamScore ?? 0)

                return (
                  <div
                    key={match.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < filteredMatches.length - 1 ? '1px solid #e5e7eb' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    {/* Division Badge */}
                    <div style={{
                      backgroundColor: division.colorHex,
                      color: '#000000',
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
                        <span style={{ fontWeight: darkWon ? '700' : '500', color: darkWon ? '#111827' : '#6b7280' }}>
                          {darkTeamClub.abbreviation}
                        </span>
                        <span style={{ fontWeight: '700', color: darkWon ? '#16a34a' : '#374151' }}>
                          {match.darkTeamScore}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: lightWon ? '700' : '500', color: lightWon ? '#111827' : '#6b7280' }}>
                          {lightTeamClub.abbreviation}
                        </span>
                        <span style={{ fontWeight: '700', color: lightWon ? '#16a34a' : '#374151' }}>
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
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: '#6b7280',
        fontSize: '12px'
      }}>
        <p>KrakenScores - Tournament Management System</p>
      </div>
    </div>
  )
}
