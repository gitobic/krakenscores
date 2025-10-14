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
import type { Club } from '../types'

const COLLECTION_NAME = 'clubs'

// Convert Firestore Timestamp to Date
function convertTimestamps(data: any): Club {
  return {
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  } as Club
}

export async function getAllClubs(): Promise<Club[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }))
  } catch (error) {
    console.error('Error fetching clubs:', error)
    throw error
  }
}

export async function getClubById(id: string): Promise<Club | null> {
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
    console.error('Error fetching club:', error)
    throw error
  }
}

export async function createClub(
  data: Omit<Club, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = Timestamp.now()
    const clubData: any = {
      name: data.name,
      abbreviation: data.abbreviation,
      createdAt: now,
      updatedAt: now
    }

    // Only add logoUrl if it's not undefined or empty
    if (data.logoUrl && data.logoUrl.trim() !== '') {
      clubData.logoUrl = data.logoUrl
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), clubData)
    return docRef.id
  } catch (error) {
    console.error('Error creating club:', error)
    throw error
  }
}

export async function updateClub(
  id: string,
  data: Partial<Omit<Club, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updateData: any = {
      updatedAt: Timestamp.now()
    }

    // Only add fields that are defined
    if (data.name !== undefined) updateData.name = data.name
    if (data.abbreviation !== undefined) updateData.abbreviation = data.abbreviation

    // Handle logoUrl - delete if empty, update if has value
    if (data.logoUrl !== undefined) {
      if (data.logoUrl && data.logoUrl.trim() !== '') {
        updateData.logoUrl = data.logoUrl
      } else {
        // Delete the field if logoUrl is empty
        updateData.logoUrl = deleteField()
      }
    }

    await updateDoc(docRef, updateData)
  } catch (error) {
    console.error('Error updating club:', error)
    throw error
  }
}

export async function deleteClub(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting club:', error)
    throw error
  }
}
