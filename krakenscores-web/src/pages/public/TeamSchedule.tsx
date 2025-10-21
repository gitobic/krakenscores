import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Match, Tournament, Division, Team, Club, Pool } from '../../types/index'
import { parseISO, format } from 'date-fns'
import PublicNav from '../../components/layout/PublicNav'
import { colors, typography, layoutStyles } from '../../styles/theme'
import SortableTeamScheduleTable from '../../components/SortableTeamScheduleTable'

interface MatchWithDetails {
  match: Match
  division: Division
  pool: Pool
  darkTeam: Team
  lightTeam: Team
  darkTeamClub: Club
  lightTeamClub: Club
}

export default function TeamSchedule() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')

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

  useEffect(() => {
    // When club changes, reset team selection
    setSelectedTeamId('')
  }, [selectedClubId])

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

  const loadMatches = async () => {
    if (!selectedTournamentId) return

    try {
      // Load all related data
      // Note: Teams collection doesn't always have tournamentId, so we load all teams
      // and filter by the teams that are actually in matches for this tournament
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
      const teamsMap = new Map(teamsData.map(t => [t.id, t]))

      const clubsData = clubsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Club))
      setClubs(clubsData)
      const clubsMap = new Map(clubsData.map(c => [c.id, c]))

      const poolsMap = new Map(poolsSnap.docs.map(doc => [doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Pool]))

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
        .filter(m => m.match.status !== 'cancelled')

      setMatches(matchesWithDetails)

      // Extract teams that are actually in matches for this tournament
      const teamIdsInMatches = new Set<string>()
      matchesWithDetails.forEach(m => {
        teamIdsInMatches.add(m.match.darkTeamId)
        teamIdsInMatches.add(m.match.lightTeamId)
      })
      const teamsInTournament = teamsData.filter(t => teamIdsInMatches.has(t.id))
      setTeams(teamsInTournament)
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  // Get clubs that have teams in the selected tournament
  const availableClubs = useMemo(() => {
    const clubIds = new Set(teams.map(t => t.clubId))
    return clubs.filter(c => clubIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [clubs, teams])

  // Get teams for the selected club
  const availableTeams = useMemo(() => {
    if (!selectedClubId) return []
    return teams.filter(t => t.clubId === selectedClubId).sort((a, b) => a.name.localeCompare(b.name))
  }, [teams, selectedClubId])

  // Filter matches by club or team
  const filteredMatches = useMemo(() => {
    let filtered = matches

    // Filter by team (most specific)
    if (selectedTeamId) {
      filtered = filtered.filter(m =>
        m.match.darkTeamId === selectedTeamId || m.match.lightTeamId === selectedTeamId
      )
    }
    // Filter by club (if no team selected)
    else if (selectedClubId) {
      filtered = filtered.filter(m =>
        m.darkTeamClub.id === selectedClubId || m.lightTeamClub.id === selectedClubId
      )
    }

    // Sort by date, then time, then match number
    return filtered.sort((a, b) => {
      const dateCompare = (a.match.scheduledDate || '').localeCompare(b.match.scheduledDate || '')
      if (dateCompare !== 0) return dateCompare

      const timeCompare = a.match.scheduledTime.localeCompare(b.match.scheduledTime)
      if (timeCompare !== 0) return timeCompare

      return a.match.matchNumber - b.match.matchNumber
    })
  }, [matches, selectedClubId, selectedTeamId])

  // Group matches by date
  const groupedMatches = useMemo(() => {
    const groups: { [date: string]: MatchWithDetails[] } = {}

    filteredMatches.forEach(m => {
      const date = m.match.scheduledDate || 'TBD'
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(m)
    })

    return groups
  }, [filteredMatches])

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId)
  const selectedClub = clubs.find(c => c.id === selectedClubId)
  const selectedTeam = teams.find(t => t.id === selectedTeamId)

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: typography.fontFamily }}>
        <p style={{ color: colors.gray.medium }}>Loading...</p>
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: typography.fontFamily }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: colors.gray.black }}>No Tournaments Available</h2>
        <p style={{ color: colors.gray.medium }}>There are no published tournaments at this time.</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.gray.bgPage,
      fontFamily: typography.fontFamily
    }}>
      {/* Public Navigation Menu */}
      <PublicNav />

      {/* Header */}
      <div style={layoutStyles.publicHeader}>
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
            Team Schedule
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
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.gray.borderLight}`
      }}>
        {/* Tournament Selector (if multiple tournaments) */}
        {tournaments.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: typography.fontSize.formLabel,
              fontWeight: typography.fontWeight.medium,
              color: colors.gray.dark,
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
                border: `1px solid ${colors.gray.border}`,
                borderRadius: '6px',
                backgroundColor: colors.white,
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

        {/* Club Filter */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: typography.fontSize.formLabel,
            fontWeight: typography.fontWeight.medium,
            color: colors.gray.dark,
            marginBottom: '8px'
          }}>
            Select Club
          </label>
          <select
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: `1px solid ${colors.gray.border}`,
              borderRadius: '6px',
              backgroundColor: colors.white,
              cursor: 'pointer'
            }}
          >
            <option value="">-- Select a Club --</option>
            {availableClubs.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Team Filter (only show if club selected) */}
        {selectedClubId && availableTeams.length > 0 && (
          <div>
            <label style={{
              display: 'block',
              fontSize: typography.fontSize.formLabel,
              fontWeight: typography.fontWeight.medium,
              color: colors.gray.dark,
              marginBottom: '8px'
            }}>
              Select Team (Optional)
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: `1px solid ${colors.gray.border}`,
                borderRadius: '6px',
                backgroundColor: colors.white,
                cursor: 'pointer'
              }}
            >
              <option value="">All {selectedClub?.name} Teams</option>
              {availableTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Filter Display */}
        {(selectedClub || selectedTeam) && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            border: '1px solid #bfdbfe'
          }}>
            <div style={{ fontSize: typography.fontSize.smallText, color: colors.primary.blue, fontWeight: typography.fontWeight.semiBold }}>
              Showing schedule for:
            </div>
            <div style={{ fontSize: '15px', color: colors.primary.darkBlue, fontWeight: typography.fontWeight.bold, marginTop: '4px' }}>
              {selectedTeam ? selectedTeam.name : selectedClub?.name}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {!selectedClubId ? (
          <div style={{
            backgroundColor: colors.white,
            padding: '40px 20px',
            textAlign: 'center',
            borderRadius: '8px',
            border: `1px solid ${colors.gray.borderLight}`
          }}>
            <p style={{ color: colors.gray.medium, fontSize: '16px' }}>
              Please select a club to view their schedule.
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div style={{
            backgroundColor: colors.white,
            padding: '40px 20px',
            textAlign: 'center',
            borderRadius: '8px',
            border: `1px solid ${colors.gray.borderLight}`
          }}>
            <p style={{ color: colors.gray.medium, fontSize: '16px' }}>
              No matches scheduled for {selectedTeam ? selectedTeam.name : selectedClub?.name}.
            </p>
          </div>
        ) : (
          Object.keys(groupedMatches).sort().map(date => (
              <div key={date} style={{ marginBottom: '24px' }}>
                {/* Date Header */}
                <div style={{
                  backgroundColor: colors.gray.black,
                  color: colors.white,
                  padding: '12px 16px',
                  fontSize: typography.fontSize.sectionHeading,
                  fontWeight: typography.fontWeight.semiBold,
                  borderRadius: '6px 6px 0 0',
                  textTransform: 'uppercase' as const
                }}>
                  {date !== 'TBD' ? format(parseISO(date), 'EEEE - MMM d') : 'To Be Determined'}
                </div>

                {/* Matches Table */}
                <div style={{
                  backgroundColor: colors.white,
                  borderRadius: '0 0 6px 6px',
                  overflow: 'hidden',
                  border: `1px solid ${colors.gray.borderLight}`,
                  borderTop: 'none'
                }}>
                  <SortableTeamScheduleTable
                    matches={groupedMatches[date]}
                    selectedClubId={selectedClubId}
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
        color: colors.gray.medium,
        fontSize: typography.fontSize.smallText
      }}>
        <p>KrakenScores - Tournament Management System</p>
      </div>
    </div>
  )
}
