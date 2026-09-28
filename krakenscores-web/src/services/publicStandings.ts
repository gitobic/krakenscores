import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Match, Standing } from '../types'
import { getStandingsByTournament } from './standings'

export async function getFinalMatchesByTournament(tournamentId: string): Promise<Match[]> {
  const snapshot = await getDocs(query(collection(db, 'matches'),
    where('tournamentId', '==', tournamentId), where('status', '==', 'final')))
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Match))
}

interface Section<T> {
  ready: (data: T[]) => void
  failed: () => void
}

/** A slow results request must not hold up standings. Cancel on tournament changes. */
export function loadStandingsSections(tournamentId: string, sections: {
  standings: Section<Standing>
  results: Section<Match>
}): () => void {
  let active = true
  void getStandingsByTournament(tournamentId).then(data => {
    if (active) sections.standings.ready(data)
  }).catch(() => { if (active) sections.standings.failed() })
  void getFinalMatchesByTournament(tournamentId).then(data => {
    if (active) sections.results.ready(data)
  }).catch(() => { if (active) sections.results.failed() })
  return () => { active = false }
}
