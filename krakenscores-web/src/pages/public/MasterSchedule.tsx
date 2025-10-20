import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Match, Tournament, Division, Team, Club, Pool } from '../../types/index'
import { format, parseISO } from 'date-fns'

interface MatchWithDetails {
  match: Match
  division: Division
  pool: Pool
  darkTeam: Team
  lightTeam: Team
  darkTeamClub: Club
  lightTeamClub: Club
}

interface GroupedMatches {
  [day: string]: MatchWithDetails[]
}

type SortField = 'matchNumber' | 'division' | 'time'
type SortDirection = 'asc' | 'desc'

export default function MasterSchedule() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all')
  const [showFullClubNames, setShowFullClubNames] = useState<boolean>(false)
  const [sortField, setSortField] = useState<SortField>('matchNumber')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

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
      loadMatches()
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
      console.log('Published tournaments found:', tournamentsData.length)
      console.log('Tournaments:', tournamentsData)
      setTournaments(tournamentsData)
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMatches = async () => {
    if (!selectedTournamentId) return

    try {
      console.log('Loading matches for tournament:', selectedTournamentId)
      // Load all related data
      const [matchesSnap, divisionsSnap, teamsSnap, clubsSnap, poolsSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'matches'),
          where('tournamentId', '==', selectedTournamentId)
        )),
        getDocs(collection(db, 'divisions')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'clubs')),
        getDocs(collection(db, 'pools'))
      ])

      console.log('Matches found (before filter):', matchesSnap.docs.length)
      console.log('Match statuses:', matchesSnap.docs.map(d => d.data().status))

      const divisionsMap = new Map(divisionsSnap.docs.map(doc => [doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Division]))

      const teamsMap = new Map(teamsSnap.docs.map(doc => [doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Team]))

      const clubsMap = new Map(clubsSnap.docs.map(doc => [doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Club]))

      const poolsMap = new Map(poolsSnap.docs.map(doc => [doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Pool]))

      const matchesWithDetails: MatchWithDetails[] = matchesSnap.docs
        .map(doc => {
          const matchData = {
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
            updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
          } as Match

          const division = divisionsMap.get(matchData.divisionId)
          const pool = poolsMap.get(matchData.poolId)
          const darkTeam = teamsMap.get(matchData.darkTeamId)
          const lightTeam = teamsMap.get(matchData.lightTeamId)
          const darkTeamClub = darkTeam ? clubsMap.get(darkTeam.clubId) : undefined
          const lightTeamClub = lightTeam ? clubsMap.get(lightTeam.clubId) : undefined

          if (!division || !pool || !darkTeam || !lightTeam || !darkTeamClub || !lightTeamClub) {
            return null
          }

          return {
            match: matchData,
            division,
            pool,
            darkTeam,
            lightTeam,
            darkTeamClub,
            lightTeamClub,
          }
        })
        .filter((m): m is MatchWithDetails => m !== null)
        .filter(m => m.match.status !== 'cancelled') // Filter out cancelled matches in JavaScript

      console.log('Matches with details:', matchesWithDetails.length)
      setMatches(matchesWithDetails)

      // Extract unique divisions from matches
      const uniqueDivisions = Array.from(
        new Map(matchesWithDetails.map(m => [m.division.id, m.division])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))
      setDivisions(uniqueDivisions)
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  // Filter and sort matches
  const filteredAndSortedMatches = useMemo(() => {
    let filtered = matches

    // Filter by division
    if (selectedDivisionId !== 'all') {
      filtered = filtered.filter(m => m.division.id === selectedDivisionId)
    }

    // Sort matches
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'matchNumber':
          comparison = a.match.matchNumber - b.match.matchNumber
          break
        case 'division':
          comparison = a.division.name.localeCompare(b.division.name)
          break
        case 'time':
          comparison = a.match.scheduledTime.localeCompare(b.match.scheduledTime)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [matches, selectedDivisionId, sortField, sortDirection])

  // Group matches by day
  const groupedMatches = useMemo(() => {
    const selectedTournament = tournaments.find(t => t.id === selectedTournamentId)
    if (!selectedTournament) return {}

    const groups: GroupedMatches = {}

    filteredAndSortedMatches.forEach(m => {
      const day = m.match.scheduledDate || format(selectedTournament.startDate, 'yyyy-MM-dd')
      if (!groups[day]) {
        groups[day] = []
      }
      groups[day].push(m)
    })

    return groups
  }, [filteredAndSortedMatches, selectedTournamentId, tournaments])

  // Get sorted days
  const sortedDays = useMemo(() => {
    return Object.keys(groupedMatches).sort()
  }, [groupedMatches])

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId)

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with ascending direction
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Render sort indicator
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return ' ⇅'
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading schedule...</p>
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
            Master Schedule
          </h1>
          {selectedTournament && (
            <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
              {selectedTournament.name}
            </p>
          )}
        </div>
      </div>

      {/* Filters and Controls */}
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

        {/* Show Full Club Names Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="showFullClubNames"
            checked={showFullClubNames}
            onChange={(e) => setShowFullClubNames(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer'
            }}
          />
          <label
            htmlFor="showFullClubNames"
            style={{
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            Show full club names
          </label>
        </div>
      </div>

      {/* Schedule Content */}
      <div style={{ padding: '16px' }}>
        {matches.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px 20px',
            textAlign: 'center',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              No matches scheduled yet.
            </p>
          </div>
        ) : (
          sortedDays.map(day => (
            <div key={day} style={{ marginBottom: '24px' }}>
              {/* Day Header */}
              <div style={{
                backgroundColor: '#1f2937',
                color: 'white',
                padding: '12px 16px',
                fontSize: '18px',
                fontWeight: '600',
                borderRadius: '6px 6px 0 0',
                textTransform: 'uppercase'
              }}>
                {format(parseISO(day), 'EEEE - MMM d')}
              </div>

              {/* Matches Table */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0 0 6px 6px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                borderTop: 'none'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                      <th
                        onClick={() => handleSort('matchNumber')}
                        style={{
                          padding: '6px 4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textAlign: 'center',
                          color: '#374151',
                          cursor: 'pointer',
                          userSelect: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        #{getSortIndicator('matchNumber')}
                      </th>
                      <th
                        onClick={() => handleSort('division')}
                        style={{
                          padding: '6px 4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textAlign: 'center',
                          color: '#374151',
                          cursor: 'pointer',
                          userSelect: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Div{getSortIndicator('division')}
                      </th>
                      <th
                        onClick={() => handleSort('time')}
                        style={{
                          padding: '6px 4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textAlign: 'center',
                          color: '#374151',
                          cursor: 'pointer',
                          userSelect: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Time{getSortIndicator('time')}
                      </th>
                      <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'left', color: '#374151' }}>Dark vs Light</th>
                      <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedMatches[day].map((item, idx) => {
                      const { match, division, darkTeamClub, lightTeamClub } = item
                      const isEven = idx % 2 === 0

                      // Determine winner
                      let winnerText = ''
                      if (match.status === 'final' && match.darkTeamScore !== undefined && match.lightTeamScore !== undefined) {
                        if (match.darkTeamScore > match.lightTeamScore) {
                          winnerText = showFullClubNames ? darkTeamClub.name : darkTeamClub.abbreviation
                        } else if (match.lightTeamScore > match.darkTeamScore) {
                          winnerText = showFullClubNames ? lightTeamClub.name : lightTeamClub.abbreviation
                        } else {
                          winnerText = 'Tie'
                        }
                      }

                      return (
                        <tr
                          key={match.id}
                          style={{
                            backgroundColor: isEven ? '#ffffff' : '#f9fafb',
                            borderBottom: '1px solid #e5e7eb'
                          }}
                        >
                          {/* Match Number */}
                          <td style={{
                            padding: '6px 4px',
                            fontSize: '13px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#111827'
                          }}>
                            {match.matchNumber}
                          </td>

                          {/* Division (colored badge) */}
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            <div style={{
                              backgroundColor: division.colorHex,
                              color: '#000000',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: '600',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}>
                              {division.name}
                            </div>
                          </td>

                          {/* Time */}
                          <td style={{
                            padding: '6px 4px',
                            fontSize: '12px',
                            textAlign: 'center',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>
                            {match.scheduledTime}
                          </td>

                          {/* Teams */}
                          <td style={{ padding: '6px 4px', fontSize: '12px', color: '#111827' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <div>
                                <span style={{ fontWeight: '600' }}>
                                  {showFullClubNames ? darkTeamClub.name : darkTeamClub.abbreviation}
                                </span>
                                {' vs '}
                                <span style={{ fontWeight: '600' }}>
                                  {showFullClubNames ? lightTeamClub.name : lightTeamClub.abbreviation}
                                </span>
                              </div>
                              {match.status === 'final' && match.darkTeamScore !== undefined && match.lightTeamScore !== undefined && (
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                  ({match.darkTeamScore} - {match.lightTeamScore})
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Winner */}
                          <td style={{
                            padding: '6px 4px',
                            fontSize: '12px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: winnerText ? '#16a34a' : '#9ca3af'
                          }}>
                            {winnerText || '-'}
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
