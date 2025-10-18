import { useState, useEffect } from 'react'
import type { Tournament } from '../../types'
import {
  getAllTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  toggleTournamentPublish
} from '../../services/tournaments'
import { format } from 'date-fns'

type SortField = 'name' | 'startDate' | 'status'
type SortDirection = 'asc' | 'desc'

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [error, setError] = useState('')
  const [sortField, setSortField] = useState<SortField>('startDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      const data = await getAllTournaments()
      setTournaments(data)
    } catch (err) {
      console.error('Error loading tournaments:', err)
      setError('Failed to load tournaments')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTournament(null)
    setShowModal(true)
  }

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return

    try {
      await deleteTournament(id)
      await loadTournaments()
    } catch (err) {
      console.error('Error deleting tournament:', err)
      alert('Failed to delete tournament')
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await toggleTournamentPublish(id, !currentStatus)
      await loadTournaments()
    } catch (err) {
      console.error('Error toggling publish status:', err)
      alert('Failed to update publish status')
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTournaments = [...tournaments].sort((a, b) => {
    let comparison = 0

    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (sortField === 'startDate') {
      comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    } else if (sortField === 'status') {
      // Sort by published status (published first when ascending)
      comparison = (b.isPublished ? 1 : 0) - (a.isPublished ? 1 : 0)
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournaments...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
            <p className="text-gray-600 mt-1">Manage tournament information and settings</p>
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
            + Create Tournament
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No tournaments yet</p>
            <button
              onClick={handleCreate}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first tournament
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                    <button
                      onClick={() => handleSort('name')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'inherit',
                        fontFamily: 'inherit'
                      }}
                    >
                      Tournament
                      {sortField === 'name' && (
                        <span style={{ fontSize: '10px' }}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                    <button
                      onClick={() => handleSort('startDate')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'inherit',
                        fontFamily: 'inherit'
                      }}
                    >
                      Dates
                      {sortField === 'startDate' && (
                        <span style={{ fontSize: '10px' }}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                    <button
                      onClick={() => handleSort('status')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'inherit',
                        fontFamily: 'inherit',
                        margin: '0 auto'
                      }}
                    >
                      Status
                      {sortField === 'status' && (
                        <span style={{ fontSize: '10px' }}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTournaments.map((tournament, index) => (
                  <tr key={tournament.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 12px', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {tournament.logoUrl && (
                          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img
                              src={tournament.logoUrl}
                              alt={tournament.name}
                              style={{ maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }}
                            />
                          </div>
                        )}
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{tournament.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {format(tournament.startDate, 'MMM d, yyyy')} - {format(tournament.endDate, 'MMM d, yyyy')}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <span style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '12px',
                        backgroundColor: tournament.isPublished ? '#dcfce7' : '#f3f4f6',
                        color: tournament.isPublished ? '#166534' : '#4b5563'
                      }}>
                        {tournament.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <button
                        onClick={() => handleTogglePublish(tournament.id, tournament.isPublished)}
                        style={{ color: '#2563eb', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                      >
                        {tournament.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleEdit(tournament)}
                        style={{ color: '#4f46e5', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tournament.id)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
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

      {showModal && (
        <TournamentModal
          tournament={editingTournament}
          onClose={() => setShowModal(false)}
          onSave={async () => {
            await loadTournaments()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

interface TournamentModalProps {
  tournament: Tournament | null
  onClose: () => void
  onSave: () => void
}

function TournamentModal({ tournament, onClose, onSave }: TournamentModalProps) {
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    startDate: tournament?.startDate
      ? format(tournament.startDate, 'yyyy-MM-dd')
      : '',
    endDate: tournament?.endDate ? format(tournament.endDate, 'yyyy-MM-dd') : '',
    logoUrl: tournament?.logoUrl || '',
    defaultMatchDuration: tournament?.defaultMatchDuration || 55,
    isPublished: tournament?.isPublished || false
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Parse dates as local dates (not UTC) to avoid timezone shifts
      // Input format: "2026-01-02" -> parse as Jan 2, 2026 in local timezone
      const parseLocalDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number)
        return new Date(year, month - 1, day) // month is 0-indexed
      }

      if (tournament) {
        // Update existing tournament
        await updateTournament(tournament.id, {
          name: formData.name,
          startDate: parseLocalDate(formData.startDate),
          endDate: parseLocalDate(formData.endDate),
          logoUrl: formData.logoUrl, // Pass empty string to delete, or URL to update
          defaultMatchDuration: formData.defaultMatchDuration,
          isPublished: formData.isPublished
        })
      } else {
        // Create new tournament
        await createTournament({
          name: formData.name,
          startDate: parseLocalDate(formData.startDate),
          endDate: parseLocalDate(formData.endDate),
          logoUrl: formData.logoUrl || undefined,
          defaultMatchDuration: formData.defaultMatchDuration,
          isPublished: formData.isPublished
        })
      }
      onSave()
    } catch (err) {
      console.error('Error saving tournament:', err)
      setError('Failed to save tournament. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '672px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ overflowY: 'scroll', padding: '32px', flexGrow: 1 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
            {tournament ? 'Edit Tournament' : 'Create Tournament'}
          </h2>

          {error && (
            <div style={{ marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '12px' }}>
              <p style={{ color: '#991b1b', fontSize: '14px' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Tournament Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              placeholder="e.g., 2025 NOID Tournament"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Logo URL (optional)
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Default Match Duration (minutes) *
            </label>
            <input
              type="number"
              required
              min="10"
              max="120"
              value={formData.defaultMatchDuration}
              onChange={(e) => setFormData({ ...formData, defaultMatchDuration: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              placeholder="55"
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              This will be the default duration for all matches in this tournament (typically 55 or 60 minutes)
            </p>
          </div>

          <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="isPublished" style={{ marginLeft: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
              Publish tournament (make visible to public)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '16px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 24px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px 24px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: '500',
                cursor: 'pointer',
                opacity: saving ? 0.5 : 1
              }}
              disabled={saving}
            >
              {saving ? 'Saving...' : tournament ? 'Update Tournament' : 'Create Tournament'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}
