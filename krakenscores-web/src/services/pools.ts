import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Pool } from '../types/index'

const COLLECTION = 'pools'

export async function getAllPools(): Promise<Pool[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy('name'))
  )
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Pool
  })
}

export async function getPoolsByTournament(tournamentId: string): Promise<Pool[]> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where('tournamentId', '==', tournamentId),
      orderBy('name')
    )
  )
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Pool
  })
}

export async function createPool(poolData: Omit<Pool, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const data: any = {
    name: poolData.name,
    location: poolData.location,
    defaultStartTime: poolData.defaultStartTime,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  // Only add tournamentId if it's defined
  if (poolData.tournamentId !== undefined) {
    data.tournamentId = poolData.tournamentId
  }

  const docRef = await addDoc(collection(db, COLLECTION), data)
  return docRef.id
}

export async function updatePool(id: string, poolData: Partial<Omit<Pool, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    ...poolData,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePool(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
