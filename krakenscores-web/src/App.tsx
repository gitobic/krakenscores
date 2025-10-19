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
import Standings from './pages/admin/Standings'
import Scorekeeper from './pages/admin/Scorekeeper'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Redirect root to admin dashboard */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tournaments"
            element={
              <ProtectedRoute>
                <Tournaments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clubs"
            element={
              <ProtectedRoute>
                <Clubs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/divisions"
            element={
              <ProtectedRoute>
                <Divisions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pools"
            element={
              <ProtectedRoute>
                <Pools />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/matches"
            element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/schedule-breaks"
            element={
              <ProtectedRoute>
                <ScheduleBreaks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/standings"
            element={
              <ProtectedRoute>
                <Standings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/scorekeeper"
            element={
              <ProtectedRoute>
                <Scorekeeper />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
