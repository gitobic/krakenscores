import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface NavItem {
  path: string
  label: string
  icon: string
}

interface NavSection {
  title: string
  icon: string
  items: NavItem[]
}

interface NavMenuItemProps {
  item: NavItem
  isActive: boolean
  onClick: () => void
}

function NavMenuItem({ item, isActive, onClick }: NavMenuItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 16px 10px 36px',
        backgroundColor: isActive ? '#eff6ff' : (isHovered ? '#ffffff' : 'transparent'),
        border: 'none',
        borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
        color: isActive ? '#2563eb' : '#374151',
        fontSize: '14px',
        fontWeight: isActive ? '600' : '500',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s'
      }}
    >
      <span style={{ fontSize: '16px' }}>{item.icon}</span>
      <span>{item.label}</span>
    </button>
  )
}

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, signOut } = useAuth()

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    setup: true,
    live: true,
    public: false
  })

  const sections: NavSection[] = [
    {
      title: 'Setup',
      icon: '🏆',
      items: [
        { path: '/admin/tournaments', label: 'Tournaments', icon: '🏆' },
        { path: '/admin/clubs', label: 'Clubs', icon: '🏊' },
        { path: '/admin/divisions', label: 'Divisions', icon: '📊' },
        { path: '/admin/teams', label: 'Teams', icon: '👥' },
        { path: '/admin/pools', label: 'Pools', icon: '🏊‍♂️' },
        { path: '/admin/matches', label: 'Matches', icon: '⏱️' },
        { path: '/admin/schedule-breaks', label: 'Breaks', icon: '☕' }
      ]
    },
    {
      title: 'Live',
      icon: '🎯',
      items: [
        { path: '/admin/scorekeeper', label: 'Scorekeeper', icon: '🎯' },
        { path: '/admin/standings', label: 'Standings', icon: '📈' },
        { path: '/admin/announcements', label: 'Announcements', icon: '📢' }
      ]
    },
    {
      title: 'Public',
      icon: '📊',
      items: [
        { path: '/schedule', label: 'Schedule', icon: '📅' },
        { path: '/standings', label: 'Standings', icon: '🏆' },
        { path: '/brackets', label: 'Brackets', icon: '🏅' },
        { path: '/team-schedule', label: 'Team Schedule', icon: '📱' },
        { path: '/announcements', label: 'Announcements', icon: '📢' }
      ]
    }
  ]

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  const handleNavigate = (path: string) => {
    // Public pages open in new tab
    if (path.startsWith('/schedule') || path.startsWith('/standings') ||
        path.startsWith('/team-schedule') || path === '/announcements' ||
        path === '/brackets') {
      window.open(path, '_blank')
    } else {
      navigate(path)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div style={{
      width: '220px',
      height: '100vh',
      backgroundColor: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            padding: 0
          }}
        >
          <h1 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#2563eb',
            margin: 0,
            marginBottom: '2px'
          }}>
            KrakenScores
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: 0
          }}>
            Admin Portal
          </p>
        </button>
      </div>

      {/* Navigation Sections */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0'
      }}>
        {sections.map((section) => {
          const sectionKey = section.title.toLowerCase()
          const isExpanded = expandedSections[sectionKey]

          return (
            <div key={section.title} style={{
              marginBottom: '4px'
            }}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(sectionKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#111827',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{section.icon}</span>
                  <span>{section.title}</span>
                </div>
                <span style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                }}>
                  ▶
                </span>
              </button>

              {/* Section Items */}
              {isExpanded && (
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderTop: '1px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {section.items.map(item => (
                    <NavMenuItem
                      key={item.path}
                      item={item}
                      isActive={location.pathname === item.path}
                      onClick={() => handleNavigate(item.path)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer - User Info & Sign Out */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          marginBottom: '12px'
        }}>
          <p style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            marginBottom: '2px'
          }}>
            Admin User
          </p>
          <p style={{
            fontSize: '11px',
            color: '#6b7280',
            margin: 0
          }}>
            {admin?.role || 'super_admin'}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#dc2626',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2'
            e.currentTarget.style.borderColor = '#dc2626'
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
  )
}
