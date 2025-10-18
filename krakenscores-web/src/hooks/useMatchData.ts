import { useState, useEffect } from 'react'
import type { Match, Tournament, Pool, Division, Team, ScheduleBreak, Club } from '../types/index'
import { getAllMatches } from '../services/matches'
import { getAllTournaments } from '../services/tournaments'
import { getAllPools } from '../services/pools'
import { getAllDivisions } from '../services/divisions'
import { getAllTeams } from '../services/teams'
import { getAllScheduleBreaks } from '../services/scheduleBreaks'
import { getAllClubs } from '../services/clubs'

/**
 * Custom hook that loads all data needed for match management
 */
export function useMatchData() {
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [scheduleBreaks, setScheduleBreaks] = useState<ScheduleBreak[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [
        matchesData,
        tournamentsData,
        poolsData,
        divisionsData,
        teamsData,
        breaksData,
        clubsData
      ] = await Promise.all([
        getAllMatches(),
        getAllTournaments(),
        getAllPools(),
        getAllDivisions(),
        getAllTeams(),
        getAllScheduleBreaks(),
        getAllClubs()
      ])

      setMatches(matchesData)
      setTournaments(tournamentsData)
      setPools(poolsData)
      setDivisions(divisionsData)
      setTeams(teamsData)
      setScheduleBreaks(breaksData)
      setClubs(clubsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    matches,
    tournaments,
    pools,
    divisions,
    teams,
    scheduleBreaks,
    clubs,
    loading,
    reload: loadData
  }
}
