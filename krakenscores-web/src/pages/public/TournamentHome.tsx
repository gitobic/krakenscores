import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicNav from '../../components/layout/PublicNav'
import { getAllTournaments } from '../../services/tournaments'
import { getAllMatches } from '../../services/matches'
import { getAllTeams } from '../../services/teams'
import { getAllClubs } from '../../services/clubs'
import { getAllDivisions } from '../../services/divisions'
import { getAllPools } from '../../services/pools'
import { getAllAnnouncements } from '../../services/announcements'
import type { Announcement, Club, Division, Match, Pool, Team, Tournament } from '../../types'
import { buildSpectatorQueue, matchIncludesTeams, searchTeams } from '../../utils/spectatorHome'
import { teamPublicName } from '../../utils/teamIdentity'

const FAVORITES_KEY = 'krakenscores.favoriteTeamIds'

interface HomeMatch {
  match: Match
  division?: Division
  pool?: Pool
  darkTeam?: Team
  lightTeam?: Team
  darkClub?: Club
  lightClub?: Club
}

const formatDate = (date: string) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
const formatTime = (time: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(`2026-01-01T${time}:00`))

function MatchCard({ item, favoriteIds }: { item: HomeMatch; favoriteIds: Set<string> }) {
  const { match, division, pool, darkTeam, lightTeam, darkClub, lightClub } = item
  const isFavorite = favoriteIds.has(match.darkTeamId) || favoriteIds.has(match.lightTeamId)
  const final = match.status === 'final' || match.status === 'forfeit'
  return <article className={`overflow-hidden rounded-xl border bg-white shadow-sm ${isFavorite ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}>
    <div className="h-2" style={{ backgroundColor: division?.colorHex || '#64748b' }} />
    <div className="p-4">
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        <span>{division?.name || 'Division'} · Game {match.matchNumber}</span>
        <span>{pool?.name || 'Pool TBD'}</span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2">
        <div className="font-bold text-slate-950">{match.darkTeamLabel || teamPublicName(darkTeam, darkClub)}</div><div className="text-2xl font-black tabular-nums text-slate-950">{final || match.status === 'in_progress' ? match.darkTeamScore ?? '–' : ''}</div>
        <div className="font-bold text-slate-950">{match.lightTeamLabel || teamPublicName(lightTeam, lightClub)}</div><div className="text-2xl font-black tabular-nums text-slate-950">{final || match.status === 'in_progress' ? match.lightTeamScore ?? '–' : ''}</div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-600"><span>{formatDate(match.scheduledDate)} · {formatTime(match.scheduledTime)}</span>{isFavorite && <span className="font-bold text-blue-700">★ My team</span>}</div>
    </div>
  </article>
}

function MatchSection({ title, accent, empty, items, favoriteIds }: { title: string; accent: string; empty: string; items: HomeMatch[]; favoriteIds: Set<string> }) {
  return <section className="mt-8">
    <div className="mb-3 flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${accent}`} /><h2 className="text-xl font-black text-slate-950">{title}</h2><span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">{items.length}</span></div>
    {items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <MatchCard key={item.match.id} item={item} favoriteIds={favoriteIds} />)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">{empty}</div>}
  </section>
}

export default function TournamentHome() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState('')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') as string[]) } catch { return new Set() }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [allTournaments, allMatches, allTeams, allClubs, allDivisions, allPools, allAnnouncements] = await Promise.all([getAllTournaments(), getAllMatches(), getAllTeams(), getAllClubs(), getAllDivisions(), getAllPools(), getAllAnnouncements()])
        const published = allTournaments.filter(tournament => tournament.isPublished)
        setTournaments(published); setMatches(allMatches); setTeams(allTeams); setClubs(allClubs); setDivisions(allDivisions); setPools(allPools); setAnnouncements(allAnnouncements)
        const today = new Date(); const active = published.find(tournament => tournament.startDate <= today && tournament.endDate >= today) || published[0]
        setSelectedTournamentId(active?.id || '')
      } catch (loadError) {
        console.error('Unable to load tournament home:', loadError)
        setError('Tournament information could not be loaded. Please try again shortly.')
      } finally { setLoading(false) }
    }
    void load()
  }, [])

  useEffect(() => {
    const refresh = window.setInterval(() => {
      void Promise.all([getAllMatches(), getAllAnnouncements()]).then(([freshMatches, freshAnnouncements]) => {
        setMatches(freshMatches)
        setAnnouncements(freshAnnouncements)
      }).catch(refreshError => console.error('Unable to refresh tournament home:', refreshError))
    }, 30_000)
    return () => window.clearInterval(refresh)
  }, [])

  const tournament = tournaments.find(item => item.id === selectedTournamentId)
  const tournamentTeams = useMemo(() => teams.filter(team => !team.tournamentId || team.tournamentId === selectedTournamentId), [teams, selectedTournamentId])
  const searchResults = useMemo(() => searchTeams(tournamentTeams, clubs, query).slice(0, 8), [tournamentTeams, clubs, query])
  const details = useMemo<HomeMatch[]>(() => {
    const divisionById = new Map(divisions.map(division => [division.id, division])); const poolById = new Map(pools.map(pool => [pool.id, pool])); const teamById = new Map(teams.map(team => [team.id, team])); const clubById = new Map(clubs.map(club => [club.id, club]))
    return matches.filter(match => match.tournamentId === selectedTournamentId && match.status !== 'cancelled').map(match => { const darkTeam = teamById.get(match.darkTeamId); const lightTeam = teamById.get(match.lightTeamId); return { match, division: divisionById.get(match.divisionId), pool: poolById.get(match.poolId), darkTeam, lightTeam, darkClub: darkTeam ? clubById.get(darkTeam.clubId) : undefined, lightClub: lightTeam ? clubById.get(lightTeam.clubId) : undefined } })
  }, [matches, divisions, pools, teams, clubs, selectedTournamentId])
  const activeTeamIds = useMemo(() => selectedTeamId ? new Set([selectedTeamId]) : favoritesOnly ? favoriteIds : new Set<string>(), [selectedTeamId, favoritesOnly, favoriteIds])
  const queue = useMemo(() => { const filtered = details.filter(item => matchIncludesTeams(item.match, activeTeamIds)); return buildSpectatorQueue(filtered) }, [details, activeTeamIds])
  const activeAnnouncements = announcements.filter(item => item.tournamentId === selectedTournamentId && item.isActive).sort((a, b) => ({ high: 0, normal: 1, low: 2 })[a.priority] - ({ high: 0, normal: 1, low: 2 })[b.priority])

  const toggleFavorite = (teamId: string) => {
    setFavoriteIds(current => { const next = new Set(current); if (next.has(teamId)) next.delete(teamId); else next.add(teamId); localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); return next })
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-lg font-bold text-slate-700">Loading tournament…</div>
  return <div className="min-h-screen bg-slate-100 pb-16"><PublicNav />
    <header className="bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 text-white"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">KrakenScores</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black sm:text-5xl">{tournament?.name || 'Tournament Day'}</h1><p className="mt-2 text-blue-100">Live scores, next games, and the teams you care about.</p></div>{tournaments.length > 1 && <select aria-label="Tournament" value={selectedTournamentId} onChange={event => { setSelectedTournamentId(event.target.value); setSelectedTeamId(''); setQuery('') }} className="rounded-lg border border-white/30 bg-slate-900 px-3 py-2 font-bold text-white">{tournaments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}</div></div></header>
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {error && <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 font-bold text-red-900">{error}</div>}
      {activeAnnouncements.length > 0 && <section aria-label="Tournament announcements" className="mt-6 space-y-3">{activeAnnouncements.map(item => <div key={item.id} className={`rounded-xl border p-4 ${item.priority === 'high' ? 'border-red-300 bg-red-50 text-red-950' : 'border-amber-300 bg-amber-50 text-amber-950'}`}><div className="font-black">{item.priority === 'high' ? 'Important: ' : ''}{item.title}</div><p className="mt-1">{item.message}</p></div>)}</section>}
      <section className="relative z-10 -mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:-mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">Find your team</h2><p className="text-sm text-slate-600">Search once, then tap the star to keep it on this device—no account needed.</p></div>{favoriteIds.size > 0 && <button type="button" onClick={() => { setFavoritesOnly(value => !value); setSelectedTeamId('') }} className={`rounded-full px-4 py-2 text-sm font-bold ${favoritesOnly ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800'}`}>★ My teams ({favoriteIds.size})</button>}</div>
        <div className="relative mt-4"><input aria-label="Search teams" value={query} onFocus={() => setSearchOpen(true)} onChange={event => { setQuery(event.target.value); setSearchOpen(true); setSelectedTeamId(''); setFavoritesOnly(false) }} placeholder="Team name, club, or abbreviation…" className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-base text-slate-950 outline-none focus:border-blue-600" />
          {query && searchOpen && <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">{searchResults.length ? searchResults.map(team => <div key={team.id} className="flex items-center border-b border-slate-100 last:border-0"><button type="button" onClick={() => { setSelectedTeamId(team.id); setQuery(team.name); setSearchOpen(false) }} className="flex-1 p-3 text-left hover:bg-slate-50"><span className="font-bold text-slate-950">{team.name}</span><span className="ml-2 text-sm text-slate-500">{clubs.find(club => club.id === team.clubId)?.name}</span></button><button type="button" aria-label={`${favoriteIds.has(team.id) ? 'Remove' : 'Add'} ${team.name} ${favoriteIds.has(team.id) ? 'from' : 'to'} favorites`} onClick={() => toggleFavorite(team.id)} className="p-4 text-2xl text-blue-700">{favoriteIds.has(team.id) ? '★' : '☆'}</button></div>) : <div className="p-4 text-slate-600">No matching teams.</div>}</div>}
        </div>
        {(selectedTeamId || favoritesOnly) && <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900"><span>Showing {selectedTeamId ? tournamentTeams.find(team => team.id === selectedTeamId)?.name : 'your favorite teams'}</span><button type="button" onClick={() => { setSelectedTeamId(''); setFavoritesOnly(false); setQuery('') }} className="underline">Show all games</button></div>}
      </section>
      <MatchSection title="Live now" accent="bg-red-500 animate-pulse" empty="No games are currently marked in progress." items={queue.live} favoriteIds={favoriteIds} />
      <MatchSection title="Up next" accent="bg-blue-600" empty={activeTeamIds.size ? 'No upcoming games found for this team yet.' : 'No upcoming games are scheduled.'} items={queue.next} favoriteIds={favoriteIds} />
      <MatchSection title="Recent results" accent="bg-emerald-600" empty="No completed games are available yet." items={queue.recent} favoriteIds={favoriteIds} />
      <div className="mt-10 grid gap-3 sm:grid-cols-3"><Link to="/schedule" className="rounded-xl bg-white p-4 text-center font-black text-blue-800 shadow-sm">Full schedule →</Link><Link to="/standings" className="rounded-xl bg-white p-4 text-center font-black text-blue-800 shadow-sm">Standings →</Link><Link to="/brackets" className="rounded-xl bg-white p-4 text-center font-black text-blue-800 shadow-sm">Brackets →</Link></div>
    </main>
  </div>
}
