import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { getAllTeams } from '../../services/teams'
import { getAllTournaments } from '../../services/tournaments'
import { getAllMatches } from '../../services/matches'
import type { Team, Tournament, Match } from '../../types'

export default function Dashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [teamsData, tournamentsData, matchesData] = await Promise.all([
        getAllTeams(),
        getAllTournaments(),
        getAllMatches()
      ])
      setTeams(teamsData)
      setTournaments(tournamentsData)
      setMatches(matchesData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate active tournament (published and current date is within tournament dates)
  const activeTournament = tournaments.find(t => {
    if (!t.isPublished) return false
    const now = new Date()
    const start = new Date(t.startDate)
    const end = new Date(t.endDate)
    // Set to start of day for comparison
    now.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return now >= start && now <= end
  })

  // Calculate today's matches
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const todayMatches = matches.filter(m => m.scheduledDate === today)
  const todayRemaining = todayMatches.filter(m => m.status !== 'final' && m.status !== 'cancelled')

  return (
    <AdminLayout>
      <main style={{
        padding: '48px 40px',
        maxWidth: '1200px',
        width: '100%'
      }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px'
          }}>
            Welcome to KrakenScores
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            Manage tournaments, teams, schedules, and scores for Team Orlando Water Polo Club.
          </p>
        </div>

        {/* Recent Activity Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '20px'
          }}>
            Recent Activity
          </h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {loading ? (
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading...</p>
            ) : (
              <>
                <ActivityItem
                  icon="⏱️"
                  text={`${todayMatches.length} matches scheduled today`}
                  time="Today"
                  color="#2563eb"
                />
                <ActivityItem
                  icon="👥"
                  text={`${teams.length} teams registered`}
                  time="Current"
                  color="#16a34a"
                />
                <ActivityItem
                  icon="🏆"
                  text={activeTournament ? `${activeTournament.name} is active` : 'No active tournament'}
                  time="Status"
                  color={activeTournament ? '#f59e0b' : '#6b7280'}
                />
              </>
            )}
          </div>
        </div>

        {/* Quick Stats Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '24px'
          }}>
            Quick Stats
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <StatCard
              label="Active Tournament"
              value={loading ? '...' : (activeTournament?.name || 'None')}
              icon="🏆"
              color={activeTournament ? '#f59e0b' : '#6b7280'}
            />
            <StatCard
              label="Total Teams"
              value={loading ? '...' : teams.length.toString()}
              icon="👥"
              color="#2563eb"
            />
            <StatCard
              label="Matches Remaining"
              value={loading ? '...' : `${todayRemaining.length} / ${todayMatches.length}`}
              subtext={loading ? '' : `of ${todayMatches.length} today`}
              icon="⏱️"
              color="#16a34a"
            />
            <StatCard
              label="Firebase Status"
              value="Connected"
              icon="✓"
              color="#059669"
            />
          </div>
        </div>
      </main>
    </AdminLayout>
  )
}

interface ActivityItemProps {
  icon: string
  text: string
  time: string
  color: string
}

function ActivityItem({ icon, text, time, color }: ActivityItemProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      borderLeft: `3px solid ${color}`
    }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#111827',
          margin: 0
        }}>
          {text}
        </p>
      </div>
      <span style={{
        fontSize: '13px',
        color: '#6b7280'
      }}>
        {time}
      </span>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: string
  color: string
  subtext?: string
}

function StatCard({ label, value, icon, color, subtext }: StatCardProps) {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{
          fontSize: '24px',
          color: color
        }}>
          {icon}
        </span>
        <p style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#6b7280',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </p>
      </div>
      <p style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: color,
        margin: 0,
        marginBottom: subtext ? '4px' : 0
      }}>
        {value}
      </p>
      {subtext && (
        <p style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: 0
        }}>
          {subtext}
        </p>
      )}
    </div>
  )
}
