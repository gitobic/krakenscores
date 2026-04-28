import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from 'firebase/auth'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { Admin } from '../types'

interface AuthContextType {
  user: User | null
  admin: Admin | null
  userRole: 'admin' | 'scorekeeper' | 'public' | null // Added userRole
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'scorekeeper' | 'public' | null>(null) // Added userRole state
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Check if user is an admin
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid))
          if (adminDoc.exists()) {
            setAdmin({ id: adminDoc.id, ...adminDoc.data() } as Admin)
            setUserRole('admin')
          } else {
            setAdmin(null)
            // If not an admin, check if they are a scorekeeper
            const staffDoc = await getDoc(doc(db, 'staff', user.uid))
            if (staffDoc.exists()) {
              setUserRole('scorekeeper')
            } else {
              setUserRole('public') // Authenticated but neither admin nor scorekeeper
            }
          }
        } catch (error) {
          console.error('Error fetching user role data:', error)
          setAdmin(null)
          setUserRole('public')
        }
      } else {
        setAdmin(null)
        setUserRole('public') // Default for unauthenticated users
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // userRole will be set by onAuthStateChanged listener
    } catch (error) {
      console.error('Firebase Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setAdmin(null)
      setUserRole('public') // Reset user role on sign out
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const value = {
    user,
    admin,
    userRole, // Export userRole
    loading,
    signIn,
    signOut,
    isAdmin: !!admin
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
