import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

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
        isPublished: false,
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

describe('public access', () => {
  it('allows anonymous reads of tournament data under the current public policy', async () => {
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
