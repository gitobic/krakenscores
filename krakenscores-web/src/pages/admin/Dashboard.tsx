import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { admin, signOut } = useAuth()
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
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#2563eb',
                marginBottom: '4px'
              }}>
                KrakenScores
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Admin Dashboard
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '2px'
                }}>
                  Admin User
                </p>
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  {admin?.role || 'super_admin'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.borderColor = '#9ca3af'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px'
          }}>
            Welcome to KrakenScores Admin
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Manage tournaments, teams, schedules, and scores for Team Orlando Water Polo Club.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          maxWidth: '1100px'
        }}>
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
          <QuickActionCard
            title="Pools"
            description="Manage pool locations"
            icon="🏊‍♂️"
            onClick={() => navigate('/admin/pools')}
          />
          <QuickActionCard
            title="Matches"
            description="Schedule matches"
            icon="⏱️"
            onClick={() => navigate('/admin/matches')}
          />
          <QuickActionCard
            title="Schedule Breaks"
            description="Manage breaks and ceremonies"
            icon="☕"
            onClick={() => navigate('/admin/schedule-breaks')}
          />
          <QuickActionCard
            title="Standings"
            description="View team standings"
            icon="📈"
            onClick={() => navigate('/admin/standings')}
          />
          <QuickActionCard
            title="Scorekeeper"
            description="Enter scores during tournament"
            icon="🎯"
            onClick={() => navigate('/admin/scorekeeper')}
          />
          <QuickActionCard
            title="Public Schedule"
            description="View public master schedule"
            icon="📅"
            onClick={() => window.open('/schedule', '_blank')}
          />
          <QuickActionCard
            title="Public Standings"
            description="View public standings"
            icon="📊"
            onClick={() => window.open('/standings', '_blank')}
          />
        </div>

        {/* Status Section */}
        <div style={{
          marginTop: '48px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '24px'
          }}>
            System Status
          </h3>
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

function QuickActionCard({ title, icon, onClick }: QuickActionCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? '#2563eb' : '#475569',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: isHovered
          ? '0 6px 16px rgba(37, 99, 235, 0.3)'
          : '0 2px 6px rgba(0, 0, 0, 0.15)',
        textAlign: 'center',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: '100%',
        aspectRatio: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
    >
      <div style={{
        fontSize: '36px',
        lineHeight: '1'
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '15px',
        fontWeight: '600',
        color: 'white',
        lineHeight: '1.2'
      }}>
        {title}
      </h3>
    </button>
  )
}

interface StatusItemProps {
  label: string
  status: string
  color: 'green' | 'gray' | 'red'
}

function StatusItem({ label, status, color }: StatusItemProps) {
  const colorStyles = {
    green: {
      text: '#059669',
      bg: '#d1fae5',
      border: '#6ee7b7'
    },
    gray: {
      text: '#4b5563',
      bg: '#f3f4f6',
      border: '#d1d5db'
    },
    red: {
      text: '#dc2626',
      bg: '#fee2e2',
      border: '#fca5a5'
    }
  }

  const styles = colorStyles[color]

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0'
    }}>
      <span style={{
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151'
      }}>
        {label}:
      </span>
      <span style={{
        fontSize: '14px',
        fontWeight: '600',
        color: styles.text,
        backgroundColor: styles.bg,
        padding: '6px 14px',
        borderRadius: '20px',
        border: `1px solid ${styles.border}`
      }}>
        {status}
      </span>
    </div>
  )
}
