import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Tournaments = lazy(() => import('./pages/admin/Tournaments'))
const TournamentSetup = lazy(() => import('./pages/admin/TournamentSetup'))
const Clubs = lazy(() => import('./pages/admin/Clubs'))
const Divisions = lazy(() => import('./pages/admin/Divisions'))
const Teams = lazy(() => import('./pages/admin/Teams'))
const Pools = lazy(() => import('./pages/admin/Pools'))
const Matches = lazy(() => import('./pages/admin/Matches'))
const ScheduleBreaks = lazy(() => import('./pages/admin/ScheduleBreaks'))
const Scorekeeper = lazy(() => import('./pages/admin/Scorekeeper'))
const Standings = lazy(() => import('./pages/admin/Standings'))
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'))
const MasterSchedule = lazy(() => import('./pages/public/MasterSchedule'))
const PublicStandings = lazy(() => import('./pages/public/PublicStandings'))
const TeamSchedule = lazy(() => import('./pages/public/TeamSchedule'))
const Announcements = lazy(() => import('./pages/public/Announcements'))
const Brackets = lazy(() => import('./pages/public/Brackets'))
const TournamentHome = lazy(() => import('./pages/public/TournamentHome'))

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100 font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-200">Loading KrakenScores…</div>}>
            <Routes>
          {/* Public routes */}
          <Route path="/" element={<TournamentHome />} />
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
            path="/admin/setup"
            element={
              <ProtectedRoute requiredRole="admin">
                <TournamentSetup />
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
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
