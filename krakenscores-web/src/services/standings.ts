import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Standing, Match, Team } from '../types/index'
import { calculateStandings as calculateStandingsPure } from '../utils/standingsCalculator'

const COLLECTION = 'standings'

/**
 * Get standings for a specific division
 */
export async function getStandingsByDivision(divisionId: string): Promise<Standing | null> {
  const docRef = doc(db, COLLECTION, divisionId)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  return {
    divisionId: snapshot.id,
    tournamentId: data.tournamentId,
    table: data.table || [],
    tiebreakerNotes: data.tiebreakerNotes,
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  } as Standing
}

/**
 * Get all standings for a tournament
 */
export async function getStandingsByTournament(tournamentId: string): Promise<Standing[]> {
  const q = query(collection(db, COLLECTION), where('tournamentId', '==', tournamentId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      divisionId: doc.id,
      tournamentId: data.tournamentId,
      table: data.table || [],
      tiebreakerNotes: data.tiebreakerNotes,
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Standing
  })
}

/**
 * Calculate and save standings for a division, scoped to a specific tournament.
 * Pass tournamentId explicitly to avoid cross-tournament team pollution.
 */
export async function recalculateStandingsForDivision(divisionId: string, tournamentId?: string): Promise<void> {
  // Legacy team records may not have tournamentId, so scope them by participation
  // in this tournament rather than silently dropping them.
  const teamsQuery = query(collection(db, 'teams'), where('divisionId', '==', divisionId))
  const matchesQuery = tournamentId
    ? query(collection(db, 'matches'), where('divisionId', '==', divisionId), where('tournamentId', '==', tournamentId))
    : query(collection(db, 'matches'), where('divisionId', '==', divisionId))
  const [teamsSnapshot, matchesSnapshot] = await Promise.all([getDocs(teamsQuery), getDocs(matchesQuery)])

  const allTeams: Team[] = teamsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
  } as Team))

  const matches: Match[] = matchesSnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Match
  })
  const participantTeamIds = new Set(matches.flatMap(match => [match.darkTeamId, match.lightTeamId]).filter(Boolean))
  const teams = tournamentId
    ? allTeams.filter(team => team.tournamentId === tournamentId || participantTeamIds.has(team.id))
    : allTeams

  if (teams.length === 0) {
    console.warn(`No teams found for division ${divisionId}${tournamentId ? ` in tournament ${tournamentId}` : ''}`)
    return
  }

  // 3. Resolve tournamentId (use provided, or infer from matches/teams)
  const resolvedTournamentId = tournamentId
    || (matches.length > 0 ? matches[0].tournamentId : teams[0].tournamentId)

  if (!resolvedTournamentId) {
    console.error(`Cannot determine tournamentId for division ${divisionId}`)
    throw new Error('Tournament ID is required to save standings')
  }

  // 4. Calculate standings
  const standing = calculateStandingsPure(teams, matches)

  // 5. Save to Firestore
  const docRef = doc(db, COLLECTION, divisionId)
  await setDoc(docRef, {
    tournamentId: resolvedTournamentId,
    table: standing.table,
    tiebreakerNotes: standing.tiebreakerNotes,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Delete all standings documents for a tournament so they can be rebuilt cleanly.
 */
export async function deleteStandingsForTournament(tournamentId: string): Promise<void> {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('tournamentId', '==', tournamentId)))
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)))
}

/**
 * Recalculate standings for every division that has teams in a tournament.
 */
export async function recalculateAllStandingsForTournament(tournamentId: string): Promise<void> {
  const teamsSnapshot = await getDocs(
    query(collection(db, 'teams'), where('tournamentId', '==', tournamentId))
  )
  const divisionIds = Array.from(new Set(teamsSnapshot.docs.map(d => d.data().divisionId as string)))
  await Promise.all(divisionIds.map(divisionId => recalculateStandingsForDivision(divisionId, tournamentId)))
}
