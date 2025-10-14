import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Team } from '../types'

const COLLECTION_NAME = 'teams'

// Convert Firestore Timestamp to Date
function convertTimestamps(data: any): Team {
  return {
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  } as Team
}

export async function getAllTeams(): Promise<Team[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }))
  } catch (error) {
    console.error('Error fetching teams:', error)
    throw error
  }
}

export async function getTeamsByTournament(tournamentId: string): Promise<Team[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('tournamentId', '==', tournamentId),
      orderBy('name', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }))
  } catch (error) {
    console.error('Error fetching teams for tournament:', error)
    throw error
  }
}

export async function getTeamsByClub(clubId: string): Promise<Team[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('clubId', '==', clubId),
      orderBy('name', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }))
  } catch (error) {
    console.error('Error fetching teams for club:', error)
    throw error
  }
}

export async function getTeamsByDivision(divisionId: string): Promise<Team[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('divisionId', '==', divisionId),
      orderBy('name', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }))
  } catch (error) {
    console.error('Error fetching teams for division:', error)
    throw error
  }
}

export async function getTeamById(id: string): Promise<Team | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data())
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching team:', error)
    throw error
  }
}

export async function createTeam(
  data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = Timestamp.now()
    const teamData: any = {
      tournamentId: data.tournamentId,
      clubId: data.clubId,
      divisionId: data.divisionId,
      name: data.name,
      createdAt: now,
      updatedAt: now
    }

    // Only add seedRank if it's defined
    if (data.seedRank !== undefined) {
      teamData.seedRank = data.seedRank
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), teamData)
    return docRef.id
  } catch (error) {
    console.error('Error creating team:', error)
    throw error
  }
}

export async function updateTeam(
  id: string,
  data: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updateData: any = {
      updatedAt: Timestamp.now()
    }

    // Only add fields that are defined
    if (data.tournamentId !== undefined) updateData.tournamentId = data.tournamentId
    if (data.clubId !== undefined) updateData.clubId = data.clubId
    if (data.divisionId !== undefined) updateData.divisionId = data.divisionId
    if (data.name !== undefined) updateData.name = data.name
    if (data.seedRank !== undefined) updateData.seedRank = data.seedRank

    await updateDoc(docRef, updateData)
  } catch (error) {
    console.error('Error updating team:', error)
    throw error
  }
}

export async function deleteTeam(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting team:', error)
    throw error
  }
}
