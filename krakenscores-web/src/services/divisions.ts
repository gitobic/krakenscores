import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Division } from '../types'

const COLLECTION_NAME = 'divisions'

// Convert Firestore Timestamp to Date
function convertTimestamps(data: any): Division {
  return {
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  } as Division
}

export async function getAllDivisions(): Promise<Division[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      ...convertTimestamps(doc.data()),
      id: doc.id
    }))
  } catch (error) {
    console.error('Error fetching divisions:', error)
    throw error
  }
}

export async function getDivisionById(id: string): Promise<Division | null> {
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
    console.error('Error fetching division:', error)
    throw error
  }
}

export async function createDivision(
  data: Omit<Division, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = Timestamp.now()
    const divisionData = {
      name: data.name,
      colorHex: data.colorHex,
      createdAt: now,
      updatedAt: now
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), divisionData)
    return docRef.id
  } catch (error) {
    console.error('Error creating division:', error)
    throw error
  }
}

export async function updateDivision(
  id: string,
  data: Partial<Omit<Division, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updateData: any = {
      updatedAt: Timestamp.now()
    }

    // Only add fields that are defined
    if (data.name !== undefined) updateData.name = data.name
    if (data.colorHex !== undefined) updateData.colorHex = data.colorHex

    await updateDoc(docRef, updateData)
  } catch (error) {
    console.error('Error updating division:', error)
    throw error
  }
}

export async function deleteDivision(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting division:', error)
    throw error
  }
}
