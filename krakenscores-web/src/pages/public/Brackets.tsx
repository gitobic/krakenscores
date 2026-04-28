import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Match, Tournament, Division, Team, Club } from '../../types/index'
import PublicNav from '../../components/layout/PublicNav'

interface MatchWithDetails {
  match: Match
  division: Division
  darkTeam: Team
  lightTeam: Team
  darkTeamClub: Club
  lightTeamClub: Club
}

interface BracketRound {
  name: string
  matches: MatchWithDetails[]
}

export default function Brackets() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all')

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
      // Load published tournaments
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

      // Load all divisions
      const divisionsSnapshot = await getDocs(collection(db, 'divisions'))
      const divisionsData = divisionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Division))
      setDivisions(divisionsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMatches = async () => {
    if (!selectedTournamentId) return

    try {
      setLoading(true)

      // Load playoff/bracket matches only (semi, final, placement)
      const matchesSnapshot = await getDocs(
        query(
          collection(db, 'matches'),
          where('tournamentId', '==', selectedTournamentId)
        )
      )

      const matchesData = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Match))

      // Filter to only bracket matches
      const bracketMatches = matchesData.filter(
        m => m.roundType === 'semi' || m.roundType === 'final' || m.roundType === 'placement'
      )

      // Load teams and clubs
      const teamsSnapshot = await getDocs(collection(db, 'teams'))
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Team))

      const clubsSnapshot = await getDocs(collection(db, 'clubs'))
      const clubs = clubsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Club))

      const divisionsSnapshot = await getDocs(collection(db, 'divisions'))
      const divsData = divisionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Division))

      // Combine data
      const matchesWithDetails: MatchWithDetails[] = bracketMatches.map(match => {
        const division = divsData.find(d => d.id === match.divisionId)!
        const darkTeam = teams.find(t => t.id === match.darkTeamId)!
        const lightTeam = teams.find(t => t.id === match.lightTeamId)!
        const darkTeamClub = clubs.find(c => c.id === darkTeam?.clubId)!
        const lightTeamClub = clubs.find(c => c.id === lightTeam?.clubId)!

        return {
          match,
          division,
          darkTeam,
          lightTeam,
          darkTeamClub,
          lightTeamClub
        }
      })

      setMatches(matchesWithDetails)
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter matches by selected division
  const filteredMatches = useMemo(() => {
    if (selectedDivisionId === 'all') return matches
    return matches.filter(m => m.match.divisionId === selectedDivisionId)
  }, [matches, selectedDivisionId])

  // Group matches by division
  const divisionBrackets = useMemo(() => {
    const grouped: Record<string, MatchWithDetails[]> = {}

    filteredMatches.forEach(m => {
      const divId = m.match.divisionId
      if (!grouped[divId]) {
        grouped[divId] = []
      }
      grouped[divId].push(m)
    })

    return grouped
  }, [filteredMatches])

  // Get divisions that have brackets
  const divisionsWithBrackets = useMemo(() => {
    return divisions.filter(d => divisionBrackets[d.id]?.length > 0)
  }, [divisions, divisionBrackets])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <PublicNav />

      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '24px 16px',
        marginBottom: '24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px',
            margin: 0
          }}>
            Tournament Brackets
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Playoff and championship matches
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px 40px 16px'
      }}>
        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            {/* Tournament Filter */}
            <div>
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
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#111827'
                }}
              >
                <option value="">Select Tournament</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Division Filter */}
            <div>
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
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#111827'
                }}
              >
                <option value="all">All Divisions</option>
                {divisionsWithBrackets.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            Loading brackets...
          </div>
        )}

        {/* No Brackets Message */}
        {!loading && filteredMatches.length === 0 && selectedTournamentId && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0
            }}>
              No playoff brackets found for this tournament.
            </p>
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              marginTop: '8px'
            }}>
              Brackets will appear once playoff matches are scheduled.
            </p>
          </div>
        )}

        {/* Brackets by Division */}
        {!loading && Object.entries(divisionBrackets).map(([divisionId, divMatches]) => {
          const division = divisions.find(d => d.id === divisionId)
          if (!division) return null

          return (
            <DivisionBracket
              key={divisionId}
              division={division}
              matches={divMatches}
            />
          )
        })}
      </main>
    </div>
  )
}

interface DivisionBracketProps {
  division: Division
  matches: MatchWithDetails[]
}

function DivisionBracket({ division, matches }: DivisionBracketProps) {
  // Organize matches by round
  const rounds: BracketRound[] = useMemo(() => {
    const semis = matches.filter(m => m.match.roundType === 'semi')
    const finals = matches.filter(m => m.match.roundType === 'final' && !m.match.bracketRef?.includes('rd'))
    const placements = matches.filter(m => m.match.roundType === 'placement')

    const result: BracketRound[] = []

    if (semis.length > 0) {
      result.push({ name: 'Semi-Finals', matches: semis })
    }
    if (finals.length > 0) {
      result.push({ name: 'Finals', matches: finals })
    }
    if (placements.length > 0) {
      result.push({ name: 'Placement', matches: placements })
    }

    return result
  }, [matches])

  if (rounds.length === 0) return null

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
      border: '1px solid #e5e7eb'
    }}>
      {/* Division Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          backgroundColor: division.colorHex
        }} />
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          {division.name}
        </h2>
      </div>

      {/* Rounds */}
      <div style={{
        display: 'flex',
        gap: '32px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {rounds.map(round => (
          <BracketRoundColumn key={round.name} round={round} />
        ))}
      </div>
    </div>
  )
}

interface BracketRoundColumnProps {
  round: BracketRound
}

function BracketRoundColumn({ round }: BracketRoundColumnProps) {
  return (
    <div style={{
      minWidth: '280px',
      flex: '0 0 auto'
    }}>
      {/* Round Title */}
      <h3 style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        {round.name}
      </h3>

      {/* Matches */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {round.matches.map(m => (
          <BracketMatchCard key={m.match.id} matchWithDetails={m} />
        ))}
      </div>
    </div>
  )
}

interface BracketMatchCardProps {
  matchWithDetails: MatchWithDetails
}

function BracketMatchCard({ matchWithDetails }: BracketMatchCardProps) {
  const { match, darkTeam, lightTeam, darkTeamClub, lightTeamClub } = matchWithDetails

  const darkWon = match.status === 'final' && (match.darkTeamScore || 0) > (match.lightTeamScore || 0)
  const lightWon = match.status === 'final' && (match.lightTeamScore || 0) > (match.darkTeamScore || 0)

  return (
    <div style={{
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: 'white'
    }}>
      {/* Match Info Header */}
      {match.bracketRef && (
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '8px 12px',
          borderBottom: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {match.bracketRef}
          </span>
        </div>
      )}

      {/* Dark Team */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: darkWon ? '#eff6ff' : 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: darkWon ? '700' : '600',
            color: '#111827'
          }}>
            {darkTeamClub?.abbreviation || 'TBD'}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {darkTeam?.name || 'To Be Determined'}
          </div>
        </div>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: darkWon ? '#2563eb' : '#6b7280',
          minWidth: '32px',
          textAlign: 'right'
        }}>
          {match.status === 'final' ? (match.darkTeamScore ?? '-') : '-'}
        </div>
      </div>

      {/* Light Team */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: lightWon ? '#eff6ff' : 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: lightWon ? '700' : '600',
            color: '#111827'
          }}>
            {lightTeamClub?.abbreviation || 'TBD'}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {lightTeam?.name || 'To Be Determined'}
          </div>
        </div>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: lightWon ? '#2563eb' : '#6b7280',
          minWidth: '32px',
          textAlign: 'right'
        }}>
          {match.status === 'final' ? (match.lightTeamScore ?? '-') : '-'}
        </div>
      </div>

      {/* Match Status Footer */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '8px 12px',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <span style={{
          fontSize: '11px',
          color: '#6b7280'
        }}>
          {match.status === 'final' ? 'Final' :
           match.status === 'in_progress' ? 'In Progress' :
           `${match.scheduledDate} ${match.scheduledTime}`}
        </span>
      </div>
    </div>
  )
}
