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
import type { ScheduleBreak } from '../types/index'

const COLLECTION = 'scheduleBreaks'

export async function getAllScheduleBreaks(): Promise<ScheduleBreak[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy('startTime'))
  )
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as ScheduleBreak
  })
}

export async function getScheduleBreaksByTournament(tournamentId: string): Promise<ScheduleBreak[]> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where('tournamentId', '==', tournamentId),
      orderBy('startTime')
    )
  )
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as ScheduleBreak
  })
}

export async function getScheduleBreaksByPool(poolId: string): Promise<ScheduleBreak[]> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where('poolId', '==', poolId),
      orderBy('startTime')
    )
  )
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as ScheduleBreak
  })
}

export async function createScheduleBreak(
  breakData: Omit<ScheduleBreak, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...breakData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateScheduleBreak(
  id: string,
  breakData: Partial<Omit<ScheduleBreak, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    ...breakData,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteScheduleBreak(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
