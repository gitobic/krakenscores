import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'

const AuthRoute = lazy(() => import('./components/AuthRoute'))
const isRehearsalEnvironment = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
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
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100 font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-200">Loading KrakenScores…</div>}>
            {isRehearsalEnvironment && <div className="fixed bottom-3 left-1/2 z-[20000] -translate-x-1/2 rounded-full border-2 border-amber-300 bg-amber-950 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-100 shadow-xl">Local rehearsal · production protected</div>}
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
          <Route path="/login" element={<AuthRoute protect={false}><Login /></AuthRoute>} />

          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <AuthRoute requiredRole="admin">
                <Dashboard />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/setup"
            element={
              <AuthRoute requiredRole="admin">
                <TournamentSetup />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/tournaments"
            element={
              <AuthRoute requiredRole="admin" layout>
                <Tournaments />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/clubs"
            element={
              <AuthRoute requiredRole="admin" layout>
                <Clubs />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/divisions"
            element={
              <AuthRoute requiredRole="admin" layout>
                <Divisions />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <AuthRoute requiredRole="admin" layout>
                <Teams />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/pools"
            element={
              <AuthRoute requiredRole="admin" layout>
                <Pools />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/matches"
            element={
              <AuthRoute requiredRole="admin" layout>
                <Matches />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/schedule-breaks"
            element={
              <AuthRoute requiredRole="admin" layout>
                <ScheduleBreaks />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/scorekeeper"
            element={
              <AuthRoute requiredRole={['admin', 'scorekeeper']} layout>
                <Scorekeeper />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/standings"
            element={
              <AuthRoute requiredRole="admin" layout>
                <Standings />
              </AuthRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <AuthRoute requiredRole="admin" layout>
                <AdminAnnouncements />
              </AuthRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
