import type { SetupParticipantInput, SetupSlotInput } from '../services/tournaments'

export const SETUP_CSV_COLUMNS = ['game_number', 'date', 'time', 'pool', 'division', 'dark', 'light', 'duration', 'round_type'] as const

export interface CsvLookupItem { key: string; name: string }
export interface CsvClub extends CsvLookupItem { abbreviation: string }
export interface CsvTeam extends CsvLookupItem { divisionId: string; clubKey: string }
export interface SetupCsvIssue { row: number; field: string; message: string }
export interface SetupCsvSlot extends SetupSlotInput { poolName: string; divisionName: string; roundType: 'pool' | 'semi' | 'final' | 'placement' }

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const character = line[index]
    if (character === '"' && quoted && line[index + 1] === '"') { value += '"'; index++ }
    else if (character === '"') quoted = !quoted
    else if (character === ',' && !quoted) { values.push(value.trim()); value = '' }
    else value += character
  }
  values.push(value.trim())
  return values
}

function participant(input: string, divisionId: string, row: number, earlierGames: Map<number, string>, teams: CsvTeam[], clubs: CsvClub[]): { value?: SetupParticipantInput; issue?: SetupCsvIssue } {
  const seed = input.match(/^(\d+)\s*([a-z][a-z0-9_-]*)$/i)
  if (seed) return { value: { source: 'groupSeed', rank: Number(seed[1]), groupId: seed[2].toUpperCase() } }
  const outcome = input.match(/^(winner|loser)\s*(?:of\s*)?(?:game\s*)?-?\s*(\d+)$/i)
  if (outcome) {
    const matchKey = earlierGames.get(Number(outcome[2]))
    return matchKey
      ? { value: { source: 'matchOutcome', matchKey, outcome: outcome[1].toLowerCase() as 'winner' | 'loser' } }
      : { issue: { row, field: 'participant', message: `Game ${outcome[2]} must appear earlier in the file.` } }
  }

  const exactTeams = teams.filter(team => team.divisionId === divisionId && team.name.toLocaleLowerCase() === input.toLocaleLowerCase())
  if (exactTeams.length === 1) return { value: { source: 'team', teamKey: exactTeams[0].key } }
  const [abbreviation, explicitName] = input.split(':', 2).map(value => value.trim())
  const club = clubs.find(item => item.abbreviation.toLocaleLowerCase() === abbreviation.toLocaleLowerCase())
  if (club) {
    const clubTeams = teams.filter(team => team.divisionId === divisionId && team.clubKey === club.key && (!explicitName || team.name.toLocaleLowerCase() === explicitName.toLocaleLowerCase()))
    if (clubTeams.length === 1) return { value: { source: 'team', teamKey: clubTeams[0].key } }
    if (clubTeams.length > 1) return { issue: { row, field: 'participant', message: `"${input}" is ambiguous. Use ${club.abbreviation}: Exact Team Name.` } }
  }
  return { issue: { row, field: 'participant', message: `"${input}" does not match a team, group seed, winner, or loser.` } }
}

export function parseSetupCsv(text: string, context: { pools: CsvLookupItem[]; divisions: CsvLookupItem[]; teams: CsvTeam[]; clubs: CsvClub[]; defaultDuration: number }): { slots: SetupCsvSlot[]; issues: SetupCsvIssue[] } {
  const lines = text.replaceAll('\r\n', '\n').split('\n').filter(line => line.trim())
  const issues: SetupCsvIssue[] = []
  const slots: SetupCsvSlot[] = []
  if (!lines.length) return { slots, issues: [{ row: 1, field: 'file', message: 'The CSV is empty.' }] }
  const header = parseCsvLine(lines[0]).map(value => value.toLocaleLowerCase())
  SETUP_CSV_COLUMNS.forEach(column => { if (!header.includes(column)) issues.push({ row: 1, field: column, message: `Missing required column "${column}".` }) })
  if (issues.length) return { slots, issues }
  const column = (name: typeof SETUP_CSV_COLUMNS[number]) => header.indexOf(name)
  const earlierGames = new Map<number, string>()

  lines.slice(1).forEach((line, index) => {
    const row = index + 2
    const values = parseCsvLine(line)
    const number = Number(values[column('game_number')])
    const pool = context.pools.find(item => item.name.toLocaleLowerCase() === values[column('pool')]?.toLocaleLowerCase())
    const division = context.divisions.find(item => item.name.toLocaleLowerCase() === values[column('division')]?.toLocaleLowerCase())
    if (!Number.isInteger(number) || number < 1) issues.push({ row, field: 'game_number', message: 'Game number must be a positive whole number.' })
    if (earlierGames.has(number)) issues.push({ row, field: 'game_number', message: `Game number ${number} is duplicated.` })
    if (!pool) issues.push({ row, field: 'pool', message: `Pool "${values[column('pool')]}" was not found.` })
    if (!division) issues.push({ row, field: 'division', message: `Division "${values[column('division')]}" was not selected.` })
    const date = values[column('date')] || ''
    const time = values[column('time')] || ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) issues.push({ row, field: 'date', message: 'Use YYYY-MM-DD.' })
    if (!/^\d{2}:\d{2}$/.test(time)) issues.push({ row, field: 'time', message: 'Use 24-hour HH:MM.' })
    const key = `csv-row-${row}`
    const dark = division ? participant(values[column('dark')] || '', division.key, row, earlierGames, context.teams, context.clubs) : {}
    const light = division ? participant(values[column('light')] || '', division.key, row, earlierGames, context.teams, context.clubs) : {}
    if (dark.issue) issues.push({ ...dark.issue, field: 'dark' })
    if (light.issue) issues.push({ ...light.issue, field: 'light' })
    if (pool && division && dark.value && light.value && Number.isInteger(number) && number > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time)) {
      const roundTypeRaw = values[column('round_type')]?.toLocaleLowerCase()
      const roundType = ['pool', 'semi', 'final', 'placement'].includes(roundTypeRaw)
        ? roundTypeRaw as SetupCsvSlot['roundType']
        : 'pool'
      slots.push({ key, matchNumber: number, poolKey: pool.key, poolName: pool.name, divisionId: division.key, divisionName: division.name, scheduledDate: date, scheduledTime: time, duration: Number(values[column('duration')]) || context.defaultDuration, roundType, darkParticipant: dark.value, lightParticipant: light.value })
      earlierGames.set(number, key)
    }
  })
  return { slots, issues }
}

const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

export function exportSetupCsv(slots: SetupCsvSlot[], participantName: (participant: SetupParticipantInput) => string): string {
  return [SETUP_CSV_COLUMNS.join(','), ...slots.map(slot => [slot.matchNumber, slot.scheduledDate, slot.scheduledTime, slot.poolName, slot.divisionName, slot.darkParticipant ? participantName(slot.darkParticipant) : '', slot.lightParticipant ? participantName(slot.lightParticipant) : '', slot.duration, slot.roundType || 'pool'].map(quote).join(','))].join('\n')
}
