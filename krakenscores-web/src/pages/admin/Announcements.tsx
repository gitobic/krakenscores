import { useState, useEffect, useMemo } from 'react'
import type { Announcement, Tournament } from '../../types/index'
import {
  getAnnouncementsByTournament,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../../services/announcements'
import { getAllTournaments } from '../../services/tournaments'
import { format } from 'date-fns'

type SortField = 'createdAt' | 'status' | 'priority' | 'title' | 'message'
type SortDirection = 'asc' | 'desc'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Auto-select first tournament when tournaments load
    if (tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0].id)
    }
  }, [tournaments, selectedTournamentId])

  useEffect(() => {
    if (selectedTournamentId) {
      loadAnnouncements()
    }
  }, [selectedTournamentId])

  const loadData = async () => {
    try {
      const tournamentsData = await getAllTournaments()
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
      const announcementsData = await getAnnouncementsByTournament(selectedTournamentId)
      setAnnouncements(announcementsData)
    } catch (error) {
      console.error('Error loading announcements:', error)
    }
  }

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      message: '',
      priority: 'normal',
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      isActive: announcement.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      await deleteAnnouncement(id)
      await loadAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('Failed to delete announcement. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTournamentId) {
      alert('Please select a tournament')
      return
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, formData)
      } else {
        await createAnnouncement({
          ...formData,
          tournamentId: selectedTournamentId
        })
      }
      setShowModal(false)
      await loadAnnouncements()
    } catch (error) {
      console.error('Error saving announcement:', error)
      alert('Failed to save announcement. Please try again.')
    }
  }

  const getTournamentName = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId)
    return tournament?.name || 'Unknown'
  }

  const getPriorityBadgeStyle = (priority: 'low' | 'normal' | 'high') => {
    switch (priority) {
      case 'high':
        return { backgroundColor: '#dc2626', color: '#ffffff' }
      case 'normal':
        return { backgroundColor: '#2563eb', color: '#ffffff' }
      case 'low':
        return { backgroundColor: '#6b7280', color: '#ffffff' }
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedAnnouncements = useMemo(() => {
    const sorted = [...announcements]
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'status':
          aValue = a.isActive ? 'active' : 'inactive'
          bValue = b.isActive ? 'active' : 'inactive'
          break
        case 'priority':
          const priorityOrder = { high: 0, normal: 1, low: 2 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'message':
          aValue = a.message.toLowerCase()
          bValue = b.message.toLowerCase()
          break
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [announcements, sortField, sortDirection])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-6">
          <a
            href="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            ← Back to Dashboard
          </a>
        </nav>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-600 mt-1">Manage tournament announcements and updates</p>
          </div>
          <button
            onClick={handleCreate}
            style={{
              padding: '10px 20px',
              fontSize: '15px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            + Add Announcement
          </button>
        </div>

        {/* Tournament Filter */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Tournament
          </label>
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a tournament</option>
            {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>

        {/* Announcements Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {sortedAnnouncements.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 16px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                No announcements found for this tournament.
              </p>
              <p style={{
                fontSize: '13px',
                color: '#9ca3af',
                marginTop: '8px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Click "+ Add Announcement" to create one.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th
                      onClick={() => handleSort('createdAt')}
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('priority')}
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('title')}
                      style={{
                        padding: '8px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('message')}
                      style={{
                        padding: '8px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Message {sortField === 'message' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAnnouncements.map((announcement, index) => (
                    <tr
                      key={announcement.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                      }}
                    >
                      {/* Created */}
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap'
                      }}>
                        {format(announcement.createdAt, 'MMM d, yyyy h:mm a')}
                      </td>

                      {/* Status */}
                      <td style={{
                        padding: '8px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: announcement.isActive ? '#dcfce7' : '#f3f4f6',
                          color: announcement.isActive ? '#166534' : '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {announcement.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td style={{
                        padding: '8px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          ...getPriorityBadgeStyle(announcement.priority),
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {announcement.priority}
                        </span>
                      </td>

                      {/* Title (word wrap) */}
                      <td style={{
                        padding: '8px',
                        fontSize: '13px',
                        color: '#111827',
                        fontWeight: '500',
                        wordWrap: 'break-word',
                        whiteSpace: 'normal',
                        maxWidth: '200px'
                      }}>
                        {announcement.title}
                      </td>

                      {/* Message (word wrap) */}
                      <td style={{
                        padding: '8px',
                        fontSize: '13px',
                        color: '#6b7280',
                        wordWrap: 'break-word',
                        whiteSpace: 'normal',
                        maxWidth: '300px'
                      }}>
                        {announcement.message}
                      </td>

                      {/* Actions */}
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>
                        <button
                          onClick={() => handleEdit(announcement)}
                          style={{
                            marginRight: '8px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#2563eb',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#dc2626',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '672px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </h2>
            </div>

            {/* Modal Content (Scrollable) */}
            <form onSubmit={handleSubmit} style={{
              overflowY: 'scroll',
              flexGrow: 1,
              padding: '24px'
            }}>
              {/* Tournament (read-only if editing) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Tournament
                </label>
                <input
                  type="text"
                  value={getTournamentName(selectedTournamentId)}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </div>

              {/* Title */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Game Delay - Pool 2"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  placeholder="Enter announcement details..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Priority */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'normal' | 'high' })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <option value="low">Low (Gray)</option>
                  <option value="normal">Normal (Blue)</option>
                  <option value="high">High (Red)</option>
                </select>
              </div>

              {/* Active Status */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Active (visible to public)
                  </span>
                </label>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flex: 1
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flex: 1
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  {editingAnnouncement ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
