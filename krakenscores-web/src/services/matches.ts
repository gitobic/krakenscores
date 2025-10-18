import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Match } from '../types/index'
import { recalculateStandingsForDivision } from './standings'

const COLLECTION = 'matches'

export async function getAllMatches(): Promise<Match[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy('scheduledTime'))
  )
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Match
  })
}

export async function getMatchesByTournament(tournamentId: string): Promise<Match[]> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where('tournamentId', '==', tournamentId),
      orderBy('scheduledTime')
    )
  )
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Match
  })
}

export async function getMatchesByPool(poolId: string): Promise<Match[]> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where('poolId', '==', poolId),
      orderBy('scheduledTime')
    )
  )
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Match
  })
}

export async function getMatchesByDivision(divisionId: string): Promise<Match[]> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where('divisionId', '==', divisionId),
      orderBy('scheduledTime')
    )
  )
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Match
  })
}

export async function createMatch(matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...matchData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateMatch(id: string, matchData: Partial<Omit<Match, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    ...matchData,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteMatch(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}

export async function updateMatchScore(
  id: string,
  darkTeamScore: number,
  lightTeamScore: number,
  status: 'in_progress' | 'final'
): Promise<void> {
  // Get the match to find its division
  const matchRef = doc(db, COLLECTION, id)
  const matchSnap = await getDoc(matchRef)

  if (!matchSnap.exists()) {
    throw new Error('Match not found')
  }

  const match = matchSnap.data() as Match

  // Update the match
  await updateDoc(matchRef, {
    darkTeamScore,
    lightTeamScore,
    status,
    updatedAt: serverTimestamp(),
  })

  // If status is 'final', trigger standings recalculation
  if (status === 'final') {
    try {
      await recalculateStandingsForDivision(match.divisionId)
    } catch (error) {
      console.error('Error recalculating standings:', error)
      // Don't throw - match update succeeded, standings recalc can be retried manually
    }
  }
}
