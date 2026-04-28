import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Tournaments from './pages/admin/Tournaments'
import Clubs from './pages/admin/Clubs'
import Divisions from './pages/admin/Divisions'
import Teams from './pages/admin/Teams'
import Pools from './pages/admin/Pools'
import Matches from './pages/admin/Matches'
import ScheduleBreaks from './pages/admin/ScheduleBreaks'
import Scorekeeper from './pages/admin/Scorekeeper'
import Standings from './pages/admin/Standings'
import AdminAnnouncements from './pages/admin/Announcements'

import MasterSchedule from './pages/public/MasterSchedule'
import PublicStandings from './pages/public/PublicStandings'
import TeamSchedule from './pages/public/TeamSchedule'
import Announcements from './pages/public/Announcements'
import Brackets from './pages/public/Brackets'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<MasterSchedule />} />
          <Route path="/schedule" element={<MasterSchedule />} />
          <Route path="/standings" element={<PublicStandings />} />
          <Route path="/scores" element={<PublicStandings />} />
          <Route path="/team-schedule" element={<TeamSchedule />} />
          <Route path="/pocket-schedule" element={<TeamSchedule />} /> {/* Legacy route */}
          <Route path="/pocket" element={<TeamSchedule />} /> {/* Legacy route */}
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/brackets" element={<Brackets />} />
          <Route path="/login" element={<Login />} />

          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tournaments"
            element={
              <ProtectedRoute requiredRole="admin">
                <Tournaments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clubs"
            element={
              <ProtectedRoute requiredRole="admin">
                <Clubs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/divisions"
            element={
              <ProtectedRoute requiredRole="admin">
                <Divisions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute requiredRole="admin">
                <Teams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pools"
            element={
              <ProtectedRoute requiredRole="admin">
                <Pools />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/matches"
            element={
              <ProtectedRoute requiredRole="admin">
                <Matches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/schedule-breaks"
            element={
              <ProtectedRoute requiredRole="admin">
                <ScheduleBreaks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/scorekeeper"
            element={
              <ProtectedRoute requiredRole={['admin', 'scorekeeper']}>
                <Scorekeeper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/standings"
            element={
              <ProtectedRoute requiredRole="admin">
                <Standings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAnnouncements />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
