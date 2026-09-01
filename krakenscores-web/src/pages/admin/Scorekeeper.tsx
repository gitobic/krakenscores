import { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Match, Tournament, Division, Team, Club, Pool } from '../../types/index'
import { ResultImpactError, saveMatchResult } from '../../services/matches'
import { teamCompactName, teamPublicName } from '../../utils/teamIdentity'
import { buildScorekeeperQueue } from '../../utils/scorekeeperQueue'

interface MatchWithDetails {
  match: Match
  tournament: Tournament
  division: Division
  pool: Pool
  darkTeam: Team | undefined
  lightTeam: Team | undefined
  darkTeamClub: Club | undefined
  lightTeamClub: Club | undefined
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
  const [showTeamNames, setShowTeamNames] = useState<boolean>(true)
  const [showAllGames, setShowAllGames] = useState(false)
  const [saveStates, setSaveStates] = useState<Record<string, 'saving' | 'saved' | 'error'>>({})
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [operationMessage, setOperationMessage] = useState('')

  // Track edited scores for each match
  const [editedScores, setEditedScores] = useState<Record<string, { darkScore: number; lightScore: number }>>({})

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const online = () => setIsOnline(true)
    const offline = () => setIsOnline(false)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
  }, [])

  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0].id)
    }
  }, [tournaments, selectedTournamentId])

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

  const loadMatches = useCallback(async () => {
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

          if (!division || !pool || !tournament) {
            return null
          }

          const darkTeamClub = darkTeam ? clubsMap.get(darkTeam.clubId) : undefined
          const lightTeamClub = lightTeam ? clubsMap.get(lightTeam.clubId) : undefined

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
  }, [selectedTournamentId, tournaments])

  useEffect(() => {
    if (selectedTournamentId) {
      void loadMatches()
    }
  }, [selectedTournamentId, loadMatches])

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

  const queue = useMemo(() => buildScorekeeperQueue(
    selectedDay === 'all' ? matches : matches.filter(item => getDayOfWeek(item.match.scheduledDate) === selectedDay)
  ), [matches, selectedDay])
  const knownTeams = useMemo(() => matches.flatMap(item => [item.darkTeam, item.lightTeam]).filter((team): team is Team => Boolean(team)), [matches])
  const participantName = (item: MatchWithDetails, side: 'dark' | 'light') => {
    const team = side === 'dark' ? item.darkTeam : item.lightTeam
    const club = side === 'dark' ? item.darkTeamClub : item.lightTeamClub
    const provisional = side === 'dark' ? item.match.darkTeamLabel : item.match.lightTeamLabel
    if (!team || !club) return provisional || 'To be determined'
    return showTeamNames ? teamPublicName(team, club) : teamCompactName(team, club, knownTeams)
  }

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
    if (!isOnline) {
      setSaveStates(current => ({ ...current, [matchId]: 'error' }))
      return
    }
    const matchWithDetails = matches.find(m => m.match.id === matchId)
    if (!matchWithDetails) return

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
    setSaveStates(current => ({ ...current, [matchId]: 'saving' }))
    try {
      const scores = editedScores[matchId] || { darkScore: 0, lightScore: 0 }
      let result: Awaited<ReturnType<typeof saveMatchResult>>
      try {
        result = await saveMatchResult(matchId, scores.darkScore, scores.lightScore, newStatus)
      } catch (error) {
        if (!(error instanceof ResultImpactError)) throw error
        const affected = error.affectedMatches.map(match => `Game ${match.matchNumber}`).join(', ')
        if (!confirm(`${error.message}\n\nAffected: ${affected}\n\nContinuing will reopen the affected games and clear their scores. Continue?`)) return
        result = await saveMatchResult(matchId, scores.darkScore, scores.lightScore, newStatus, true)
      }

      const messages: string[] = []
      if (newStatus === 'final') messages.push(`Game ${matchWithDetails.match.matchNumber} finalized and standings updated.`)
      if (result.advancedMatches.length > 0) messages.push(`Updated participant assignments in ${result.advancedMatches.map(match => `Game ${match.matchNumber}`).join(', ')}.`)
      if (result.invalidatedMatchIds.length > 0) messages.push(`${result.invalidatedMatchIds.length} downstream game${result.invalidatedMatchIds.length === 1 ? '' : 's'} reopened and cleared for review.`)
      setOperationMessage(messages.join(' '))
      await loadMatches()
      setSaveStates(current => ({ ...current, [matchId]: 'saved' }))
    } catch (error) {
      console.error('Error updating match:', error)
      alert(`Failed to update match: ${error}`)
      setSaveStates(current => ({ ...current, [matchId]: 'error' }))
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

  const renderOperationalCard = (item: MatchWithDetails) => {
    const { match, division, pool } = item
    const scores = editedScores[match.id] || { darkScore: 0, lightScore: 0 }
    const isSaving = savingMatchId === match.id
    const adjust = (side: 'dark' | 'light', amount: number) => {
      const key = side === 'dark' ? 'darkScore' : 'lightScore'
      setEditedScores(current => ({ ...current, [match.id]: { ...scores, [key]: Math.max(0, scores[key] + amount) } }))
    }
    return <article key={match.id} className={`rounded-xl border bg-white p-4 shadow-sm ${match.status === 'in_progress' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2"><span className="text-lg font-bold" style={{ color: 'var(--ks-text)' }}>Game {match.matchNumber}</span>{getStatusBadge(match.status)}</div>
        <div className="text-right text-sm text-gray-600"><strong>{getDayOfWeek(match.scheduledDate)} {match.scheduledTime}</strong><br />{pool.name} · {division.name}</div>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {(['dark', 'light'] as const).map((side, index) => <div key={side} className={index ? 'text-right' : ''}>
          <p className="min-h-12 text-base font-bold leading-tight" style={{ color: 'var(--ks-text)' }}>{participantName(item, side)}</p>
          <div className={`mt-3 flex items-center gap-2 ${index ? 'justify-end' : ''}`}>
            <button type="button" aria-label={`Decrease ${side} score for Game ${match.matchNumber}`} onClick={() => adjust(side, -1)} disabled={match.status === 'final' || isSaving} className="h-11 w-11 rounded-lg border border-gray-300 text-2xl font-bold text-gray-700 disabled:opacity-30">−</button>
            <input aria-label={`${side} score for Game ${match.matchNumber}`} type="number" min="0" step="1" value={side === 'dark' ? scores.darkScore : scores.lightScore} onChange={event => handleScoreChange(match.id, side, event.target.value)} disabled={match.status === 'final' || isSaving} className="h-14 w-20 rounded-lg border-2 border-gray-300 text-center text-3xl font-bold disabled:bg-gray-100" />
            <button type="button" aria-label={`Increase ${side} score for Game ${match.matchNumber}`} onClick={() => adjust(side, 1)} disabled={match.status === 'final' || isSaving} className="h-11 w-11 rounded-lg border border-gray-300 text-2xl font-bold text-gray-700 disabled:opacity-30">+</button>
          </div>
        </div>).reduce<React.ReactNode[]>((nodes, node, index) => index === 0 ? [node, <span key="versus" className="text-sm font-semibold text-gray-400">VS</span>] : [...nodes, node], [])}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <span className={`text-sm font-medium ${!isOnline || saveStates[match.id] === 'error' ? 'text-red-700' : saveStates[match.id] === 'saved' ? 'text-emerald-700' : 'text-gray-500'}`}>{!isOnline ? 'Offline — changes cannot be saved' : saveStates[match.id] === 'saving' ? 'Saving…' : saveStates[match.id] === 'saved' ? '✓ Saved' : saveStates[match.id] === 'error' ? 'Save failed — retry' : 'Not changed'}</span>
        <div className="flex gap-2">{match.status === 'final' ? <button type="button" onClick={() => handleSetStatus(match.id, 'scheduled')} disabled={isSaving || !isOnline} className="rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-40">Correct result</button> : <>{match.status !== 'in_progress' && <button type="button" onClick={() => handleSetStatus(match.id, 'in_progress')} disabled={isSaving || !isOnline} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Start game</button>}<button type="button" onClick={() => handleSetStatus(match.id, 'final')} disabled={isSaving || !isOnline || !item.darkTeam || !item.lightTeam} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Finalize score</button></>}</div>
      </div>
    </article>
  }

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
            color: 'var(--ks-text)',
            margin: 0
          }}>
            Scorekeeper
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--ks-text-muted)',
            marginTop: '8px'
          }}>
            Enter scores and finalize matches
          </p>
        </div>

        {!isOnline && <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 font-semibold text-red-900">Offline: scores remain visible, but Start, Finalize, and Correct are disabled until the connection returns.</div>}
        {operationMessage && <div className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 font-medium text-emerald-900"><span>{operationMessage}</span><button type="button" onClick={() => setOperationMessage('')} className="text-sm font-bold text-emerald-800">Dismiss</button></div>}

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
                  color: 'var(--ks-text-secondary)',
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
                  color: 'var(--ks-text-secondary)',
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
                color: 'var(--ks-text-secondary)'
              }}>
                Show full team names
              </span>
            </label>
          </div>
        </div>

        {!loadingMatches && matches.length > 0 && <div className="mb-8 grid gap-8">
          <section>
            <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Now</p><h2 className="text-xl font-bold text-gray-950">Current games</h2></div><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">{queue.current.length} active</span></div>
            {queue.current.length ? <div className="grid gap-4 xl:grid-cols-2">{queue.current.map(renderOperationalCard)}</div> : <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-gray-600">No game is currently in progress. Start the next game when its table reports ready.</div>}
          </section>
          <section>
            <div className="mb-3"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Up next</p><h2 className="text-xl font-bold text-gray-950">Upcoming games</h2></div>
            {queue.next.length ? <div className="grid gap-4 xl:grid-cols-2">{queue.next.map(renderOperationalCard)}</div> : <p className="rounded-lg border border-gray-200 bg-white p-5 text-gray-600">No future scheduled games in this view.</p>}
          </section>
          <section>
            <div className="mb-3"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Recently completed</p><h2 className="text-xl font-bold text-gray-950">Final scores</h2></div>
            {queue.recent.length ? <div className="grid gap-4 xl:grid-cols-2">{queue.recent.map(renderOperationalCard)}</div> : <p className="rounded-lg border border-gray-200 bg-white p-5 text-gray-600">No completed games yet.</p>}
          </section>
        </div>}

        <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Full schedule</p><h2 className="text-xl font-bold text-gray-950">All games</h2></div><button type="button" onClick={() => setShowAllGames(current => !current)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">{showAllGames ? 'Hide table' : 'Show table'}</button></div>
        {/* Matches Table */}
        <div className={`bg-white rounded-lg shadow overflow-hidden ${showAllGames ? '' : 'hidden'}`}>
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
                    const { match, division, pool } = matchWithDetails
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
                          color: 'var(--ks-text)',
                          borderRight: '1px solid #e5e7eb',
                          textAlign: 'center',
                          whiteSpace: showTeamNames ? 'nowrap' : 'normal',
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                          {participantName(matchWithDetails, 'dark')}
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
                          color: 'var(--ks-text)',
                          borderRight: '1px solid #e5e7eb',
                          textAlign: 'center',
                          whiteSpace: showTeamNames ? 'nowrap' : 'normal',
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                          {participantName(matchWithDetails, 'light')}
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
