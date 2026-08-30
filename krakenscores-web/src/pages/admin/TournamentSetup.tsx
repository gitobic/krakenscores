import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { getAllDivisions } from '../../services/divisions'
import { getAllClubs } from '../../services/clubs'
import { createTournamentSetupDraft, getAllTournaments, type SetupParticipantInput } from '../../services/tournaments'
import { getAllTeams } from '../../services/teams'
import { getAllPools } from '../../services/pools'
import { getMatchesByTournament } from '../../services/matches'
import type { Club, Division, Match, MatchParticipantSlot, Pool, ScheduleBreak, Team, Tournament } from '../../types/index'
import { generateScheduleSlots, type GeneratedScheduleSlot } from '../../utils/scheduleGenerator'
import { parseParticipantLabel } from '../../utils/participantSlots'
import { exportSetupCsv, parseSetupCsv, type SetupCsvIssue, type SetupCsvSlot } from '../../utils/setupCsv'
import { validateTournamentSetup } from '../../utils/setupValidation'

const steps = ['Tournament', 'Divisions', 'Teams', 'Pools', 'Schedule', 'Review']

interface TeamDraft {
  id: string
  clubKey: string
  divisionId: string
  name: string
  bracket: string
}

interface ClubDraft { key: string; name: string; abbreviation: string }
interface PoolDraft { key: string; name: string; location: string; defaultStartTime: string }
interface BreakDraft { id: string; poolKey: string; scheduledDate: string; startTime: string; endTime: string; reason: string }
interface SlotDraft extends GeneratedScheduleSlot {
  darkParticipant?: SetupParticipantInput
  lightParticipant?: SetupParticipantInput
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function TournamentSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [divisions, setDivisions] = useState<Division[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState({ name: '', startDate: '', endDate: '', defaultMatchDuration: 55 })
  const [divisionIds, setDivisionIds] = useState<string[]>([])
  const [teams, setTeams] = useState<TeamDraft[]>([])
  const [newClubs, setNewClubs] = useState<ClubDraft[]>([])
  const [pools, setPools] = useState<PoolDraft[]>([])
  const [slots, setSlots] = useState<SlotDraft[]>([])
  const [breaks, setBreaks] = useState<BreakDraft[]>([])
  const [minimumRestMinutes, setMinimumRestMinutes] = useState(30)
  const [clubForm, setClubForm] = useState({ name: '', abbreviation: '' })
  const [generator, setGenerator] = useState({ date: '', startTime: '07:00', rounds: 1, firstMatchNumber: 1, intervalMinutes: 55 })
  const [templateId, setTemplateId] = useState('')
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [csvIssues, setCsvIssues] = useState<SetupCsvIssue[]>([])
  const [csvPreview, setCsvPreview] = useState<SetupCsvSlot[]>([])

  useEffect(() => {
    Promise.all([getAllDivisions(), getAllClubs(), getAllTournaments()])
      .then(([divisionData, clubData, tournamentData]) => {
        setDivisions(divisionData)
        setClubs(clubData)
        setTournaments(tournamentData)
      })
      .catch(() => setError('Could not load divisions and clubs.'))
      .finally(() => setLoading(false))
  }, [])

  const selectedDivisions = useMemo(
    () => divisions.filter(division => divisionIds.includes(division.id)),
    [divisions, divisionIds]
  )
  const detailsValid = Boolean(details.name.trim() && details.startDate && details.endDate && details.endDate >= details.startDate && details.defaultMatchDuration >= 10)
  const availableClubs = [...clubs.map(club => ({ key: club.id, name: club.name, abbreviation: club.abbreviation })), ...newClubs]
  const teamIdentityKeys = teams.map(team => `${team.divisionId}:${team.name.trim().toLocaleLowerCase()}`)
  const hasDuplicateTeamNames = new Set(teamIdentityKeys).size !== teamIdentityKeys.length
  const teamsValid = teams.length > 0 && !hasDuplicateTeamNames && teams.every(team => team.clubKey && team.divisionId && team.name.trim())
  const poolsValid = pools.length > 0 && pools.every(pool => pool.name.trim() && pool.defaultStartTime)
  const slotsValid = slots.length === 0 || slots.every(slot => slot.darkParticipant && slot.lightParticipant && JSON.stringify(slot.darkParticipant) !== JSON.stringify(slot.lightParticipant))
  const canContinue = step === 0 ? detailsValid : step === 1 ? divisionIds.length > 0 : step === 2 ? teamsValid : step === 3 ? poolsValid : step === 4 ? slotsValid : true

  const toggleDivision = (id: string) => {
    setDivisionIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
    setTeams(current => current.filter(team => team.divisionId !== id || !divisionIds.includes(id)))
    if (divisionIds.includes(id)) setSlots(current => current.filter(slot => slot.divisionId !== id))
  }

  const addTeam = () => setTeams(current => [...current, {
    id: crypto.randomUUID(),
    clubKey: availableClubs[0]?.key || '',
    divisionId: divisionIds[0] || '',
    name: '',
    bracket: '',
  }])
  const updateTeam = (id: string, patch: Partial<TeamDraft>) => setTeams(current => current.map(team => team.id === id ? { ...team, ...patch } : team))
  const addClub = () => {
    if (!clubForm.name.trim() || !clubForm.abbreviation.trim()) return
    if (availableClubs.some(club => club.abbreviation.toLocaleLowerCase() === clubForm.abbreviation.trim().toLocaleLowerCase())) {
      setError('That club abbreviation is already in use. Choose the existing club or enter a different abbreviation.')
      return
    }
    const club = { key: `new-club-${crypto.randomUUID()}`, name: clubForm.name.trim(), abbreviation: clubForm.abbreviation.trim().toUpperCase() }
    setNewClubs(current => [...current, club])
    setClubForm({ name: '', abbreviation: '' })
    setError('')
  }
  const addPool = () => setPools(current => [...current, { key: `new-pool-${crypto.randomUUID()}`, name: `Pool ${current.length + 1}`, location: '', defaultStartTime: '07:00' }])
  const updatePool = (key: string, patch: Partial<PoolDraft>) => setPools(current => current.map(pool => pool.key === key ? { ...pool, ...patch } : pool))
  const addBreak = () => pools[0] && setBreaks(current => [...current, { id: crypto.randomUUID(), poolKey: pools[0].key, scheduledDate: details.startDate, startTime: '12:00', endTime: '13:00', reason: 'Break' }])
  const updateBreak = (id: string, patch: Partial<BreakDraft>) => setBreaks(current => current.map(item => item.id === id ? { ...item, ...patch } : item))
  const buildSlots = () => setSlots(generateScheduleSlots({
    date: generator.date,
    startTime: generator.startTime,
    pools: pools.map(pool => ({ id: pool.key, name: pool.name })),
    rounds: generator.rounds,
    firstMatchNumber: generator.firstMatchNumber,
    intervalMinutes: generator.intervalMinutes,
    duration: details.defaultMatchDuration,
    divisionId: divisionIds[0] || '',
  }))

  const loadTemplate = async () => {
    const source = tournaments.find(tournament => tournament.id === templateId)
    if (!source || !details.startDate) return
    setLoadingTemplate(true)
    setError('')
    try {
      const [sourceMatches, allTeams, allPools] = await Promise.all([
        getMatchesByTournament(source.id), getAllTeams(), getAllPools(),
      ])
      const sourceTeamIds = new Set(sourceMatches.flatMap(match => [match.darkTeamId, match.lightTeamId]).filter(Boolean))
      const sourcePoolIds = new Set(sourceMatches.map(match => match.poolId))
      const sourceTeams = allTeams.filter(team => team.tournamentId === source.id || sourceTeamIds.has(team.id))
      const sourcePools = allPools.filter(pool => pool.tournamentId === source.id || sourcePoolIds.has(pool.id))
      const teamKeys = new Map(sourceTeams.map(team => [team.id, `clone-team-${crypto.randomUUID()}`]))
      const poolKeys = new Map(sourcePools.map(pool => [pool.id, `clone-pool-${crypto.randomUUID()}`]))
      const matchKeys = new Map(sourceMatches.map(match => [match.id, `clone-match-${crypto.randomUUID()}`]))
      const selectedIds = source.divisionIds?.length
        ? source.divisionIds
        : [...new Set([...sourceTeams.map(team => team.divisionId), ...sourceMatches.map(match => match.divisionId)])]
      const sourceStart = new Date(source.startDate)
      const targetStart = parseLocalDate(details.startDate)
      const shiftedDate = (date: string) => {
        const original = parseLocalDate(date)
        const dayOffset = Math.round((original.getTime() - sourceStart.getTime()) / 86400000)
        const shifted = new Date(targetStart)
        shifted.setDate(shifted.getDate() + dayOffset)
        return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`
      }
      const cloneParticipant = (participant: MatchParticipantSlot | undefined, fallbackTeamId: string, fallbackLabel?: string): SetupParticipantInput | undefined => {
        const sourceParticipant = participant || (fallbackLabel ? parseParticipantLabel(fallbackLabel, sourceMatches) || undefined : undefined)
        if (!sourceParticipant) return fallbackTeamId ? { source: 'team', teamKey: teamKeys.get(fallbackTeamId) || fallbackTeamId } : undefined
        if (sourceParticipant.source === 'team') return { source: 'team', teamKey: teamKeys.get(sourceParticipant.teamId) || sourceParticipant.teamId }
        if (sourceParticipant.source === 'groupSeed') return sourceParticipant
        return { source: 'matchOutcome', matchKey: matchKeys.get(sourceParticipant.matchId) || sourceParticipant.matchId, outcome: sourceParticipant.outcome }
      }
      setDivisionIds(selectedIds)
      setTeams(sourceTeams.map(team => ({ id: teamKeys.get(team.id)!, clubKey: team.clubId, divisionId: team.divisionId, name: team.name, bracket: team.bracket || '' })))
      setPools(sourcePools.map(pool => ({ key: poolKeys.get(pool.id)!, name: pool.name, location: pool.location, defaultStartTime: pool.defaultStartTime })))
      setSlots(sourceMatches.map(match => ({
        id: matchKeys.get(match.id)!, matchNumber: match.matchNumber, poolKey: poolKeys.get(match.poolId) || match.poolId,
        poolName: sourcePools.find(pool => pool.id === match.poolId)?.name || 'Pool', divisionId: match.divisionId,
        scheduledDate: shiftedDate(match.scheduledDate), scheduledTime: match.scheduledTime, duration: match.duration, roundType: match.roundType,
        darkParticipant: cloneParticipant(match.darkParticipant, match.darkTeamId, match.darkTeamLabel),
        lightParticipant: cloneParticipant(match.lightParticipant, match.lightTeamId, match.lightTeamLabel),
      })))
      const sourceDays = Math.max(0, Math.round((new Date(source.endDate).getTime() - sourceStart.getTime()) / 86400000))
      const targetEnd = new Date(targetStart)
      targetEnd.setDate(targetEnd.getDate() + sourceDays)
      setDetails(current => ({
        ...current,
        endDate: `${targetEnd.getFullYear()}-${String(targetEnd.getMonth() + 1).padStart(2, '0')}-${String(targetEnd.getDate()).padStart(2, '0')}`,
        defaultMatchDuration: source.defaultMatchDuration || 55,
      }))
    } catch (templateError) {
      console.error('Error loading tournament template:', templateError)
      setError('The previous tournament could not be loaded as a template.')
    } finally {
      setLoadingTemplate(false)
    }
  }

  const participantCsvName = (participant: SetupParticipantInput): string => {
    if (participant.source === 'groupSeed') return `${participant.rank}${participant.groupId}`
    if (participant.source === 'matchOutcome') return `${participant.outcome === 'winner' ? 'Winner' : 'Loser'} of Game ${slots.find(slot => slot.id === participant.matchKey)?.matchNumber ?? '?'}`
    const team = teams.find(item => item.id === participant.teamKey)
    const club = availableClubs.find(item => item.key === team?.clubKey)
    return team ? `${club?.abbreviation || ''}: ${team.name}` : participant.teamKey
  }
  const previewCsv = () => {
    const result = parseSetupCsv(csvText, {
      pools: pools.map(pool => ({ key: pool.key, name: pool.name })),
      divisions: selectedDivisions.map(division => ({ key: division.id, name: division.name })),
      teams: teams.map(team => ({ key: team.id, name: team.name, divisionId: team.divisionId, clubKey: team.clubKey })),
      clubs: availableClubs,
      defaultDuration: details.defaultMatchDuration,
    })
    setCsvIssues(result.issues)
    setCsvPreview(result.slots)
  }
  const downloadCsv = () => {
    const csvSlots: SetupCsvSlot[] = slots.map(slot => ({ ...slot, key: slot.id, divisionName: selectedDivisions.find(division => division.id === slot.divisionId)?.name || slot.divisionId }))
    const url = URL.createObjectURL(new Blob([exportSetupCsv(csvSlots, participantCsvName)], { type: 'text/csv' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${details.name.trim().replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase() || 'krakenscores'}-schedule.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const canonicalParticipant = (participant: SetupParticipantInput | undefined): MatchParticipantSlot | undefined => {
    if (!participant) return undefined
    if (participant.source === 'team') return { source: 'team', teamId: participant.teamKey }
    if (participant.source === 'groupSeed') return participant
    return { source: 'matchOutcome', matchId: participant.matchKey, outcome: participant.outcome }
  }
  const now = new Date()
  const validationIssues = validateTournamentSetup({
    name: details.name,
    startDate: details.startDate,
    endDate: details.endDate,
    defaultMatchDuration: details.defaultMatchDuration,
    divisionIds,
    clubs: [...clubs, ...newClubs.map(club => ({ id: club.key, name: club.name, abbreviation: club.abbreviation, createdAt: now, updatedAt: now } as Club))],
    teams: teams.map(team => ({ id: team.id, clubId: team.clubKey, divisionId: team.divisionId, name: team.name, bracket: team.bracket || undefined, createdAt: now, updatedAt: now } as Team)),
    pools: pools.map(pool => ({ id: pool.key, name: pool.name, location: pool.location, defaultStartTime: pool.defaultStartTime, createdAt: now, updatedAt: now } as Pool)),
    matches: slots.map(slot => ({
      id: slot.id, tournamentId: 'draft', divisionId: slot.divisionId, poolId: slot.poolKey,
      matchNumber: slot.matchNumber, scheduledDate: slot.scheduledDate, scheduledTime: slot.scheduledTime,
      duration: slot.duration, darkTeamId: slot.darkParticipant?.source === 'team' ? slot.darkParticipant.teamKey : '',
      lightTeamId: slot.lightParticipant?.source === 'team' ? slot.lightParticipant.teamKey : '',
      darkParticipant: canonicalParticipant(slot.darkParticipant), lightParticipant: canonicalParticipant(slot.lightParticipant),
      status: 'scheduled', roundType: slot.roundType, isSemiFinal: false, isFinal: false, createdAt: now, updatedAt: now,
    } as Match)),
    breaks: breaks.map(item => ({ id: item.id, tournamentId: 'draft', poolId: item.poolKey, scheduledDate: item.scheduledDate, startTime: item.startTime, endTime: item.endTime, reason: item.reason, createdAt: now, updatedAt: now } as ScheduleBreak)),
    minimumRestMinutes,
  })
  const blockingIssues = validationIssues.filter(issue => issue.severity === 'error')

  const saveDraft = async () => {
    setSaving(true)
    setError('')
    try {
      await createTournamentSetupDraft({
        name: details.name.trim(),
        startDate: parseLocalDate(details.startDate),
        endDate: parseLocalDate(details.endDate),
        defaultMatchDuration: details.defaultMatchDuration,
        divisionIds,
        isPublished: false,
      }, teams.map(({ id, clubKey, divisionId, name, bracket }) => ({ key: id, clubKey, divisionId, name, bracket })), newClubs, pools, slots.map(slot => ({
        key: slot.id,
        matchNumber: slot.matchNumber,
        poolKey: slot.poolKey,
        divisionId: slot.divisionId,
        scheduledDate: slot.scheduledDate,
        scheduledTime: slot.scheduledTime,
        duration: slot.duration,
        roundType: slot.roundType,
        darkParticipant: slot.darkParticipant,
        lightParticipant: slot.lightParticipant,
      })), breaks)
      navigate('/admin/tournaments')
    } catch (saveError) {
      console.error('Error creating tournament setup draft:', saveError)
      setError('The tournament draft could not be saved. Nothing was published.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <main className="w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">Guided setup</p>
            <h1 className="text-3xl font-bold text-gray-950">Create a tournament draft</h1>
            <p className="mt-2 max-w-2xl text-gray-600">Start with the weekend and participating divisions. Teams, pools, and the schedule will stay together in this tournament workspace.</p>
          </div>
          <button type="button" onClick={() => navigate('/admin/tournaments')} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Exit setup</button>
        </div>

        <ol className="mb-8 grid grid-cols-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:grid-cols-6">
          {steps.map((label, index) => (
            <li key={label} className={`border-r border-gray-200 px-3 py-4 text-center text-sm last:border-r-0 ${index === step ? 'bg-blue-50 font-semibold text-blue-800' : index < step ? 'text-emerald-700' : 'text-gray-500'}`}>
              <span className="mr-2">{index < step ? '✓' : index + 1}</span>{label}
            </li>
          ))}
        </ol>

        {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-950">Tournament basics</h2>
              <p className="mt-1 text-sm text-gray-600">This always begins as an unpublished draft.</p>
              <div className="mt-7 grid gap-6">
                <label className="grid gap-2 text-sm font-medium text-gray-800">
                  Tournament name
                  <input autoFocus value={details.name} onChange={event => setDetails({ ...details, name: event.target.value })} placeholder="2026 Fall Trident Cup" className="rounded-md border border-gray-300 px-3 py-3 text-base font-normal" />
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-gray-800">Start date<input type="date" value={details.startDate} onChange={event => setDetails({ ...details, startDate: event.target.value })} className="rounded-md border border-gray-300 px-3 py-3 text-base font-normal" /></label>
                  <label className="grid gap-2 text-sm font-medium text-gray-800">End date<input type="date" min={details.startDate} value={details.endDate} onChange={event => setDetails({ ...details, endDate: event.target.value })} className="rounded-md border border-gray-300 px-3 py-3 text-base font-normal" /></label>
                </div>
                <label className="grid max-w-sm gap-2 text-sm font-medium text-gray-800">
                  Default game slot
                  <span className="flex items-center gap-3"><input type="number" min="10" max="120" value={details.defaultMatchDuration} onChange={event => setDetails({ ...details, defaultMatchDuration: Number(event.target.value) })} className="w-28 rounded-md border border-gray-300 px-3 py-3 text-base font-normal" /><span className="font-normal text-gray-600">minutes (55 recommended)</span></span>
                </label>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <h3 className="font-semibold text-indigo-950">Use a previous tournament as a template</h3>
                  <p className="mt-1 text-sm text-indigo-800">Copies divisions, teams, groups, pools, game times, and advancement paths. Dates shift to the new start date; scores and publication status are never copied.</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <select value={templateId} onChange={event => setTemplateId(event.target.value)} className="min-w-0 flex-1 rounded-md border border-indigo-200 bg-white px-3 py-2.5 text-sm"><option value="">Choose a previous tournament…</option>{tournaments.map(tournament => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select>
                    <button type="button" onClick={loadTemplate} disabled={!templateId || !details.startDate || loadingTemplate} className="rounded-md bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{loadingTemplate ? 'Loading…' : 'Load template'}</button>
                  </div>
                  {!details.startDate && <p className="mt-2 text-xs text-indigo-700">Choose the new start date first.</p>}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-950">Which divisions are playing?</h2>
              <p className="mt-1 text-sm text-gray-600">Only selected divisions will appear when teams and games are added.</p>
              {loading ? <p className="mt-8 text-gray-600">Loading divisions…</p> : (
                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {divisions.map(division => {
                    const selected = divisionIds.includes(division.id)
                    return <button key={division.id} type="button" onClick={() => toggleDivision(division.id)} className={`flex items-center gap-3 rounded-lg border p-4 text-left ${selected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
                      <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: division.colorHex }} />
                      <span className="flex-1 font-medium text-gray-900">{division.name}</span>
                      <span className={selected ? 'text-blue-700' : 'text-gray-300'}>{selected ? '✓' : '○'}</span>
                    </button>
                  })}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-950">Add the actual teams</h2>
                  <p className="mt-1 text-sm text-gray-600">Use distinct names for multiple teams from one club, such as Team Orlando Black and Team Orlando Blue.</p>
                </div>
                <button type="button" onClick={addTeam} disabled={!availableClubs.length} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">+ Add team</button>
              </div>
              <div className="mt-6 grid gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:grid-cols-[1.5fr_0.7fr_auto] sm:items-end">
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-blue-900">Missing club name<input value={clubForm.name} onChange={event => setClubForm({ ...clubForm, name: event.target.value })} placeholder="Wolverines Water Polo" className="rounded-md border border-blue-200 bg-white px-3 py-2.5 text-sm font-normal normal-case text-gray-900" /></label>
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-blue-900">Abbreviation<input value={clubForm.abbreviation} maxLength={10} onChange={event => setClubForm({ ...clubForm, abbreviation: event.target.value.toUpperCase() })} placeholder="WOLV" className="rounded-md border border-blue-200 bg-white px-3 py-2.5 text-sm font-normal normal-case text-gray-900" /></label>
                <button type="button" onClick={addClub} disabled={!clubForm.name.trim() || !clubForm.abbreviation.trim()} className="rounded-md border border-blue-700 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 disabled:opacity-40">Add club</button>
              </div>
              {newClubs.length > 0 && <p className="mt-3 text-sm text-blue-800">New in this draft: {newClubs.map(club => `${club.name} (${club.abbreviation})`).join(', ')}</p>}
              {!availableClubs.length ? <div className="mt-7 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Add the first club above, then add its teams.</div>
                : teams.length === 0 ? <button type="button" onClick={addTeam} className="mt-7 w-full rounded-lg border-2 border-dashed border-gray-300 p-10 text-center text-gray-600 hover:border-blue-400 hover:text-blue-700">Add the first team</button>
                  : <div className="mt-7 grid gap-4">
                    {teams.map((team, index) => <div key={team.id} className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[1fr_1fr_1.3fr_7rem_auto] lg:items-end">
                      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Club<select value={team.clubKey} onChange={event => updateTeam(team.id, { clubKey: event.target.value })} className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal normal-case text-gray-900">{availableClubs.map(club => <option key={club.key} value={club.key}>{club.name}</option>)}</select></label>
                      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Division<select value={team.divisionId} onChange={event => updateTeam(team.id, { divisionId: event.target.value })} className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal normal-case text-gray-900">{selectedDivisions.map(division => <option key={division.id} value={division.id}>{division.name}</option>)}</select></label>
                      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Public team name<input value={team.name} onChange={event => updateTeam(team.id, { name: event.target.value })} placeholder={index === 0 ? 'Team Orlando Black' : 'Wolverines Yellow'} className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal normal-case text-gray-900" /></label>
                      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Group<input maxLength={4} value={team.bracket} onChange={event => updateTeam(team.id, { bracket: event.target.value.toUpperCase() })} placeholder="A" className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal normal-case text-gray-900" /></label>
                      <button type="button" onClick={() => setTeams(current => current.filter(item => item.id !== team.id))} className="rounded-md px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">Remove</button>
                    </div>)}
                  </div>}
              {hasDuplicateTeamNames && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">Team names must be unique within each division so spectators can tell them apart.</div>}
              <p className="mt-4 text-sm text-gray-500">Group can be left blank until Coach's pool assignments are known.</p>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-gray-950">Configure the physical pools</h2><p className="mt-1 text-sm text-gray-600">These are simultaneous playing areas, not preliminary team groups.</p></div><button type="button" onClick={addPool} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">+ Add pool</button></div>
              {pools.length === 0 ? <button type="button" onClick={addPool} className="mt-7 w-full rounded-lg border-2 border-dashed border-gray-300 p-10 text-gray-600 hover:border-blue-400">Add Pool 1</button> : <div className="mt-7 grid gap-4">
                {pools.map(pool => <div key={pool.key} className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-[1fr_1.5fr_10rem_auto] sm:items-end">
                  <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">Pool name<input value={pool.name} onChange={event => updatePool(pool.key, { name: event.target.value })} className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal normal-case text-gray-900" /></label>
                  <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">Location / notes<input value={pool.location} onChange={event => updatePool(pool.key, { location: event.target.value })} placeholder="Main competition pool" className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal normal-case text-gray-900" /></label>
                  <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">First start<input type="time" value={pool.defaultStartTime} onChange={event => updatePool(pool.key, { defaultStartTime: event.target.value })} className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900" /></label>
                  <button type="button" onClick={() => setPools(current => current.filter(item => item.key !== pool.key))} className="rounded-md px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">Remove</button>
                </div>)}
              </div>}
              {pools.length > 0 && <div className="mt-8 border-t border-gray-200 pt-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold text-gray-950">Scheduled breaks</h3><p className="text-sm text-gray-600">Lunch, equipment changes, ceremonies, or planned closures.</p></div><button type="button" onClick={addBreak} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700">+ Add break</button></div>{breaks.length > 0 && <div className="mt-4 grid gap-3">{breaks.map(item => <div key={item.id} className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_1.2fr_8rem_8rem_1.2fr_auto] sm:items-end"><select value={item.poolKey} onChange={event => updateBreak(item.id, { poolKey: event.target.value })} className="rounded border border-gray-300 px-2 py-2 text-sm">{pools.map(pool => <option key={pool.key} value={pool.key}>{pool.name}</option>)}</select><input type="date" value={item.scheduledDate} onChange={event => updateBreak(item.id, { scheduledDate: event.target.value })} className="rounded border border-gray-300 px-2 py-2 text-sm" /><input type="time" value={item.startTime} onChange={event => updateBreak(item.id, { startTime: event.target.value })} className="rounded border border-gray-300 px-2 py-2 text-sm" /><input type="time" value={item.endTime} onChange={event => updateBreak(item.id, { endTime: event.target.value })} className="rounded border border-gray-300 px-2 py-2 text-sm" /><input value={item.reason} onChange={event => updateBreak(item.id, { reason: event.target.value })} placeholder="Lunch" className="rounded border border-gray-300 px-2 py-2 text-sm" /><button type="button" onClick={() => setBreaks(current => current.filter(candidate => candidate.id !== item.id))} className="px-2 py-2 text-sm text-red-700">Remove</button></div>)}</div>}</div>}
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-gray-950">Build the master schedule</h2><p className="mt-1 text-sm text-gray-600">Generate a grid or import/export the same canonical CSV format.</p></div><div className="flex gap-2"><button type="button" onClick={() => setShowCsvImport(current => !current)} className="rounded-md border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-800">Import CSV</button><button type="button" onClick={downloadCsv} disabled={!slots.length} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40">Export CSV</button></div></div>
              {showCsvImport && <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-950">Canonical KrakenScores schedule CSV</h3>
                <p className="mt-1 text-sm text-blue-800">Columns: game_number, date, time, pool, division, dark, light, duration, round_type. Participants accept exact team names, <code>ABBR: Exact Team Name</code>, <code>2F</code>, or <code>Winner of Game 12</code>.</p>
                <textarea value={csvText} onChange={event => { setCsvText(event.target.value); setCsvIssues([]); setCsvPreview([]) }} rows={8} className="mt-4 w-full rounded-md border border-blue-200 bg-white p-3 font-mono text-xs text-gray-900" placeholder="game_number,date,time,pool,division,dark,light,duration" />
                <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={previewCsv} disabled={!csvText.trim()} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Validate and preview</button>{csvPreview.length > 0 && csvIssues.length === 0 && <button type="button" onClick={() => { setSlots(csvPreview.map(slot => ({ ...slot, id: slot.key }))); setShowCsvImport(false) }} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Use these {csvPreview.length} games</button>}</div>
                {csvIssues.length > 0 && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3"><p className="font-semibold text-red-900">Fix {csvIssues.length} import issue{csvIssues.length === 1 ? '' : 's'}:</p><ul className="mt-2 grid gap-1 text-sm text-red-800">{csvIssues.map((issue, index) => <li key={`${issue.row}-${issue.field}-${index}`}>Row {issue.row}, {issue.field}: {issue.message}</li>)}</ul></div>}
                {csvPreview.length > 0 && csvIssues.length === 0 && <div className="mt-4 max-h-52 overflow-auto rounded-md border border-emerald-200 bg-white"><table className="min-w-full text-xs"><thead className="sticky top-0 bg-emerald-50"><tr><th className="p-2 text-left">Game</th><th className="p-2 text-left">When</th><th className="p-2 text-left">Pool</th><th className="p-2 text-left">Division</th></tr></thead><tbody>{csvPreview.map(slot => <tr key={slot.key} className="border-t"><td className="p-2">{slot.matchNumber}</td><td className="p-2">{slot.scheduledDate} {slot.scheduledTime}</td><td className="p-2">{slot.poolName}</td><td className="p-2">{slot.divisionName}</td></tr>)}</tbody></table></div>}
              </div>}
              <p className="mt-6 text-sm text-gray-600">One generated round creates one simultaneous slot in every pool.</p>
              <div className="mt-7 grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3 lg:grid-cols-6 lg:items-end">
                <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">Date<input type="date" min={details.startDate} max={details.endDate} value={generator.date} onChange={event => setGenerator({ ...generator, date: event.target.value })} className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-normal text-gray-900" /></label>
                <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">First time<input type="time" value={generator.startTime} onChange={event => setGenerator({ ...generator, startTime: event.target.value })} className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-normal text-gray-900" /></label>
                <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">Rounds<input type="number" min="1" value={generator.rounds} onChange={event => setGenerator({ ...generator, rounds: Number(event.target.value) })} className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-normal text-gray-900" /></label>
                <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">First game #<input type="number" min="1" value={generator.firstMatchNumber} onChange={event => setGenerator({ ...generator, firstMatchNumber: Number(event.target.value) })} className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-normal text-gray-900" /></label>
                <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">Cadence<input type="number" min="10" value={generator.intervalMinutes} onChange={event => setGenerator({ ...generator, intervalMinutes: Number(event.target.value) })} className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-normal text-gray-900" /></label>
                <button type="button" onClick={buildSlots} disabled={!generator.date || generator.rounds < 1} className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Generate</button>
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm font-medium text-gray-700">Minimum team rest <input type="number" min="0" value={minimumRestMinutes} onChange={event => setMinimumRestMinutes(Number(event.target.value))} className="w-20 rounded border border-gray-300 bg-white px-2 py-1.5 text-gray-900" /> minutes</label>
              {slots.length > 0 && <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200"><table className="min-w-full divide-y divide-gray-200 text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Game</th><th className="p-3 text-left">Date / time</th><th className="p-3 text-left">Pool</th><th className="p-3 text-left">Division</th><th className="p-3 text-left">Round</th><th className="min-w-52 p-3 text-left">Dark</th><th className="min-w-52 p-3 text-left">Light</th></tr></thead><tbody className="divide-y divide-gray-100">{slots.map(slot => <tr key={slot.id}><td className="p-3 font-semibold">{slot.matchNumber}</td><td className="p-3">{slot.scheduledDate} · {slot.scheduledTime}</td><td className="p-3">{slot.poolName}</td><td className="p-3"><select value={slot.divisionId} onChange={event => setSlots(current => current.map(item => item.id === slot.id ? { ...item, divisionId: event.target.value, darkParticipant: undefined, lightParticipant: undefined } : item))} className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-900">{selectedDivisions.map(division => <option key={division.id} value={division.id}>{division.name}</option>)}</select></td><td className="p-3"><select value={slot.roundType} onChange={event => setSlots(current => current.map(item => item.id === slot.id ? { ...item, roundType: event.target.value as SlotDraft['roundType'] } : item))} className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-900"><option value="pool">Pool</option><option value="semi">Semi</option><option value="final">Final</option><option value="placement">Placement</option></select></td><td className="p-3"><ParticipantSelect value={slot.darkParticipant} slot={slot} teams={teams} slots={slots} onChange={participant => setSlots(current => current.map(item => item.id === slot.id ? { ...item, darkParticipant: participant } : item))} /></td><td className="p-3"><ParticipantSelect value={slot.lightParticipant} slot={slot} teams={teams} slots={slots} onChange={participant => setSlots(current => current.map(item => item.id === slot.id ? { ...item, lightParticipant: participant } : item))} /></td></tr>)}</tbody></table></div>}
              {slots.length > 0 && !slotsValid && <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Assign two different participant sources to every generated game before continuing.</div>}
              <p className="mt-4 text-sm text-gray-500">Dependencies only offer earlier game numbers, preventing forward references and circular bracket paths.</p>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-950">Review the starting point</h2>
              <p className="mt-1 text-sm text-gray-600">Saving creates a private draft. Spectators will not see it.</p>
              <dl className="mt-7 divide-y divide-gray-200 rounded-lg border border-gray-200">
                <div className="grid gap-1 p-4 sm:grid-cols-3"><dt className="text-sm font-medium text-gray-500">Tournament</dt><dd className="sm:col-span-2 font-semibold text-gray-950">{details.name}</dd></div>
                <div className="grid gap-1 p-4 sm:grid-cols-3"><dt className="text-sm font-medium text-gray-500">Dates</dt><dd className="sm:col-span-2 text-gray-900">{details.startDate} through {details.endDate}</dd></div>
                <div className="grid gap-1 p-4 sm:grid-cols-3"><dt className="text-sm font-medium text-gray-500">Game slot</dt><dd className="sm:col-span-2 text-gray-900">{details.defaultMatchDuration} minutes</dd></div>
                <div className="grid gap-2 p-4 sm:grid-cols-3"><dt className="text-sm font-medium text-gray-500">Divisions</dt><dd className="sm:col-span-2 flex flex-wrap gap-2">{selectedDivisions.map(division => <span key={division.id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">{division.name}</span>)}</dd></div>
                <div className="grid gap-2 p-4 sm:grid-cols-3"><dt className="text-sm font-medium text-gray-500">Teams</dt><dd className="sm:col-span-2 grid gap-1 text-gray-900">{teams.map(team => <span key={team.id}>{team.name} · {selectedDivisions.find(division => division.id === team.divisionId)?.name}{team.bracket ? ` · Group ${team.bracket}` : ''}</span>)}</dd></div>
                <div className="grid gap-2 p-4 sm:grid-cols-3"><dt className="text-sm font-medium text-gray-500">Pools</dt><dd className="sm:col-span-2 text-gray-900">{pools.map(pool => pool.name).join(', ')}</dd></div>
                <div className="grid gap-2 p-4 sm:grid-cols-3"><dt className="text-sm font-medium text-gray-500">Schedule slots</dt><dd className="sm:col-span-2 text-gray-900">{slots.length} generated</dd></div>
              </dl>
              <div className="mt-7 overflow-x-auto rounded-lg border border-gray-200"><table className="min-w-full text-sm"><thead className="bg-gray-100"><tr><th className="p-3 text-left">Game</th><th className="p-3 text-left">When</th><th className="p-3 text-left">Pool</th><th className="p-3 text-left">Division / round</th><th className="p-3 text-left">Matchup / progression</th></tr></thead><tbody className="divide-y divide-gray-100">{[...slots].sort((a, b) => a.matchNumber - b.matchNumber).map(slot => <tr key={slot.id}><td className="p-3 font-semibold">{slot.matchNumber}</td><td className="p-3 whitespace-nowrap">{slot.scheduledDate}<br />{slot.scheduledTime}</td><td className="p-3">{slot.poolName}</td><td className="p-3">{selectedDivisions.find(division => division.id === slot.divisionId)?.name}<br /><span className="text-xs uppercase text-gray-500">{slot.roundType}</span></td><td className="p-3">{slot.darkParticipant ? participantCsvName(slot.darkParticipant) : 'TBD'} <span className="text-gray-400">vs</span> {slot.lightParticipant ? participantCsvName(slot.lightParticipant) : 'TBD'}</td></tr>)}</tbody></table></div>
              <div className={`mt-6 rounded-md border p-4 text-sm ${blockingIssues.length ? 'border-red-200 bg-red-50 text-red-900' : validationIssues.length ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
                <strong>{blockingIssues.length ? `${blockingIssues.length} blocking setup issue${blockingIssues.length === 1 ? '' : 's'}` : validationIssues.length ? `${validationIssues.length} warning${validationIssues.length === 1 ? '' : 's'} to review` : 'Ready to save as an unpublished draft'}</strong>
                {validationIssues.length > 0 && <ul className="mt-2 grid gap-1">{validationIssues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.severity === 'error' ? 'Error' : 'Warning'}: {issue.message}</li>)}</ul>}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <button type="button" disabled={step === 0 || saving} onClick={() => setStep(current => current - 1)} className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40">Back</button>
            {step < 5 ? <button type="button" disabled={!canContinue || saving} onClick={() => setStep(current => current + 1)} className="rounded-md bg-blue-700 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Continue</button>
              : <button type="button" disabled={saving || blockingIssues.length > 0 || !slotsValid} onClick={saveDraft} className="rounded-md bg-emerald-700 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Saving…' : 'Save unpublished draft'}</button>}
          </div>
        </section>
      </main>
    </AdminLayout>
  )
}

function participantValue(participant: SetupParticipantInput | undefined): string {
  if (!participant) return ''
  if (participant.source === 'team') return `team|${participant.teamKey}`
  if (participant.source === 'groupSeed') return `seed|${participant.groupId}|${participant.rank}`
  return `outcome|${participant.matchKey}|${participant.outcome}`
}

function parseParticipant(value: string): SetupParticipantInput | undefined {
  const [source, key, detail] = value.split('|')
  if (source === 'team' && key) return { source: 'team', teamKey: key }
  if (source === 'seed' && key && Number(detail) > 0) return { source: 'groupSeed', groupId: key, rank: Number(detail) }
  if (source === 'outcome' && key && (detail === 'winner' || detail === 'loser')) return { source: 'matchOutcome', matchKey: key, outcome: detail }
  return undefined
}

function ParticipantSelect({ value, slot, teams, slots, onChange }: {
  value?: SetupParticipantInput
  slot: SlotDraft
  teams: TeamDraft[]
  slots: SlotDraft[]
  onChange: (participant: SetupParticipantInput | undefined) => void
}) {
  const divisionTeams = teams.filter(team => team.divisionId === slot.divisionId)
  const groups = [...new Set(divisionTeams.map(team => team.bracket).filter(Boolean))]
  const earlierSlots = slots.filter(candidate => candidate.matchNumber < slot.matchNumber)
  return <select aria-label={`Game ${slot.matchNumber} participant`} value={participantValue(value)} onChange={event => onChange(parseParticipant(event.target.value))} className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900">
    <option value="">Choose participant…</option>
    <optgroup label="Fixed team">{divisionTeams.map(team => <option key={team.id} value={`team|${team.id}`}>{team.name}</option>)}</optgroup>
    {groups.map(group => <optgroup key={group} label={`Group ${group} seed`}>{divisionTeams.filter(team => team.bracket === group).map((_, index) => <option key={`${group}-${index + 1}`} value={`seed|${group}|${index + 1}`}>{index + 1}{group}</option>)}</optgroup>)}
    {earlierSlots.length > 0 && <optgroup label="Earlier game result">{earlierSlots.flatMap(source => [
      <option key={`${source.id}-winner`} value={`outcome|${source.id}|winner`}>Winner of Game {source.matchNumber}</option>,
      <option key={`${source.id}-loser`} value={`outcome|${source.id}|loser`}>Loser of Game {source.matchNumber}</option>,
    ])}</optgroup>}
  </select>
}
