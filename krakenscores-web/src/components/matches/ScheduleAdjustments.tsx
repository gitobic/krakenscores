import { useMemo, useState } from 'react'
import type { Match, Pool, ScheduleBreak } from '../../types'
import { applyScheduleChanges, moveOneMatch, shiftPoolMatches, validateScheduleChanges, type ScheduleChange } from '../../utils/scheduleOperations'

interface Props {
  matches: Match[]
  pools: Pool[]
  scheduleBreaks: ScheduleBreak[]
  onApply: (changes: ScheduleChange[]) => Promise<void>
}

type Mode = 'move' | 'shift'

export default function ScheduleAdjustments({ matches, pools, scheduleBreaks, onApply }: Props) {
  const ordered = useMemo(() => [...matches].sort((a, b) => `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(`${b.scheduledDate}T${b.scheduledTime}`)), [matches])
  const [mode, setMode] = useState<Mode>('move')
  const [matchId, setMatchId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [poolId, setPoolId] = useState('')
  const [shiftMinutes, setShiftMinutes] = useState(15)
  const [preview, setPreview] = useState<ScheduleChange[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const selected = matches.find(match => match.id === matchId)
  const proposedMatches = applyScheduleChanges(matches, preview)
  const conflicts = validateScheduleChanges(matches, scheduleBreaks, preview)

  const selectMatch = (id: string) => {
    const match = matches.find(item => item.id === id)
    setMatchId(id)
    setDate(match?.scheduledDate || '')
    setTime(match?.scheduledTime || '')
    setPoolId(match?.poolId || '')
    setPreview([])
    setMessage('')
  }

  const buildPreview = () => {
    if (!selected) return
    const changes = mode === 'move'
      ? moveOneMatch(selected, date, time, poolId)
      : shiftPoolMatches(matches, selected.id, shiftMinutes)
    setPreview(changes)
    setMessage('')
  }

  const apply = async () => {
    if (preview.length === 0 || conflicts.length > 0) return
    setSaving(true)
    try {
      await onApply(preview)
      setMessage(`${preview.length} game${preview.length === 1 ? '' : 's'} updated successfully.`)
      setPreview([])
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Tournament-day schedule adjustments</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Admin only. Preview moves and conflicts before anything is saved.</p>
        </div>
        <div className="flex rounded-md border border-slate-300 bg-slate-50 p-1 dark:border-slate-600 dark:bg-slate-950">
          <button type="button" onClick={() => { setMode('move'); setPreview([]) }} className={`rounded px-3 py-2 text-sm font-semibold ${mode === 'move' ? 'bg-blue-700 text-white' : 'text-slate-700 dark:text-slate-200'}`}>Move one game</button>
          <button type="button" onClick={() => { setMode('shift'); setPreview([]) }} className={`rounded px-3 py-2 text-sm font-semibold ${mode === 'shift' ? 'bg-blue-700 text-white' : 'text-slate-700 dark:text-slate-200'}`}>Shift later games</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="text-sm font-semibold text-slate-800 md:col-span-2 dark:text-slate-200">Game
          <select value={matchId} onChange={event => selectMatch(event.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            <option value="">Choose a game…</option>
            {ordered.map(match => <option key={match.id} value={match.id}>Game {match.matchNumber} — {match.scheduledDate} {match.scheduledTime} — {pools.find(pool => pool.id === match.poolId)?.name || 'Unknown pool'}</option>)}
          </select>
        </label>
        {mode === 'move' ? <>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">New date<input type="date" value={date} onChange={event => { setDate(event.target.value); setPreview([]) }} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">New time<input type="time" value={time} onChange={event => { setTime(event.target.value); setPreview([]) }} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
          <label className="text-sm font-semibold text-slate-800 md:col-start-3 dark:text-slate-200">New pool<select value={poolId} onChange={event => { setPoolId(event.target.value); setPreview([]) }} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-white">{pools.map(pool => <option key={pool.id} value={pool.id}>{pool.name}</option>)}</select></label>
        </> : <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Delay in minutes<input type="number" min="-180" max="360" step="5" value={shiftMinutes} onChange={event => { setShiftMinutes(Number(event.target.value)); setPreview([]) }} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /><span className="mt-1 block text-xs font-normal text-slate-600 dark:text-slate-400">Negative values move games earlier.</span></label>}
      </div>

      <button type="button" disabled={!selected || (mode === 'move' && (!date || !time || !poolId)) || (mode === 'shift' && shiftMinutes === 0)} onClick={buildPreview} className="mt-4 rounded bg-slate-900 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-700">Preview change</button>

      {preview.length > 0 && <div className="mt-4 rounded border border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-950">
        <h3 className="font-bold text-slate-950 dark:text-white">Preview: {preview.length} affected game{preview.length === 1 ? '' : 's'}</h3>
        <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm text-slate-700 dark:text-slate-200">
          {preview.map(change => {
            const match = proposedMatches.find(item => item.id === change.matchId)!
            return <li key={change.matchId}>Game {match.matchNumber}: {change.scheduledDate} at {change.scheduledTime}, {pools.find(pool => pool.id === change.poolId)?.name || 'Unknown pool'}</li>
          })}
        </ul>
        {conflicts.length > 0 ? <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-900"><div>Cannot apply until these conflicts are resolved:</div><ul className="mt-1 list-disc pl-5">{conflicts.map(conflict => <li key={`${conflict.matchId}-${conflict.message}`}>{conflict.message}</li>)}</ul></div> : <div className="mt-3 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">No pool, team, or scheduled-break conflicts found.</div>}
        <div className="mt-3 flex gap-2"><button type="button" disabled={saving || conflicts.length > 0} onClick={apply} className="rounded bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-40">{saving ? 'Applying…' : `Apply ${preview.length} change${preview.length === 1 ? '' : 's'}`}</button><button type="button" onClick={() => setPreview([])} className="rounded border border-slate-300 px-4 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">Cancel</button></div>
      </div>}
      {message && <div className="mt-3 rounded border border-emerald-300 bg-emerald-50 p-3 font-semibold text-emerald-900">{message}</div>}
    </section>
  )
}
