import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Match, Tournament, Division, Team, Club, Pool } from '../../types/index'
import { recalculateStandingsForDivision } from '../../services/standings'

interface MatchWithDetails {
  match: Match
  tournament: Tournament
  division: Division
  pool: Pool
  darkTeam: Team
  lightTeam: Team
  darkTeamClub: Club
  lightTeamClub: Club
}

type SortField = 'matchNumber' | 'day' | 'time' | 'division' | 'pool' | 'status'
type SortDirection = 'asc' | 'desc'

export default function Scorekeeper() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('matchNumber')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showTeamNames, setShowTeamNames] = useState<boolean>(false)

  // Track edited scores for each match
  const [editedScores, setEditedScores] = useState<Record<string, { darkScore: number; lightScore: number }>>({})

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0].id)
    }
  }, [tournaments, selectedTournamentId])

  useEffect(() => {
    if (selectedTournamentId) {
      loadMatches()
    }
  }, [selectedTournamentId])

  const loadData = async () => {
    try {
      const tournamentsSnapshot = await getDocs(collection(db, 'tournaments'))
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

  const loadMatches = async () => {
    if (!selectedTournamentId) return

    setLoadingMatches(true)
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
          const tournament = tournaments.find(t => t.id === matchData.tournamentId)

          if (!division || !pool || !darkTeam || !lightTeam || !tournament) {
            return null
          }

          const darkTeamClub = clubsMap.get(darkTeam.clubId)
          const lightTeamClub = clubsMap.get(lightTeam.clubId)

          if (!darkTeamClub || !lightTeamClub) {
            return null
          }

          return {
            match: matchData,
            tournament,
            division,
            pool,
            darkTeam,
            lightTeam,
            darkTeamClub,
            lightTeamClub,
          }
        })
        .filter((m): m is MatchWithDetails => m !== null)

      console.log(`Loaded ${matchesWithDetails.length} matches for tournament ${selectedTournamentId}`)
      setMatches(matchesWithDetails)

      // Initialize edited scores from existing match data
      const initialScores: Record<string, { darkScore: number; lightScore: number }> = {}
      matchesWithDetails.forEach(m => {
        initialScores[m.match.id] = {
          darkScore: m.match.darkTeamScore ?? 0,
          lightScore: m.match.lightTeamScore ?? 0
        }
      })
      setEditedScores(initialScores)
    } catch (error) {
      console.error('Error loading matches:', error)
      alert(`Error loading matches: ${error}`)
    } finally {
      setLoadingMatches(false)
    }
  }

  // Get day of week from date string (YYYY-MM-DD)
  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00') // Add time to avoid timezone issues
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    return days[date.getDay()]
  }

  // Get unique days from matches
  const availableDays = useMemo(() => {
    const days = new Set<string>()
    matches.forEach(m => {
      const day = getDayOfWeek(m.match.scheduledDate)
      days.add(day)
    })
    return Array.from(days).sort((a, b) => {
      const order = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      return order.indexOf(a) - order.indexOf(b)
    })
  }, [matches])

  // Filter and sort matches
  const filteredAndSortedMatches = useMemo(() => {
    // Filter by day
    let filtered = matches
    if (selectedDay !== 'all') {
      filtered = matches.filter(m => getDayOfWeek(m.match.scheduledDate) === selectedDay)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      if (sortField === 'matchNumber') {
        comparison = a.match.matchNumber - b.match.matchNumber
      } else if (sortField === 'day') {
        comparison = a.match.scheduledDate.localeCompare(b.match.scheduledDate)
      } else if (sortField === 'time') {
        comparison = a.match.scheduledTime.localeCompare(b.match.scheduledTime)
      } else if (sortField === 'pool') {
        comparison = a.pool.name.localeCompare(b.pool.name)
      } else if (sortField === 'division') {
        comparison = a.division.name.localeCompare(b.division.name)
      } else if (sortField === 'status') {
        comparison = a.match.status.localeCompare(b.match.status)
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [matches, selectedDay, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleScoreChange = (matchId: string, team: 'dark' | 'light', value: string) => {
    // Allow decimal values for shootout scores (e.g., 4.5 means 4 regular + 5 shootout)
    const numValue = parseFloat(value) || 0
    setEditedScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team === 'dark' ? 'darkScore' : 'lightScore']: numValue
      }
    }))
  }

  const handleSetStatus = async (matchId: string, newStatus: 'scheduled' | 'in_progress' | 'final' | 'forfeit' | 'cancelled') => {
    const matchWithDetails = matches.find(m => m.match.id === matchId)
    if (!matchWithDetails) return

    const oldStatus = matchWithDetails.match.status

    // If setting to final, require scores
    if (newStatus === 'final') {
      const scores = editedScores[matchId]
      if (!scores || (scores.darkScore === 0 && scores.lightScore === 0)) {
        if (!confirm('Both scores are 0. Are you sure you want to finalize this match?')) {
          return
        }
      }
    }

    setSavingMatchId(matchId)
    try {
      const matchRef = doc(db, 'matches', matchId)
      const scores = editedScores[matchId] || { darkScore: 0, lightScore: 0 }

      await updateDoc(matchRef, {
        darkTeamScore: scores.darkScore,
        lightTeamScore: scores.lightScore,
        status: newStatus,
        updatedAt: serverTimestamp()
      })

      // If status changed to 'final', trigger standings recalculation
      if (oldStatus !== 'final' && newStatus === 'final') {
        console.log('Recalculating standings for division:', matchWithDetails.match.divisionId)
        await recalculateStandingsForDivision(matchWithDetails.match.divisionId)
      }

      await loadMatches()
    } catch (error) {
      console.error('Error updating match:', error)
      alert(`Failed to update match: ${error}`)
    } finally {
      setSavingMatchId(null)
    }
  }

  const getStatusBadge = (matchStatus: string) => {
    const statusStyles: Record<string, { bg: string; text: string }> = {
      scheduled: { bg: '#f3f4f6', text: '#4b5563' },
      in_progress: { bg: '#dbeafe', text: '#1e40af' },
      final: { bg: '#dcfce7', text: '#15803d' },
      forfeit: { bg: '#fee2e2', text: '#dc2626' },
      cancelled: { bg: '#f3f4f6', text: '#6b7280' },
    }
    const style = statusStyles[matchStatus] || statusStyles.scheduled
    return (
      <span style={{
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: '600',
        color: style.text,
        backgroundColor: style.bg,
        borderRadius: '12px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap'
      }}>
        {matchStatus.replace('_', ' ')}
      </span>
    )
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th style={{
      padding: '8px',
      textAlign: 'center',
      fontSize: '13px',
      fontWeight: '600',
      borderRight: '1px solid #e5e7eb',
      color: '#111827',
      backgroundColor: '#f3f4f6'
    }}>
      <button
        onClick={() => handleSort(field)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          fontSize: '13px',
          fontWeight: '600',
          color: 'inherit',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          width: '100%'
        }}
      >
        {children}
        {sortField === field && (
          <span style={{ fontSize: '9px' }}>
            {sortDirection === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </button>
    </th>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scorekeeper...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            Scorekeeper
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginTop: '8px'
          }}>
            Enter scores and finalize matches
          </p>
        </div>

        {/* Filters */}
        <div style={{
          marginBottom: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e5e7eb'
        }}>
          {/* First Line: Tournament and Day Filters */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            {/* Tournament Filter */}
            {tournaments.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
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
                  onChange={(e) => {
                    setSelectedTournamentId(e.target.value)
                    setSelectedDay('all')
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {tournaments.map(tournament => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Day Filter */}
            {availableDays.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  whiteSpace: 'nowrap'
                }}>
                  Filter by Day:
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Days ({matches.length} matches)</option>
                  {availableDays.map(day => {
                    const count = matches.filter(m => getDayOfWeek(m.match.scheduledDate) === day).length
                    return (
                      <option key={day} value={day}>
                        {day} ({count} matches)
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Second Line: Checkbox */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showTeamNames}
                onChange={(e) => setShowTeamNames(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{
                marginLeft: '8px',
                fontSize: '14px',
                color: '#374151'
              }}>
                Show full club names
              </span>
            </label>
          </div>
        </div>

        {/* Matches Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingMatches ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading matches...
            </div>
          ) : filteredAndSortedMatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {matches.length === 0 ? (
                <>
                  No matches scheduled for this tournament.
                  <br />
                  <span className="text-sm">Go to the Matches page to create matches.</span>
                </>
              ) : (
                <>No matches found for the selected day.</>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                    <SortableHeader field="matchNumber">Match #</SortableHeader>
                    <SortableHeader field="day">Day</SortableHeader>
                    <SortableHeader field="time">Time</SortableHeader>
                    <SortableHeader field="division">Division</SortableHeader>
                    <SortableHeader field="pool">Pool</SortableHeader>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827', backgroundColor: '#f3f4f6', width: '80px' }}>
                      Dark
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827', backgroundColor: '#f3f4f6', width: '80px' }}>
                      Dark Score
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827', backgroundColor: '#f3f4f6', width: '80px' }}>
                      Light
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827', backgroundColor: '#f3f4f6', width: '80px' }}>
                      Light Score
                    </th>
                    <SortableHeader field="status">Status</SortableHeader>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#111827', backgroundColor: '#f3f4f6' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedMatches.map((matchWithDetails, index) => {
                    const { match, division, pool, darkTeamClub, lightTeamClub } = matchWithDetails
                    const isSaving = savingMatchId === match.id
                    const scores = editedScores[match.id] || { darkScore: 0, lightScore: 0 }

                    return (
                      <tr
                        key={match.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                          borderBottom: '1px solid #e5e7eb'
                        }}
                      >
                        <td style={{ padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#111827', borderRight: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          {match.matchNumber}
                        </td>
                        <td style={{ padding: '6px 8px', fontSize: '12px', fontWeight: '600', color: '#374151', borderRight: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          {getDayOfWeek(match.scheduledDate)}
                        </td>
                        <td style={{ padding: '6px 8px', fontSize: '13px', color: '#6b7280', borderRight: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          {match.scheduledTime}
                        </td>
                        <td style={{ padding: '6px 8px', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: division.colorHex,
                            fontSize: '11px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}>
                            {division.name}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', fontSize: '13px', color: '#6b7280', borderRight: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          {pool.name}
                        </td>
                        <td style={{
                          padding: '6px 8px',
                          fontSize: showTeamNames ? '12px' : '13px',
                          fontWeight: '600',
                          color: '#111827',
                          borderRight: '1px solid #e5e7eb',
                          textAlign: 'center',
                          whiteSpace: showTeamNames ? 'nowrap' : 'normal',
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                          {showTeamNames ? darkTeamClub.name : darkTeamClub.abbreviation}
                        </td>
                        <td style={{ padding: '6px 8px', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={scores.darkScore}
                            onChange={(e) => handleScoreChange(match.id, 'dark', e.target.value)}
                            disabled={match.status === 'final' || isSaving}
                            style={{
                              width: '55px',
                              padding: '4px 6px',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: '600',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: match.status === 'final' ? '#f3f4f6' : 'white',
                              fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}
                          />
                        </td>
                        <td style={{
                          padding: '6px 8px',
                          fontSize: showTeamNames ? '12px' : '13px',
                          fontWeight: '600',
                          color: '#111827',
                          borderRight: '1px solid #e5e7eb',
                          textAlign: 'center',
                          whiteSpace: showTeamNames ? 'nowrap' : 'normal',
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                          {showTeamNames ? lightTeamClub.name : lightTeamClub.abbreviation}
                        </td>
                        <td style={{ padding: '6px 8px', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={scores.lightScore}
                            onChange={(e) => handleScoreChange(match.id, 'light', e.target.value)}
                            disabled={match.status === 'final' || isSaving}
                            style={{
                              width: '55px',
                              padding: '4px 6px',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: '600',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: match.status === 'final' ? '#f3f4f6' : 'white',
                              fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                          {getStatusBadge(match.status)}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            {match.status !== 'final' && (
                              <>
                                {match.status !== 'in_progress' && (
                                  <button
                                    onClick={() => handleSetStatus(match.id, 'in_progress')}
                                    disabled={isSaving}
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      color: 'white',
                                      backgroundColor: isSaving ? '#9ca3af' : '#2563eb',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: isSaving ? 'not-allowed' : 'pointer',
                                      whiteSpace: 'nowrap',
                                      fontFamily: 'system-ui, -apple-system, sans-serif'
                                    }}
                                  >
                                    Start
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSetStatus(match.id, 'final')}
                                  disabled={isSaving}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: 'white',
                                    backgroundColor: isSaving ? '#9ca3af' : '#16a34a',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'system-ui, -apple-system, sans-serif'
                                  }}
                                >
                                  {isSaving ? 'Saving...' : 'Finalize'}
                                </button>
                              </>
                            )}
                            {match.status === 'final' && (
                              <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'system-ui, -apple-system, sans-serif' }}>✓ Final</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        {filteredAndSortedMatches.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Tips:</strong> Click column headers to sort. Use the Day filter to show only matches for a specific day.
              Enter scores in the table, then click "Finalize" to mark the match as complete and update standings.
            </p>
            <p className="text-sm text-blue-900 mt-2">
              <strong>Shootout Scores:</strong> Use decimals to record shootout results. Example: Enter "4.5" for a team that scored 4 regular goals plus 5 shootout goals.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
