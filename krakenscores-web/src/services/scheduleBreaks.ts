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

/**
 * Check if a time range conflicts with any schedule breaks for a specific pool
 * @param poolId - The pool to check
 * @param startTime - Start time in HH:MM format
 * @param duration - Duration in minutes
 * @param breaks - Array of schedule breaks to check against
 * @returns The conflicting break if found, null otherwise
 */
export function checkScheduleBreakConflict(
  poolId: string,
  startTime: string,
  duration: number,
  breaks: ScheduleBreak[]
): ScheduleBreak | null {
  // Convert time string to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const matchStart = timeToMinutes(startTime)
  const matchEnd = matchStart + duration

  // Check each break for this pool
  for (const scheduleBreak of breaks) {
    if (scheduleBreak.poolId !== poolId) continue

    const breakStart = timeToMinutes(scheduleBreak.startTime)
    const breakEnd = timeToMinutes(scheduleBreak.endTime)

    // Check if time windows overlap
    // Overlap occurs if: matchStart < breakEnd AND matchEnd > breakStart
    if (matchStart < breakEnd && matchEnd > breakStart) {
      return scheduleBreak
    }
  }

  return null
}
