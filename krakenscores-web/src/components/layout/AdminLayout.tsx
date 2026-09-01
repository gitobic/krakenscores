import type { ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-shell" style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--ks-page-bg)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar - Fixed position */}
      <AdminSidebar />

      {/* Main Content Area - Offset by sidebar width */}
      <div style={{
        marginLeft: '220px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {children}
      </div>
    </div>
  )
}
