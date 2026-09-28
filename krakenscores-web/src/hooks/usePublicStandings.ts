import { useEffect, useState } from 'react'
import type { Club, Division, Match, Standing, Team, Tournament } from '../types'
import { getPublishedTournaments } from '../services/tournaments'
import { getAllDivisions } from '../services/divisions'
import { getAllClubs } from '../services/clubs'
import { getTeamsByTournament } from '../services/teams'
import { loadStandingsSections } from '../services/publicStandings'

export function usePublicStandings() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState('')
  const [standings, setStandings] = useState<Standing[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [standingsLoading, setStandingsLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(true)
  const [referencesLoading, setReferencesLoading] = useState(true)
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [error, setError] = useState('')
  const [standingsError, setStandingsError] = useState('')
  const [resultsError, setResultsError] = useState('')

  useEffect(() => {
    let active = true
    // Shared catalogs can load while the published tournament is being discovered.
    void Promise.all([getAllDivisions(), getAllClubs()]).then(([nextDivisions, nextClubs]) => {
      if (!active) return
      setDivisions(nextDivisions); setClubs(nextClubs)
    }).catch(() => { if (active) setError('Team and division information could not be loaded. Please refresh to retry.') })
      .finally(() => { if (active) setReferencesLoading(false) })
    void getPublishedTournaments().then(data => {
      if (!active) return
      setTournaments(data)
      setSelectedTournamentId(data[0]?.id || '')
    }).catch(() => { if (active) setError('Tournaments could not be loaded. Please refresh to retry.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedTournamentId) return
    let active = true
    setStandings([]); setMatches([]); setTeams([])
    setStandingsLoading(true); setResultsLoading(true); setTeamsLoading(true)
    setStandingsError(''); setResultsError('')
    const cancel = loadStandingsSections(selectedTournamentId, {
      standings: {
        ready: data => { setStandings(data); setStandingsLoading(false) },
        failed: () => { setStandingsError('Standings are unavailable. Please refresh to retry.'); setStandingsLoading(false) },
      },
      results: {
        ready: data => { setMatches(data); setResultsLoading(false) },
        failed: () => { setResultsError('Results are unavailable. Please refresh to retry.'); setResultsLoading(false) },
      },
    })
    void getTeamsByTournament(selectedTournamentId).then(data => {
      if (active) setTeams(data)
    }).catch(() => { if (active) setError('Team information is unavailable. Please refresh to retry.') })
      .finally(() => { if (active) setTeamsLoading(false) })
    return () => { active = false; cancel() }
  }, [selectedTournamentId])

  return { tournaments, selectedTournamentId, setSelectedTournamentId, standings, matches,
    divisions, teams, clubs, loading, error, standingsError, resultsError,
    standingsLoading: loading || standingsLoading || (standings.length > 0 && (referencesLoading || teamsLoading)),
    resultsLoading: loading || resultsLoading || (matches.length > 0 && (referencesLoading || teamsLoading)) }
}
