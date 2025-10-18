import { useState, useEffect } from 'react'
import type { Pool } from '../../types/index'
import { getAllPools, createPool, updatePool, deletePool } from '../../services/pools'

type SortField = 'name' | 'location' | 'startTime'
type SortDirection = 'asc' | 'desc'

export default function Pools() {
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPool, setEditingPool] = useState<Pool | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const poolsData = await getAllPools()
      setPools(poolsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPool(null)
    setShowModal(true)
  }

  const handleEdit = (pool: Pool) => {
    setEditingPool(pool)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pool? This will affect all games scheduled in this pool.')) {
      return
    }

    try {
      await deletePool(id)
      await loadData()
    } catch (error) {
      console.error('Error deleting pool:', error)
      alert('Failed to delete pool. Please try again.')
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

  const sortedPools = [...pools].sort((a, b) => {
    let comparison = 0

    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (sortField === 'location') {
      comparison = a.location.localeCompare(b.location)
    } else if (sortField === 'startTime') {
      comparison = (a.defaultStartTime || '').localeCompare(b.defaultStartTime || '')
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pools...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Pools</h1>
            <p className="text-gray-600 mt-1">Manage physical locations where games are played</p>
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
            + Add Pool
          </button>
        </div>

        {/* Pools Table */}
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
                    Pool Name
                    {sortField === 'name' && (
                      <span style={{ fontSize: '10px' }}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  <button
                    onClick={() => handleSort('location')}
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
                    Location
                    {sortField === 'location' && (
                      <span style={{ fontSize: '10px' }}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  <button
                    onClick={() => handleSort('startTime')}
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
                    Default Start Time
                    {sortField === 'startTime' && (
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
              {sortedPools.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '14px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                    No pools found. Click "Add Pool" to create one.
                  </td>
                </tr>
              ) : (
                sortedPools.map((pool, index) => (
                  <tr key={pool.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {pool.name}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {pool.location}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {pool.defaultStartTime}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <button
                        onClick={() => handleEdit(pool)}
                        style={{ color: '#4f46e5', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pool.id)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <PoolModal
          pool={editingPool}
          onClose={() => setShowModal(false)}
          onSave={loadData}
        />
      )}
    </div>
  )
}

interface PoolModalProps {
  pool: Pool | null
  onClose: () => void
  onSave: () => void
}

function PoolModal({ pool, onClose, onSave }: PoolModalProps) {
  const [formData, setFormData] = useState({
    name: pool?.name || '',
    location: pool?.location || '',
    defaultStartTime: pool?.defaultStartTime || '08:00',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (pool) {
        await updatePool(pool.id, {
          name: formData.name,
          location: formData.location,
          defaultStartTime: formData.defaultStartTime
        })
      } else {
        await createPool({
          name: formData.name,
          location: formData.location,
          defaultStartTime: formData.defaultStartTime
        })
      }
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving pool:', error)
      alert('Failed to save pool. Please try again.')
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
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '24px'
          }}>
            {pool ? 'Edit Pool' : 'Add New Pool'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Pool Name */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Pool Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Pool A, Championship Pool"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Location */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Physical Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Pool 1 - North End, Main Competition Pool"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Default Start Time */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Default Start Time *
              </label>
              <input
                type="time"
                required
                value={formData.defaultStartTime}
                onChange={(e) => setFormData({ ...formData, defaultStartTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
              <p style={{
                fontSize: '13px',
                color: '#6b7280',
                marginTop: '6px'
              }}>
                Default starting time for games in this pool (can be adjusted per game)
              </p>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px'
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: saving ? '#9ca3af' : '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: saving ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!saving) e.currentTarget.style.backgroundColor = '#1d4ed8'
                }}
                onMouseLeave={(e) => {
                  if (!saving) e.currentTarget.style.backgroundColor = '#2563eb'
                }}
              >
                {saving ? 'Saving...' : pool ? 'Update Pool' : 'Create Pool'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
