import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Match, Tournament, Division, Team, Club, Pool } from '../../types/index'
import { format, parseISO } from 'date-fns'
import PublicNav from '../../components/layout/PublicNav'
import SortableMatchTable from '../../components/SortableMatchTable'

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

export default function MasterSchedule() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all')
  const [showFullClubNames, setShowFullClubNames] = useState<boolean>(false)

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

  // Filter matches (sorting is handled by SortableMatchTable component)
  const filteredMatches = useMemo(() => {
    // Filter by division
    if (selectedDivisionId !== 'all') {
      return matches.filter(m => m.division.id === selectedDivisionId)
    }
    return matches
  }, [matches, selectedDivisionId])

  // Group matches by day
  const groupedMatches = useMemo(() => {
    const selectedTournament = tournaments.find(t => t.id === selectedTournamentId)
    if (!selectedTournament) return {}

    const groups: GroupedMatches = {}

    filteredMatches.forEach(m => {
      const day = m.match.scheduledDate || format(selectedTournament.startDate, 'yyyy-MM-dd')
      if (!groups[day]) {
        groups[day] = []
      }
      groups[day].push(m)
    })

    return groups
  }, [filteredMatches, selectedTournamentId, tournaments])

  // Get sorted days
  const sortedDays = useMemo(() => {
    return Object.keys(groupedMatches).sort()
  }, [groupedMatches])

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId)

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
      {/* Public Navigation Menu */}
      <PublicNav />

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
                <SortableMatchTable
                  matches={groupedMatches[day]}
                  showFullClubNames={showFullClubNames}
                />
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
