import { useEffect, useMemo, useRef, useState } from 'react'
import { Gracket } from 'gracket'
import type { Team as GracketTeam, TournamentData } from 'gracket'
import 'gracket/style.css'
import PublicNav from '../../components/layout/PublicNav'
import { getPublishedTournaments } from '../../services/tournaments'
import { getMatchesByTournament } from '../../services/matches'
import { getTeamsByTournament } from '../../services/teams'
import { getAllClubs } from '../../services/clubs'
import { getAllDivisions } from '../../services/divisions'
import { getPoolsByTournament } from '../../services/pools'
import type { Club, Division, Match, Pool, Team, Tournament } from '../../types'
import { bracketColumns, bracketEdges, isProgressionMatch, matchBracketGroup, provisionalParticipantLabel } from '../../utils/bracketGraph'
import { teamPublicName } from '../../utils/teamIdentity'
import './Brackets.css'

const formatTime = (time: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(`2026-01-01T${time}:00`))

function roundTitle(matches: Match[], index: number, total: number): string {
  if (matches.every(match => match.roundType === 'semi')) return 'Semifinals'
  if (matches.every(match => match.roundType === 'final')) return 'Finals'
  if (matches.every(match => match.roundType === 'placement')) return total === 1 ? 'Placement games' : index === total - 1 ? 'Final placements' : 'Placement round'
  return index === total - 1 ? 'Final round' : `Round ${index + 1}`
}

function safeMarkup(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!)
}

function safeClassId(value: string): string {
  return `team-${value.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

function gracketParticipant(match: Match, side: 'dark' | 'light', allMatches: Match[], teams: Team[], clubs: Club[]): GracketTeam {
  const teamById = new Map(teams.map(team => [team.id, team]))
  const clubById = new Map(clubs.map(club => [club.id, club]))
  const teamId = side === 'dark' ? match.darkTeamId : match.lightTeamId
  const team = teamById.get(teamId)
  const provisional = provisionalParticipantLabel(match, side, allMatches)
  const participantName = team ? teamPublicName(team, clubById.get(team.clubId)) : provisional
  const score = side === 'dark' ? match.darkTeamScore : match.lightTeamScore
  const result: GracketTeam = {
    name: safeMarkup(`${participantName} · Game ${match.matchNumber}`),
    id: safeClassId(team?.id || `${match.id}-${side}`),
    seed: team?.seedRank ?? match.matchNumber,
    displaySeed: team?.bracket ? `${safeMarkup(team.bracket)}${team.seedRank ?? ''}` : `G${match.matchNumber}`,
  }
  if ((match.status === 'in_progress' || match.status === 'final' || match.status === 'forfeit') && score !== undefined) result.score = score
  return result
}

function GracketView({ data, labels, label }: { data: TournamentData; labels: string[]; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return
    const gracket = new Gracket(containerRef.current, {
      src: data,
      roundLabels: labels,
      canvasLineColor: '#2563eb',
      canvasLineWidth: 3,
      cornerRadius: 10,
      showByeGames: true,
      byeLabel: 'To be determined',
    })
    return () => gracket.destroy()
  }, [data, labels])

  return <div className="krakenscores-gracket overflow-x-auto rounded-xl" role="img" aria-label={label}><div ref={containerRef} /></div>
}

function gracketData(matches: Match[], allMatches: Match[], teams: Team[], clubs: Club[]): TournamentData {
  return bracketColumns(matches).map(column => column.map(match => [
    gracketParticipant(match, 'dark', allMatches, teams, clubs),
    gracketParticipant(match, 'light', allMatches, teams, clubs),
  ]))
}

function DivisionBracket({ division, matches, teams, clubs, pools }: { division: Division; matches: Match[]; teams: Team[]; clubs: Club[]; pools: Pool[] }) {
  const progressionMatches = matches.filter(isProgressionMatch)
  const scheduledMatches = matches.filter(match => !isProgressionMatch(match))
  const scheduledGroups = [...new Set(scheduledMatches.map(match => matchBracketGroup(match, teams)))].sort()
  const progressionData = useMemo(() => gracketData(progressionMatches, matches, teams, clubs), [progressionMatches, matches, teams, clubs])
  const progressionLabels = useMemo(() => bracketColumns(progressionMatches).map((column, index, columns) => roundTitle(column, index, columns.length)), [progressionMatches])
  const edges = bracketEdges(progressionMatches)

  return <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700"><span className="h-8 w-3 rounded-full" style={{ backgroundColor: division.colorHex }} /><div><h2 className="text-xl font-black text-slate-950 dark:text-white">{division.name}</h2><p className="text-sm text-slate-600 dark:text-slate-300">Every scheduled pairing appears now; scores and advancement update throughout the tournament.</p></div></div>
    <div className="space-y-7 p-5">
      {scheduledGroups.map(group => {
        const groupMatches = scheduledMatches.filter(match => matchBracketGroup(match, teams) === group)
        const data = gracketData(groupMatches, matches, teams, clubs)
        return <div key={group}><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">{group === 'Tournament' ? 'Scheduled matchups' : `Bracket ${group}`}</h3><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{groupMatches.length} game{groupMatches.length === 1 ? '' : 's'} currently scheduled</p></div></div><GracketView data={data} labels={['Scheduled matchups']} label={`${division.name} ${group} scheduled matchups`} /></div>
      })}
      {progressionMatches.length > 0 && <div><div className="mb-3"><h3 className="text-sm font-black uppercase tracking-[0.14em] text-blue-800 dark:text-blue-300">Championship & placement paths</h3><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{edges.length > 0 ? 'Connected lines show configured winner and loser progression.' : 'Placement pairings will update as results are finalized.'}</p></div><GracketView data={progressionData} labels={progressionLabels} label={`${division.name} championship and placement progression`} /></div>}
      <details className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"><summary className="cursor-pointer font-bold text-slate-700 dark:text-slate-200">Game times and pools</summary><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{[...matches].sort((a, b) => a.matchNumber - b.matchNumber).map(match => <div key={match.id} className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300"><span className="font-black text-slate-900 dark:text-white">Game {match.matchNumber}</span> · {match.scheduledDate} · {formatTime(match.scheduledTime)} · {pools.find(pool => pool.id === match.poolId)?.name || 'Pool TBD'}</div>)}</div></details>
    </div>
  </section>
}

export default function Brackets() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState('')
  const [selectedDivisionId, setSelectedDivisionId] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [allTournaments, allClubs, allDivisions] = await Promise.all([getPublishedTournaments(), getAllClubs(), getAllDivisions()])
        const published = allTournaments.filter(tournament => tournament.isPublished)
        setTournaments(published); setClubs(allClubs); setDivisions(allDivisions)
        const today = new Date()
        const active = published.find(tournament => tournament.startDate <= today && tournament.endDate >= today) || published[0]
        setSelectedTournamentId(active?.id || '')
      } catch (loadError) { console.error('Unable to load brackets:', loadError); setError('Brackets could not be loaded. Please try again shortly.') } finally { setLoading(false) }
    }
    void load()
  }, [])

  useEffect(() => {
    if (!selectedTournamentId) return
    let active = true
    setMatches([]); setTeams([]); setPools([])
    const load = async () => {
      try {
        const [nextMatches, nextTeams, nextPools] = await Promise.all([
          getMatchesByTournament(selectedTournamentId),
          getTeamsByTournament(selectedTournamentId),
          getPoolsByTournament(selectedTournamentId),
        ])
        if (!active) return
        setMatches(nextMatches); setTeams(nextTeams); setPools(nextPools); setError('')
      } catch (loadError) {
        console.error('Unable to load brackets:', loadError)
        if (active) {
          setMatches([]); setTeams([]); setPools([])
          setError('This tournament is unavailable. Please refresh the page.')
        }
      }
    }
    void load()
    const refresh = window.setInterval(() => { void load() }, 30_000)
    return () => { active = false; window.clearInterval(refresh) }
  }, [selectedTournamentId])

  const tournamentMatches = useMemo(() => matches.filter(match => match.tournamentId === selectedTournamentId && match.status !== 'cancelled'), [matches, selectedTournamentId])
  const divisionIds = new Set(tournamentMatches.map(match => match.divisionId))
  const visibleDivisions = divisions.filter(division => divisionIds.has(division.id) && (selectedDivisionId === 'all' || selectedDivisionId === division.id)).sort((a, b) => a.name.localeCompare(b.name))

  return <div className="min-h-screen bg-slate-100 pb-12 dark:bg-slate-950"><PublicNav />
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Tournament paths</p><h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">Brackets & placement</h1><p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">These paths reflect KrakenScores’ hybrid pool, seed, placement, and elimination format—not a one-size-fits-all bracket.</p></div></header>
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900"><label className="text-sm font-bold text-slate-800 dark:text-slate-200">Tournament<select value={selectedTournamentId} onChange={event => { setSelectedTournamentId(event.target.value); setSelectedDivisionId('all') }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-600 dark:bg-slate-800">{tournaments.map(tournament => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select></label><label className="text-sm font-bold text-slate-800 dark:text-slate-200">Division<select value={selectedDivisionId} onChange={event => setSelectedDivisionId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-600 dark:bg-slate-800"><option value="all">All divisions</option>{divisions.filter(division => divisionIds.has(division.id)).sort((a, b) => a.name.localeCompare(b.name)).map(division => <option key={division.id} value={division.id}>{division.name}</option>)}</select></label></div>
      {loading && <div className="rounded-xl bg-white p-10 text-center font-bold text-slate-600">Loading brackets…</div>}
      {error && <div className="rounded-xl border border-red-300 bg-red-50 p-4 font-bold text-red-900">{error}</div>}
      {!loading && !error && visibleDivisions.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600"><div className="font-bold text-slate-900">No games are scheduled yet.</div><p className="mt-1">Pairings and bracket paths will appear as soon as the schedule is published.</p></div>}
      {!loading && visibleDivisions.map(division => <DivisionBracket key={division.id} division={division} matches={tournamentMatches.filter(match => match.divisionId === division.id)} teams={teams} clubs={clubs} pools={pools} />)}
    </main>
  </div>
}
