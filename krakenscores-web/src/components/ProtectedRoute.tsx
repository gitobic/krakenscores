import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: ('admin' | 'scorekeeper' | 'public') | ('admin' | 'scorekeeper' | 'public')[] // Allow array of roles
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth() // Get userRole from context

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If a required role(s) is specified, check if the user has one of those roles
  if (requiredRole) {
    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!userRole || !rolesArray.includes(userRole)) {
      // If user is logged in but doesn't have the required role, redirect to admin dashboard
      if (user) {
        return <Navigate to="/admin" replace />
      }
      // If not logged in at all, redirect to login
      return <Navigate to="/login" replace />
    }
  }

  // If no specific role is required, or if the user has the required role,
  // ensure they are at least authenticated (for any protected route)
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
