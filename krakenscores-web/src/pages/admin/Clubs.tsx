import { useState, useEffect } from 'react'
import type { Club } from '../../types'
import {
  getAllClubs,
  createClub,
  updateClub,
  deleteClub
} from '../../services/clubs'

type SortField = 'name' | 'abbreviation'
type SortDirection = 'asc' | 'desc'

export default function Clubs() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [error, setError] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    loadClubs()
  }, [])

  const loadClubs = async () => {
    try {
      setLoading(true)
      const data = await getAllClubs()
      setClubs(data)
    } catch (err) {
      console.error('Error loading clubs:', err)
      setError('Failed to load clubs')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingClub(null)
    setShowModal(true)
  }

  const handleEdit = (club: Club) => {
    setEditingClub(club)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this club? This may affect associated teams.')) return

    try {
      await deleteClub(id)
      await loadClubs()
    } catch (err) {
      console.error('Error deleting club:', err)
      alert('Failed to delete club')
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

  const sortedClubs = [...clubs].sort((a, b) => {
    let comparison = 0

    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (sortField === 'abbreviation') {
      comparison = a.abbreviation.localeCompare(b.abbreviation)
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clubs...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Clubs</h1>
            <p className="text-gray-600 mt-1">Manage participating water polo clubs</p>
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
            + Add Club
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {clubs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No clubs yet</p>
            <button
              onClick={handleCreate}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first club
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
                      Club
                      {sortField === 'name' && (
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
                {sortedClubs.map((club, index) => (
                  <tr key={club.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 12px', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {club.logoUrl && (
                          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img
                              src={club.logoUrl}
                              alt={club.name}
                              style={{ maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }}
                            />
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{club.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{club.abbreviation}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <button
                        onClick={() => handleEdit(club)}
                        style={{ color: '#4f46e5', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(club.id)}
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
        <ClubModal
          club={editingClub}
          onClose={() => setShowModal(false)}
          onSave={async () => {
            await loadClubs()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

interface ClubModalProps {
  club: Club | null
  onClose: () => void
  onSave: () => void
}

function ClubModal({ club, onClose, onSave }: ClubModalProps) {
  const [formData, setFormData] = useState({
    name: club?.name || '',
    abbreviation: club?.abbreviation || '',
    logoUrl: club?.logoUrl || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (club) {
        // Update existing club
        await updateClub(club.id, {
          name: formData.name,
          abbreviation: formData.abbreviation,
          logoUrl: formData.logoUrl // Pass empty string to delete, or URL to update
        })
      } else {
        // Create new club
        await createClub({
          name: formData.name,
          abbreviation: formData.abbreviation,
          logoUrl: formData.logoUrl || undefined
        })
      }
      onSave()
    } catch (err) {
      console.error('Error saving club:', err)
      setError('Failed to save club. Please try again.')
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
            {club ? 'Edit Club' : 'Add Club'}
          </h2>

          {error && (
            <div style={{ marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '12px' }}>
              <p style={{ color: '#991b1b', fontSize: '14px' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Club Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                placeholder="e.g., Team Orlando Water Polo Club"
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Abbreviation *
              </label>
              <input
                type="text"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                required
                maxLength={10}
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                placeholder="e.g., TOWPC or ORL"
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Used in schedules and scores (max 10 characters)</p>
            </div>

            <div style={{ marginBottom: '40px' }}>
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
                {saving ? 'Saving...' : club ? 'Update Club' : 'Create Club'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
