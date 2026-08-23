import { useEffect, useMemo, useState } from 'react'
import PublicNav from '../../components/layout/PublicNav'
import { getAllTournaments } from '../../services/tournaments'
import { getAllMatches } from '../../services/matches'
import { getAllTeams } from '../../services/teams'
import { getAllClubs } from '../../services/clubs'
import { getAllDivisions } from '../../services/divisions'
import { getAllPools } from '../../services/pools'
import type { Club, Division, Match, Pool, Team, Tournament } from '../../types'
import { bracketColumns, bracketEdges, provisionalParticipantLabel } from '../../utils/bracketGraph'
import { teamPublicName } from '../../utils/teamIdentity'

const isBracketMatch = (match: Match) => match.roundType === 'semi' || match.roundType === 'final' || match.roundType === 'placement'
const formatTime = (time: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(`2026-01-01T${time}:00`))

function roundTitle(matches: Match[], index: number, total: number): string {
  if (matches.every(match => match.roundType === 'semi')) return 'Semifinals'
  if (matches.every(match => match.roundType === 'final')) return 'Finals'
  if (matches.every(match => match.roundType === 'placement')) return total === 1 ? 'Placement games' : index === total - 1 ? 'Final placements' : 'Placement round'
  return index === total - 1 ? 'Final round' : `Round ${index + 1}`
}

interface MatchCardProps {
  match: Match
  allMatches: Match[]
  teams: Team[]
  clubs: Club[]
  pools: Pool[]
  outgoing: ReturnType<typeof bracketEdges>
}

function MatchCard({ match, allMatches, teams, clubs, pools, outgoing }: MatchCardProps) {
  const teamById = new Map(teams.map(team => [team.id, team]))
  const clubById = new Map(clubs.map(club => [club.id, club]))
  const final = match.status === 'final' || match.status === 'forfeit'
  const darkWon = final && (match.darkTeamScore ?? 0) > (match.lightTeamScore ?? 0)
  const lightWon = final && (match.lightTeamScore ?? 0) > (match.darkTeamScore ?? 0)
  const participant = (side: 'dark' | 'light') => {
    const team = teamById.get(side === 'dark' ? match.darkTeamId : match.lightTeamId)
    const provisional = provisionalParticipantLabel(match, side, allMatches)
    return { name: team ? teamPublicName(team, clubById.get(team.clubId)) : provisional, provisional: team && provisional && provisional !== 'To be determined' ? provisional : '' }
  }
  const dark = participant('dark')
  const light = participant('light')
  const purpose = match.bracketRef || (match.roundType === 'semi' ? 'Semifinal' : match.roundType === 'final' ? 'Championship' : 'Placement')

  return <article className="relative rounded-xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="flex items-center justify-between rounded-t-[10px] bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"><span>{purpose}</span><span>Game {match.matchNumber}</span></div>
    {([{ data: dark, score: match.darkTeamScore, won: darkWon }, { data: light, score: match.lightTeamScore, won: lightWon }] as const).map((row, index) => <div key={index} className={`flex min-h-16 items-center justify-between gap-3 px-4 py-3 ${index === 0 ? 'border-b border-slate-200 dark:border-slate-700' : ''} ${row.won ? 'bg-blue-50 dark:bg-blue-950' : ''}`}><div className="min-w-0"><div className={`truncate text-sm ${row.won ? 'font-black text-blue-950 dark:text-blue-100' : 'font-bold text-slate-900 dark:text-white'}`}>{row.data.name}</div>{row.data.provisional && <div className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{row.data.provisional}</div>}</div><div className={`text-2xl font-black tabular-nums ${row.won ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{final || match.status === 'in_progress' ? row.score ?? '–' : '–'}</div></div>)}
    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><span>{match.status === 'in_progress' ? '● Live' : final ? 'Final' : `${match.scheduledDate} · ${formatTime(match.scheduledTime)}`}</span><span>{pools.find(pool => pool.id === match.poolId)?.name}</span></div>
    {outgoing.length > 0 && <div className="rounded-b-[10px] border-t border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900">{outgoing.map(edge => { const target = allMatches.find(candidate => candidate.id === edge.targetMatchId); return <div key={`${edge.targetMatchId}-${edge.outcome}`}>{edge.outcome === 'winner' ? 'Winner' : 'Loser'} → Game {target?.matchNumber ?? '?'}</div> })}</div>}
  </article>
}

function DivisionBracket({ division, matches, teams, clubs, pools }: { division: Division; matches: Match[]; teams: Team[]; clubs: Club[]; pools: Pool[] }) {
  const columns = bracketColumns(matches)
  const edges = bracketEdges(matches)
  return <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700"><span className="h-8 w-3 rounded-full" style={{ backgroundColor: division.colorHex }} /><div><h2 className="text-xl font-black text-slate-950 dark:text-white">{division.name}</h2><p className="text-sm text-slate-600 dark:text-slate-300">Follow each winner and loser arrow to the next game.</p></div></div>
    <div className="overflow-x-auto p-5"><div className="grid min-w-max auto-cols-[280px] grid-flow-col gap-10">
      {columns.map((column, columnIndex) => <div key={columnIndex} className="relative"><h3 className="mb-4 text-center text-xs font-black uppercase tracking-[0.16em] text-slate-500">{roundTitle(column, columnIndex, columns.length)}</h3><div className="space-y-5">{column.map(match => <MatchCard key={match.id} match={match} allMatches={matches} teams={teams} clubs={clubs} pools={pools} outgoing={edges.filter(edge => edge.sourceMatchId === match.id)} />)}</div>{columnIndex < columns.length - 1 && <div aria-hidden="true" className="absolute -right-8 top-1/2 text-3xl font-black text-blue-300">→</div>}</div>)}
    </div></div>
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
        const [allTournaments, allMatches, allTeams, allClubs, allDivisions, allPools] = await Promise.all([getAllTournaments(), getAllMatches(), getAllTeams(), getAllClubs(), getAllDivisions(), getAllPools()])
        const published = allTournaments.filter(tournament => tournament.isPublished)
        setTournaments(published); setMatches(allMatches); setTeams(allTeams); setClubs(allClubs); setDivisions(allDivisions); setPools(allPools)
        const today = new Date()
        const active = published.find(tournament => tournament.startDate <= today && tournament.endDate >= today) || published[0]
        setSelectedTournamentId(active?.id || '')
      } catch (loadError) { console.error('Unable to load brackets:', loadError); setError('Brackets could not be loaded. Please try again shortly.') } finally { setLoading(false) }
    }
    void load()
  }, [])

  useEffect(() => {
    const refresh = window.setInterval(() => { void getAllMatches().then(setMatches).catch(refreshError => console.error('Unable to refresh brackets:', refreshError)) }, 30_000)
    return () => window.clearInterval(refresh)
  }, [])

  const tournamentMatches = useMemo(() => matches.filter(match => match.tournamentId === selectedTournamentId && isBracketMatch(match) && match.status !== 'cancelled'), [matches, selectedTournamentId])
  const divisionIds = new Set(tournamentMatches.map(match => match.divisionId))
  const visibleDivisions = divisions.filter(division => divisionIds.has(division.id) && (selectedDivisionId === 'all' || selectedDivisionId === division.id)).sort((a, b) => a.name.localeCompare(b.name))

  return <div className="min-h-screen bg-slate-100 pb-12 dark:bg-slate-950"><PublicNav />
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Tournament paths</p><h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">Brackets & placement</h1><p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">These paths reflect KrakenScores’ hybrid pool, seed, placement, and elimination format—not a one-size-fits-all bracket.</p></div></header>
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900"><label className="text-sm font-bold text-slate-800 dark:text-slate-200">Tournament<select value={selectedTournamentId} onChange={event => { setSelectedTournamentId(event.target.value); setSelectedDivisionId('all') }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-600 dark:bg-slate-800">{tournaments.map(tournament => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select></label><label className="text-sm font-bold text-slate-800 dark:text-slate-200">Division<select value={selectedDivisionId} onChange={event => setSelectedDivisionId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-600 dark:bg-slate-800"><option value="all">All divisions</option>{divisions.filter(division => divisionIds.has(division.id)).sort((a, b) => a.name.localeCompare(b.name)).map(division => <option key={division.id} value={division.id}>{division.name}</option>)}</select></label></div>
      {loading && <div className="rounded-xl bg-white p-10 text-center font-bold text-slate-600">Loading brackets…</div>}
      {error && <div className="rounded-xl border border-red-300 bg-red-50 p-4 font-bold text-red-900">{error}</div>}
      {!loading && !error && visibleDivisions.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600"><div className="font-bold text-slate-900">No playoff or placement games yet.</div><p className="mt-1">Bracket paths appear when those games are scheduled.</p></div>}
      {!loading && visibleDivisions.map(division => <DivisionBracket key={division.id} division={division} matches={tournamentMatches.filter(match => match.divisionId === division.id)} teams={teams} clubs={clubs} pools={pools} />)}
    </main>
  </div>
}
