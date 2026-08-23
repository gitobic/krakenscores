const projectId = 'demo-krakenscores'
const authBase = 'http://127.0.0.1:9099'
const firestoreBase = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`
const email = 'admin@krakenscores.test'
const password = 'KrakenMock2026!'

if (!projectId.startsWith('demo-') || !authBase.includes('127.0.0.1') || !firestoreBase.includes('127.0.0.1')) {
  throw new Error('Rehearsal seeding is restricted to local demo emulators.')
}

async function authRequest(action) {
  const response = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:${action}?key=demo-api-key`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error?.message || `Auth emulator ${action} failed`)
  return body
}

async function putDocument(collection, id, fields) {
  const response = await fetch(`${firestoreBase}/${collection}/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: 'Bearer owner' },
    body: JSON.stringify({ fields }),
  })
  if (!response.ok) throw new Error(`Unable to seed ${collection}/${id}: ${await response.text()}`)
}

let account
try {
  account = await authRequest('signUp')
} catch (error) {
  if (!String(error).includes('EMAIL_EXISTS')) throw error
  account = await authRequest('signInWithPassword')
}

const now = new Date().toISOString()
await putDocument('admins', account.localId, {
  email: { stringValue: email },
  displayName: { stringValue: 'Rehearsal Administrator' },
  role: { stringValue: 'super_admin' },
  createdAt: { timestampValue: now },
  updatedAt: { timestampValue: now },
})

const divisions = [
  ['10u-coed', '10u CoEd', '#F0E442'], ['12u-coed', '12u CoEd', '#8DD3C7'], ['13u-coed', '13u CoEd', '#CAB2D6'],
  ['14u-coed', '14u CoEd', '#E69F00'], ['15u-boys', '15u Boys', '#6A3D9A'], ['16u-boys', '16u Boys', '#56B4E9'],
  ['16u-girls', '16u Girls', '#CC79A7'], ['18u-boys', '18u Boys', '#D55E00'], ['18u-girls', '18u Girls', '#009E73'],
  ['masters', 'Masters', '#0072B2'], ['mens-open', 'Mens Open', '#B3DE69'], ['womens-open', 'Womens Open', '#EE95A8'],
]
await Promise.all(divisions.map(([id, name, colorHex]) => putDocument('divisions', id, {
  name: { stringValue: name }, colorHex: { stringValue: colorHex }, createdAt: { timestampValue: now }, updatedAt: { timestampValue: now },
})))

console.log('Rehearsal sandbox ready.')
console.log(`Mock admin: ${email}`)
console.log(`Mock password: ${password}`)
