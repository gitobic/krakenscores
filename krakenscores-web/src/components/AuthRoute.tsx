import type { ComponentProps, ReactNode } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import AdminLayout from './layout/AdminLayout'

interface AuthRouteProps {
  children: ReactNode
  protect?: boolean
  layout?: boolean
  requiredRole?: ComponentProps<typeof ProtectedRoute>['requiredRole']
}

export default function AuthRoute({ children, protect = true, layout = false, requiredRole }: AuthRouteProps) {
  const content = layout ? <AdminLayout>{children}</AdminLayout> : children
  return (
    <AuthProvider>
      {protect ? <ProtectedRoute requiredRole={requiredRole}>{content}</ProtectedRoute> : content}
    </AuthProvider>
  )
}
