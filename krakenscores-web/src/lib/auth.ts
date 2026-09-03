import { connectAuthEmulator, getAuth } from 'firebase/auth'
import app, { isRehearsalEnvironment } from './firebase'

export const auth = getAuth(app)

if (isRehearsalEnvironment) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}
