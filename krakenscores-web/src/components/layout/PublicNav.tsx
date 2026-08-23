import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme, type ThemePreference } from '../../contexts/ThemeContext'

export default function PublicNav() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { preference, resolvedTheme, setPreference } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const nextTheme: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' }

  const menuItems = [
    { path: '/', label: 'Tournament Home', icon: '🌊' },
    { path: '/schedule', label: 'Schedule', icon: '📅' },
    { path: '/standings', label: 'Standings', icon: '🏆' },
    { path: '/brackets', label: 'Brackets', icon: '🏅' },
    { path: '/team-schedule', label: 'Team Schedule', icon: '📱' },
    { path: '/announcements', label: 'Announcements', icon: '📢' }
  ]

  const handleNavigate = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  return (
    <>
      {/* Hamburger Button - Top Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 10001,
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #2563eb',
          borderRadius: '8px',
          padding: '10px 12px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '44px',
          height: '44px',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.2s ease'
        }}
        aria-label="Menu"
      >
        {/* Hamburger Icon */}
        <div style={{
          width: '20px',
          height: '2px',
          backgroundColor: '#2563eb',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(45deg) translateY(7px)' : 'none'
        }} />
        <div style={{
          width: '20px',
          height: '2px',
          backgroundColor: '#2563eb',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          opacity: isOpen ? 0 : 1
        }} />
        <div style={{
          width: '20px',
          height: '2px',
          backgroundColor: '#2563eb',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(-45deg) translateY(-7px)' : 'none'
        }} />
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              animation: 'fadeIn 0.2s ease'
            }}
          />

          {/* Menu Panel - Slides in from right */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '280px',
            maxWidth: '80vw',
            backgroundColor: isDark ? '#0f172a' : 'white',
            zIndex: 10000,
            boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
            padding: '80px 0 20px 0',
            animation: 'slideInRight 0.3s ease',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Menu Header */}
            <div style={{
              padding: '0 20px 20px 20px',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: isDark ? '#f8fafc' : '#111827',
                margin: 0
              }}>
                Navigation
              </h2>
            </div>

            {/* Menu Items */}
            <nav style={{
              flex: 1,
              padding: '8px 0'
            }}>
              {menuItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '16px 20px',
                      backgroundColor: isActive ? (isDark ? '#172554' : '#eff6ff') : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent',
                      color: isActive ? (isDark ? '#7dd3fc' : '#2563eb') : (isDark ? '#e2e8f0' : '#374151'),
                      fontSize: '16px',
                      fontWeight: isActive ? '600' : '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            <div style={{ padding: '12px 20px', borderTop: `1px solid ${isDark ? '#334155' : '#e5e7eb'}` }}>
              <button type="button" onClick={() => setPreference(nextTheme[preference])} style={{ width: '100%', border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, borderRadius: '8px', padding: '10px 12px', background: isDark ? '#1e293b' : '#f8fafc', color: isDark ? '#f8fafc' : '#1e293b', cursor: 'pointer', fontWeight: 700 }}>
                Theme: {preference === 'system' ? 'Auto' : preference === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>

            {/* Feedback Link */}
            <div style={{ padding: '8px 0', borderTop: '1px solid #e5e7eb' }}>
              <a
                href="https://forms.gle/GEmtM5MtaXmDqwjh7"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '16px 20px',
                  backgroundColor: 'transparent',
                  color: '#7c3aed',
                  fontSize: '16px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f3ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ fontSize: '20px' }}>📝</span>
                <span>Give Feedback</span>
              </a>
            </div>

            {/* Menu Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: 0
              }}>
                KrakenScores
              </p>
            </div>
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
          `}</style>
        </>
      )}
    </>
  )
}
