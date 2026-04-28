import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Announcement, Tournament } from '../../types/index'
import { format } from 'date-fns'
import PublicNav from '../../components/layout/PublicNav'

// Helper function to convert URLs in text to clickable links
const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g

  // Split by newlines first to preserve line breaks
  const lines = text.split('\n')

  return lines.map((line, lineIndex) => {
    const parts = line.split(urlRegex)
    const lineContent = parts.map((part, partIndex) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={`${lineIndex}-${partIndex}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#2563eb',
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {part}
          </a>
        )
      }
      return part
    })

    // Add line break between lines (except after the last line)
    return (
      <span key={lineIndex}>
        {lineContent}
        {lineIndex < lines.length - 1 && '\n'}
      </span>
    )
  })
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')

  useEffect(() => {
    loadTournaments()
  }, [])

  useEffect(() => {
    // Auto-select first published tournament
    if (tournaments.length > 0 && !selectedTournamentId) {
      const firstPublished = tournaments.find(t => t.isPublished)
      if (firstPublished) {
        setSelectedTournamentId(firstPublished.id)
      }
    }
  }, [tournaments, selectedTournamentId])

  useEffect(() => {
    if (selectedTournamentId) {
      loadAnnouncements()
    }
  }, [selectedTournamentId])

  const loadTournaments = async () => {
    try {
      // Only load published tournaments for public view
      const tournamentsSnapshot = await getDocs(
        query(collection(db, 'tournaments'), where('isPublished', '==', true))
      )
      const tournamentsData = tournamentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: (doc.data().startDate as Timestamp)?.toDate() || new Date(),
        endDate: (doc.data().endDate as Timestamp)?.toDate() || new Date(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Tournament))
      setTournaments(tournamentsData)
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnnouncements = async () => {
    if (!selectedTournamentId) return

    try {
      const q = query(
        collection(db, 'announcements'),
        where('tournamentId', '==', selectedTournamentId),
        where('isActive', '==', true)
      )
      const snapshot = await getDocs(q)

      const announcementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as Announcement))

      // Sort by priority (high -> normal -> low) then by creation date (newest first)
      const priorityOrder = { high: 0, normal: 1, low: 2 }
      announcementsData.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      setAnnouncements(announcementsData)
    } catch (error) {
      console.error('Error loading announcements:', error)
    }
  }

  const selectedTournament = useMemo(() => {
    return tournaments.find(t => t.id === selectedTournamentId)
  }, [tournaments, selectedTournamentId])

  const getPriorityStyles = (priority: 'low' | 'normal' | 'high') => {
    switch (priority) {
      case 'high':
        return {
          container: {
            borderLeft: '4px solid #dc2626',
            backgroundColor: '#fef2f2',
          },
          badge: {
            backgroundColor: '#dc2626',
            color: '#ffffff',
          },
        }
      case 'normal':
        return {
          container: {
            borderLeft: '4px solid #2563eb',
            backgroundColor: '#eff6ff',
          },
          badge: {
            backgroundColor: '#2563eb',
            color: '#ffffff',
          },
        }
      case 'low':
        return {
          container: {
            borderLeft: '4px solid #6b7280',
            backgroundColor: '#f9fafb',
          },
          badge: {
            backgroundColor: '#6b7280',
            color: '#ffffff',
          },
        }
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <PublicNav />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 16px'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <PublicNav />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 16px'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'system-ui, -apple-system, sans-serif' }}>No active tournaments</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <PublicNav />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px'
      }}>
        {/* Header with tournament logo and name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {selectedTournament?.logoUrl && (
            <img
              src={selectedTournament.logoUrl}
              alt={selectedTournament.name}
              style={{
                height: '48px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          )}
          <h1 style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Announcements
          </h1>
        </div>

        {/* Tournament selector (if multiple tournaments) */}
        {tournaments.length > 1 && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              Tournament
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#111827',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Announcements list */}
        {announcements.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 16px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              No announcements at this time
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {announcements.map(announcement => {
              const styles = getPriorityStyles(announcement.priority)
              return (
                <div
                  key={announcement.id}
                  style={{
                    ...styles.container,
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: styles.container.backgroundColor,
                  }}
                >
                  {/* Header: title and priority badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                      {announcement.title}
                    </h3>
                    <span style={{
                      ...styles.badge,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                      {announcement.priority}
                    </span>
                  </div>

                  {/* Message */}
                  <p style={{
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.6',
                    marginBottom: '12px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {linkifyText(announcement.message)}
                  </p>

                  {/* Timestamp */}
                  <p style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: 0,
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {format(announcement.createdAt, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
