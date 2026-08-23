import type { Match, MatchParticipantSlot } from '../types'
import { participantLabel } from './participantSlots'

export interface BracketEdge {
  sourceMatchId: string
  targetMatchId: string
  targetSide: 'dark' | 'light'
  outcome: 'winner' | 'loser'
}

function legacySlot(match: Match, side: 'dark' | 'light', matches: Match[]): MatchParticipantSlot | null {
  const source = side === 'dark' ? match.feedsFrom?.darkFrom : match.feedsFrom?.lightFrom
  if (source && (source.type === 'winnerOf' || source.type === 'loserOf')) {
    const value = String(source.value).match(/\d+/)?.[0]
    const sourceMatch = matches.find(candidate => candidate.matchNumber === Number(value) || candidate.bracketRef === String(source.value))
    if (sourceMatch) return { source: 'matchOutcome', matchId: sourceMatch.id, outcome: source.type === 'winnerOf' ? 'winner' : 'loser' }
  }

  const label = side === 'dark' ? match.darkTeamLabel : match.lightTeamLabel
  const outcomeLabel = label?.match(/\b(winner|loser)\b[^0-9]*(\d+)/i)
  if (!outcomeLabel) return null
  const sourceMatch = matches.find(candidate => candidate.matchNumber === Number(outcomeLabel[2]))
  return sourceMatch ? { source: 'matchOutcome', matchId: sourceMatch.id, outcome: outcomeLabel[1].toLocaleLowerCase() as 'winner' | 'loser' } : null
}

export function bracketSlot(match: Match, side: 'dark' | 'light', matches: Match[]): MatchParticipantSlot | null {
  const canonical = side === 'dark' ? match.darkParticipant : match.lightParticipant
  if (canonical) return canonical
  return legacySlot(match, side, matches)
}

export function bracketEdges(matches: Match[]): BracketEdge[] {
  return matches.flatMap(match => (['dark', 'light'] as const).flatMap(side => {
    const slot = bracketSlot(match, side, matches)
    return slot?.source === 'matchOutcome' ? [{ sourceMatchId: slot.matchId, targetMatchId: match.id, targetSide: side, outcome: slot.outcome }] : []
  }))
}

export function bracketColumns(matches: Match[]): Match[][] {
  const edges = bracketEdges(matches)
  const memo = new Map<string, number>()
  const depth = (matchId: string, visiting = new Set<string>()): number => {
    if (memo.has(matchId)) return memo.get(matchId)!
    if (visiting.has(matchId)) return 0
    const sources = edges.filter(edge => edge.targetMatchId === matchId).map(edge => edge.sourceMatchId).filter(id => matches.some(match => match.id === id))
    const value = sources.length ? Math.max(...sources.map(id => depth(id, new Set([...visiting, matchId])))) + 1 : 0
    memo.set(matchId, value)
    return value
  }
  const columns: Match[][] = []
  matches.forEach(match => { const index = depth(match.id); if (!columns[index]) columns[index] = []; columns[index].push(match) })
  return columns.filter(Boolean).map(column => column.sort((a, b) => a.matchNumber - b.matchNumber))
}

export function provisionalParticipantLabel(match: Match, side: 'dark' | 'light', matches: Match[]): string {
  const slot = bracketSlot(match, side, matches)
  if (slot) {
    if (slot.source === 'team') return ''
    return participantLabel(slot, matches)
  }
  return (side === 'dark' ? match.darkTeamLabel : match.lightTeamLabel) || 'To be determined'
}
