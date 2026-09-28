import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const PROJECT_ID = 'demo-krakenscores'
const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore()
    await Promise.all([
      setDoc(doc(db, 'admins/admin-user'), { role: 'admin' }),
      setDoc(doc(db, 'staff/scorekeeper-user'), { role: 'scorekeeper' }),
      setDoc(doc(db, 'tournaments/tournament-1'), {
        name: 'October Tournament',
        isPublished: true,
      }),
      setDoc(doc(db, 'matches/match-1'), {
        tournamentId: 'tournament-1',
        scheduledTime: '09:00',
        darkTeamScore: 0,
        lightTeamScore: 0,
        status: 'scheduled',
        period: 1,
      }),
    ])
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

const protectedCollections = ['teams', 'pools', 'matches', 'scheduleBreaks', 'announcements', 'standings']

describe('draft privacy', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore()
      await setDoc(doc(db, 'tournaments/draft'), { isPublished: false })
      await setDoc(doc(db, 'tournaments/legacy'), { name: 'Missing publication flag' })
      for (const name of protectedCollections) {
        for (const tournamentId of ['tournament-1', 'draft', 'legacy', 'missing']) {
          await setDoc(doc(db, name, tournamentId), { tournamentId, table: [] })
        }
        await setDoc(doc(db, name, 'unassigned'), { name: 'No tournament' })
      }
    })
  })

  for (const role of ['anonymous', 'ordinary-user', 'scorekeeper-user']) {
    it(`denies draft documents and broad queries for ${role}`, async () => {
      const db = role === 'anonymous' ? testEnv.unauthenticatedContext().firestore() : testEnv.authenticatedContext(role).firestore()
      await assertFails(getDoc(doc(db, 'tournaments/draft')))
      await assertFails(getDoc(doc(db, 'tournaments/legacy')))
      await assertFails(getDocs(collection(db, 'tournaments')))
      await assertSucceeds(getDocs(query(collection(db, 'tournaments'), where('isPublished', '==', true))))
      for (const name of protectedCollections) {
        await assertSucceeds(getDoc(doc(db, name, 'tournament-1')))
        await assertSucceeds(getDocs(query(collection(db, name), where('tournamentId', '==', 'tournament-1'))))
        await assertFails(getDocs(collection(db, name)))
        await assertFails(getDocs(query(collection(db, name), where('tournamentId', '==', 'draft'))))
        for (const id of ['draft', 'legacy', 'missing', 'unassigned']) await assertFails(getDoc(doc(db, name, id)))
      }
    })
  }

  it('allows administrators to manage drafts and unassigned records', async () => {
    const db = testEnv.authenticatedContext('admin-user').firestore()
    await assertSucceeds(getDocs(collection(db, 'tournaments')))
    for (const name of protectedCollections) await assertSucceeds(getDocs(collection(db, name)))
  })

  it('revokes public reads when a tournament is unpublished and restores them when published', async () => {
    const admin = testEnv.authenticatedContext('admin-user').firestore()
    const publicDb = testEnv.unauthenticatedContext().firestore()
    await updateDoc(doc(admin, 'tournaments/tournament-1'), { isPublished: false })
    for (const name of protectedCollections) await assertFails(getDoc(doc(publicDb, name, 'tournament-1')))
    await updateDoc(doc(admin, 'tournaments/tournament-1'), { isPublished: true })
    for (const name of protectedCollections) await assertSucceeds(getDoc(doc(publicDb, name, 'tournament-1')))
  })

  it('prevents staff from modifying drafts or moving draft standings into public tournaments', async () => {
    const db = testEnv.authenticatedContext('scorekeeper-user').firestore()
    await assertFails(updateDoc(doc(db, 'matches/draft'), { darkTeamScore: 3 }))
    await assertFails(setDoc(doc(db, 'standings/new-draft'), { tournamentId: 'draft', table: [] }))
    await assertFails(updateDoc(doc(db, 'standings/draft'), { tournamentId: 'tournament-1' }))
  })
})

describe('public access', () => {
  it('allows anonymous reads of published tournament data', async () => {
    const db = testEnv.unauthenticatedContext().firestore()

    await assertSucceeds(getDoc(doc(db, 'tournaments/tournament-1')))
    await assertSucceeds(getDoc(doc(db, 'matches/match-1')))
  })

  it('denies anonymous writes', async () => {
    const db = testEnv.unauthenticatedContext().firestore()

    await assertFails(updateDoc(doc(db, 'matches/match-1'), { status: 'final' }))
  })

  it('denies access to unrecognized collections', async () => {
    const db = testEnv.unauthenticatedContext().firestore()

    await assertFails(getDoc(doc(db, 'private/example')))
  })
})

describe('authenticated users without a role', () => {
  it('cannot update scores', async () => {
    const db = testEnv.authenticatedContext('ordinary-user').firestore()

    await assertFails(updateDoc(doc(db, 'matches/match-1'), {
      darkTeamScore: 10,
      lightTeamScore: 8,
      status: 'final',
    }))
  })
})

describe('scorekeeper access', () => {
  it('can update only the permitted scorekeeping fields', async () => {
    const db = testEnv.authenticatedContext('scorekeeper-user').firestore()

    await assertSucceeds(updateDoc(doc(db, 'matches/match-1'), {
      darkTeamScore: 10,
      lightTeamScore: 8,
      status: 'final',
      period: 4,
      updatedAt: new Date('2026-10-10T14:00:00Z'),
    }))
  })

  it('cannot change scheduling fields', async () => {
    const db = testEnv.authenticatedContext('scorekeeper-user').firestore()

    await assertFails(updateDoc(doc(db, 'matches/match-1'), {
      scheduledTime: '10:00',
    }))
  })

  it('cannot create or delete matches', async () => {
    const db = testEnv.authenticatedContext('scorekeeper-user').firestore()

    await assertFails(setDoc(doc(db, 'matches/match-2'), { status: 'scheduled' }))
    await assertFails(deleteDoc(doc(db, 'matches/match-1')))
  })

  it('can read its own membership but not another staff record', async () => {
    const db = testEnv.authenticatedContext('scorekeeper-user').firestore()

    await assertSucceeds(getDoc(doc(db, 'staff/scorekeeper-user')))
    await assertFails(getDoc(doc(db, 'staff/another-user')))
  })

  it('can write derived advancement and standings fields but not participant sources', async () => {
    const db = testEnv.authenticatedContext('scorekeeper-user').firestore()

    await assertSucceeds(updateDoc(doc(db, 'matches/match-1'), {
      darkTeamId: 'team-a',
      lightTeamId: 'team-b',
      darkTeamLabel: '1F',
      lightTeamLabel: 'Winner of Game 52',
    }))
    await assertSucceeds(setDoc(doc(db, 'standings/division-1'), {
      tournamentId: 'tournament-1',
      table: [],
      updatedAt: new Date('2026-10-10T14:00:00Z'),
    }))
    await assertFails(updateDoc(doc(db, 'matches/match-1'), {
      darkParticipant: { source: 'team', teamId: 'unauthorized-change' },
    }))
  })
})

describe('administrator access', () => {
  it('can create, update, and delete tournament data', async () => {
    const db = testEnv.authenticatedContext('admin-user').firestore()
    const matchRef = doc(db, 'matches/admin-match')

    await assertSucceeds(setDoc(matchRef, { status: 'scheduled' }))
    await assertSucceeds(updateDoc(matchRef, { scheduledTime: '11:00' }))
    await assertSucceeds(deleteDoc(matchRef))
  })

  it('can read admin and staff membership documents', async () => {
    const db = testEnv.authenticatedContext('admin-user').firestore()

    await assertSucceeds(getDoc(doc(db, 'admins/admin-user')))
    await assertSucceeds(getDoc(doc(db, 'staff/scorekeeper-user')))
  })
})
