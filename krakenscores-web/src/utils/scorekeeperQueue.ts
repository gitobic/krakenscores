import type { Match } from '../types/index'

export interface ScorekeeperQueue<T extends { match: Match }> {
  current: T[]
  next: T[]
  recent: T[]
}

const startsAt = (match: Match) => new Date(`${match.scheduledDate}T${match.scheduledTime}:00`).getTime()

export function buildScorekeeperQueue<T extends { match: Match }>(items: T[], now = new Date()): ScorekeeperQueue<T> {
  const nowMs = now.getTime()
  const chronological = [...items].sort((a, b) => startsAt(a.match) - startsAt(b.match) || a.match.matchNumber - b.match.matchNumber)
  const current = chronological.filter(item => item.match.status === 'in_progress' || (
    item.match.status === 'scheduled' && startsAt(item.match) <= nowMs && startsAt(item.match) + item.match.duration * 60000 > nowMs
  ))
  const next = chronological.filter(item => item.match.status === 'scheduled' && startsAt(item.match) > nowMs).slice(0, 6)
  const recent = chronological.filter(item => item.match.status === 'final' && startsAt(item.match) <= nowMs).slice(-6).reverse()
  return { current, next, recent }
}
