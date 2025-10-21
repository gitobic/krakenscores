import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function PublicNav() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { path: '/schedule', label: 'Schedule', icon: '📅' },
    { path: '/standings', label: 'Standings', icon: '🏆' },
    { path: '/team-schedule', label: 'Team Schedule', icon: '📱' }
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
            backgroundColor: 'white',
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
                color: '#111827',
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
                      backgroundColor: isActive ? '#eff6ff' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent',
                      color: isActive ? '#2563eb' : '#374151',
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

            {/* Menu Footer */}
            <div style={{
              padding: '20px',
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
