import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Tournament } from '../types'

const COLLECTION_NAME = 'tournaments'

// Convert Firestore Timestamp to Date
function convertTimestamps(data: any): Tournament {
  return {
    ...data,
    startDate: data.startDate?.toDate() || new Date(),
    endDate: data.endDate?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  } as Tournament
}

export async function getAllTournaments(): Promise<Tournament[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('startDate', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      ...convertTimestamps(doc.data()),
      id: doc.id
    }))
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    throw error
  }
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        ...convertTimestamps(docSnap.data()),
        id: docSnap.id
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching tournament:', error)
    throw error
  }
}

export async function createTournament(
  data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = Timestamp.now()
    const tournamentData: any = {
      name: data.name,
      startDate: Timestamp.fromDate(new Date(data.startDate)),
      endDate: Timestamp.fromDate(new Date(data.endDate)),
      isPublished: data.isPublished,
      createdAt: now,
      updatedAt: now
    }

    // Only add logoUrl if it's not undefined or empty
    if (data.logoUrl && data.logoUrl.trim() !== '') {
      tournamentData.logoUrl = data.logoUrl
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), tournamentData)
    return docRef.id
  } catch (error) {
    console.error('Error creating tournament:', error)
    throw error
  }
}

export async function updateTournament(
  id: string,
  data: Partial<Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updateData: any = {
      updatedAt: Timestamp.now()
    }

    // Only add fields that are defined
    if (data.name !== undefined) updateData.name = data.name
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished

    // Handle logoUrl - delete if empty, update if has value
    if (data.logoUrl !== undefined) {
      if (data.logoUrl && data.logoUrl.trim() !== '') {
        updateData.logoUrl = data.logoUrl
      } else {
        // Delete the field if logoUrl is empty
        updateData.logoUrl = deleteField()
      }
    }

    // Convert Date fields to Timestamps if present
    if (data.startDate) {
      updateData.startDate = Timestamp.fromDate(new Date(data.startDate))
    }
    if (data.endDate) {
      updateData.endDate = Timestamp.fromDate(new Date(data.endDate))
    }

    await updateDoc(docRef, updateData)
  } catch (error) {
    console.error('Error updating tournament:', error)
    throw error
  }
}

export async function deleteTournament(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting tournament:', error)
    throw error
  }
}

export async function toggleTournamentPublish(
  id: string,
  isPublished: boolean
): Promise<void> {
  try {
    await updateTournament(id, { isPublished })
  } catch (error) {
    console.error('Error toggling tournament publish status:', error)
    throw error
  }
}
