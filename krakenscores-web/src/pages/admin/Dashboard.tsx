import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, admin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">KrakenScores</h1>
              <p className="text-sm text-gray-500">Admin Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {admin?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-500">{admin?.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to KrakenScores Admin
          </h2>
          <p className="text-gray-600">
            Manage tournaments, teams, schedules, and scores for Team Orlando Water Polo Club.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            title="Tournaments"
            description="Create and manage tournaments"
            icon="🏆"
            onClick={() => navigate('/admin/tournaments')}
          />
          <QuickActionCard
            title="Clubs"
            description="Manage participating clubs"
            icon="🏊"
            onClick={() => navigate('/admin/clubs')}
          />
          <QuickActionCard
            title="Divisions"
            description="Set up age divisions"
            icon="📊"
            onClick={() => navigate('/admin/divisions')}
          />
          <QuickActionCard
            title="Teams"
            description="Add and organize teams"
            icon="👥"
            onClick={() => navigate('/admin/teams')}
          />
        </div>

        {/* Status Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusItem label="Firebase Connection" status="Connected" color="green" />
            <StatusItem label="Active Tournament" status="None" color="gray" />
            <StatusItem label="Total Teams" status="0" color="gray" />
          </div>
        </div>
      </main>
    </div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  icon: string
  onClick: () => void
}

function QuickActionCard({ title, description, icon, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left border border-gray-200 hover:border-blue-300"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  )
}

interface StatusItemProps {
  label: string
  status: string
  color: 'green' | 'gray' | 'red'
}

function StatusItem({ label, status, color }: StatusItemProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50 border-green-200',
    gray: 'text-gray-600 bg-gray-50 border-gray-200',
    red: 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-700">{label}:</span>
      <span className={`text-sm font-medium px-3 py-1 rounded-full border ${colorClasses[color]}`}>
        {status}
      </span>
    </div>
  )
}
