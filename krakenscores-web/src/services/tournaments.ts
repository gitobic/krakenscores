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
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Tournament } from '../types'

export interface SetupTeamInput {
  clubKey: string
  divisionId: string
  name: string
  bracket?: string
}

export interface SetupClubInput {
  key: string
  name: string
  abbreviation: string
}

export interface SetupPoolInput {
  key: string
  name: string
  location: string
  defaultStartTime: string
}

export interface SetupSlotInput {
  matchNumber: number
  poolKey: string
  divisionId: string
  scheduledDate: string
  scheduledTime: string
  duration: number
}

const COLLECTION_NAME = 'tournaments'

// Convert Firestore Timestamp to Date
function convertTimestamps(data: DocumentData): Tournament {
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
    const tournamentData: Record<string, unknown> = {
      name: data.name,
      startDate: Timestamp.fromDate(new Date(data.startDate)),
      endDate: Timestamp.fromDate(new Date(data.endDate)),
      defaultMatchDuration: data.defaultMatchDuration || 55,
      divisionIds: data.divisionIds || [],
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

export async function createTournamentSetupDraft(
  data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>,
  teams: SetupTeamInput[],
  newClubs: SetupClubInput[] = [],
  pools: SetupPoolInput[] = [],
  slots: SetupSlotInput[] = []
): Promise<string> {
  const writeCount = 1 + teams.length + newClubs.length + pools.length + slots.length
  if (writeCount > 500) throw new Error('This setup draft exceeds Firestore’s 500-record batch limit. Split the schedule into a later save.')
  const now = Timestamp.now()
  const tournamentRef = doc(collection(db, COLLECTION_NAME))
  const batch = writeBatch(db)
  const tournamentData: Record<string, unknown> = {
    name: data.name,
    startDate: Timestamp.fromDate(new Date(data.startDate)),
    endDate: Timestamp.fromDate(new Date(data.endDate)),
    defaultMatchDuration: data.defaultMatchDuration || 55,
    divisionIds: data.divisionIds || [],
    isPublished: false,
    createdAt: now,
    updatedAt: now,
  }
  if (data.logoUrl?.trim()) tournamentData.logoUrl = data.logoUrl
  batch.set(tournamentRef, tournamentData)

  const clubIds = new Map<string, string>()
  newClubs.forEach(club => {
    const clubRef = doc(collection(db, 'clubs'))
    clubIds.set(club.key, clubRef.id)
    batch.set(clubRef, {
      name: club.name.trim(),
      abbreviation: club.abbreviation.trim().toUpperCase(),
      createdAt: now,
      updatedAt: now,
    })
  })

  teams.forEach(team => {
    const teamRef = doc(collection(db, 'teams'))
    batch.set(teamRef, {
      tournamentId: tournamentRef.id,
      clubId: clubIds.get(team.clubKey) || team.clubKey,
      divisionId: team.divisionId,
      name: team.name.trim(),
      ...(team.bracket?.trim() ? { bracket: team.bracket.trim().toUpperCase() } : {}),
      createdAt: now,
      updatedAt: now,
    })
  })

  const poolIds = new Map<string, string>()
  pools.forEach(pool => {
    const poolRef = doc(collection(db, 'pools'))
    poolIds.set(pool.key, poolRef.id)
    batch.set(poolRef, {
      tournamentId: tournamentRef.id,
      name: pool.name.trim(),
      location: pool.location.trim(),
      defaultStartTime: pool.defaultStartTime,
      createdAt: now,
      updatedAt: now,
    })
  })

  slots.forEach(slot => {
    const matchRef = doc(collection(db, 'matches'))
    batch.set(matchRef, {
      tournamentId: tournamentRef.id,
      divisionId: slot.divisionId,
      poolId: poolIds.get(slot.poolKey) || slot.poolKey,
      matchNumber: slot.matchNumber,
      scheduledDate: slot.scheduledDate,
      scheduledTime: slot.scheduledTime,
      duration: slot.duration,
      darkTeamId: '',
      lightTeamId: '',
      darkTeamLabel: 'TBD',
      lightTeamLabel: 'TBD',
      status: 'scheduled',
      roundType: 'pool',
      isSemiFinal: false,
      isFinal: false,
      createdAt: now,
      updatedAt: now,
    })
  })

  await batch.commit()
  return tournamentRef.id
}

export async function updateTournament(
  id: string,
  data: Partial<Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now()
    }

    // Only add fields that are defined
    if (data.name !== undefined) updateData.name = data.name
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
    if (data.defaultMatchDuration !== undefined) updateData.defaultMatchDuration = data.defaultMatchDuration
    if (data.divisionIds !== undefined) updateData.divisionIds = data.divisionIds

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
