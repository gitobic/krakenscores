import { useState, useEffect } from 'react'
import type { Division } from '../../types'
import {
  getAllDivisions,
  createDivision,
  updateDivision,
  deleteDivision
} from '../../services/divisions'

// Predefined divisions from CLAUDE.md - these should be pre-populated in the database
const STANDARD_DIVISIONS = [
  { name: '12u CoEd', hex: '#8DD3C7' },
  { name: '13u CoEd', hex: '#F0E442' },
  { name: '14u CoEd', hex: '#FDB462' },
  { name: '15u Boys', hex: '#6A3D9A' },
  { name: '16u Boys', hex: '#80B1D3' },
  { name: '16u Girls', hex: '#CAB2D6' },
  { name: '18u Boys', hex: '#FB8072' },
  { name: '18u Girls', hex: '#B3DE69' },
  { name: 'Mens Open', hex: '#009E73' },
  { name: 'Womens Open', hex: '#EE95A8' },
]

// Available colors for custom divisions
const AVAILABLE_COLORS = [
  { hex: '#FFD700', name: '1st Place' },
  { hex: '#C0C0C0', name: '2nd Place' },
  { hex: '#CD7F32', name: '3rd Place' },
  { hex: '#E69F00', name: 'Final/Championship' },
  { hex: '#0072B2', name: 'Semi-Final' },
  { hex: '#FCCE5C', name: 'Sunflower Yellow' },
  { hex: '#C1E6E5', name: 'Light Aqua' },
  { hex: '#E6B081', name: 'Warm Beige' },
  { hex: '#B8B58D', name: 'Olive Gray' },
  { hex: '#56B4E9', name: 'Vibrant Blue' },
  { hex: '#D55E00', name: 'Burnt Orange' },
  { hex: '#CC79A7', name: 'Magenta' },
  { hex: '#33A02C', name: 'Forest Green' },
  { hex: '#E31A1C', name: 'Bold Red' },
  { hex: '#FF7F00', name: 'Bright Orange' },
  { hex: '#57A559', name: 'Mint Green' },
  { hex: '#96AAC1', name: 'Steel Blue' },
]

export default function Divisions() {
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [error, setError] = useState('')
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    loadDivisions()
  }, [])

  const loadDivisions = async () => {
    try {
      setLoading(true)
      const data = await getAllDivisions()
      setDivisions(data)
    } catch (err) {
      console.error('Error loading divisions:', err)
      setError('Failed to load divisions')
    } finally {
      setLoading(false)
    }
  }

  const initializeStandardDivisions = async () => {
    if (!confirm('This will create all standard divisions. Continue?')) return

    try {
      setInitializing(true)
      for (const div of STANDARD_DIVISIONS) {
        await createDivision({
          name: div.name,
          colorHex: div.hex
        })
      }
      await loadDivisions()
      alert('Standard divisions created successfully!')
    } catch (err) {
      console.error('Error initializing divisions:', err)
      alert('Failed to initialize divisions')
    } finally {
      setInitializing(false)
    }
  }

  const handleCreate = () => {
    setEditingDivision(null)
    setShowModal(true)
  }

  const handleEdit = (division: Division) => {
    setEditingDivision(division)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this division? This may affect associated teams and games.')) return

    try {
      await deleteDivision(id)
      await loadDivisions()
    } catch (err) {
      console.error('Error deleting division:', err)
      alert('Failed to delete division')
    }
  }

  // Helper to determine if text should be white or black based on background color
  const getTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155 ? '#000000' : '#FFFFFF'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading divisions...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Divisions</h1>
            <p className="text-gray-600 mt-1">Standard age divisions with color-blind safe colors</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {divisions.length === 0 && (
              <button
                onClick={initializeStandardDivisions}
                disabled={initializing}
                style={{
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: initializing ? '#9ca3af' : '#16a34a',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: initializing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  opacity: initializing ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!initializing) e.currentTarget.style.backgroundColor = '#15803d'
                }}
                onMouseLeave={(e) => {
                  if (!initializing) e.currentTarget.style.backgroundColor = '#16a34a'
                }}
              >
                {initializing ? 'Initializing...' : 'Initialize Standard Divisions'}
              </button>
            )}
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
              + Add Custom Division
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {divisions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No divisions yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Click "Initialize Standard Divisions" to create all standard age divisions,
              or add a custom division manually.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '16px',
            maxWidth: '900px'
          }}>
            {divisions.map((division) => (
              <div
                key={division.id}
                style={{ position: 'relative' }}
                className="group"
              >
                <div
                  style={{
                    backgroundColor: division.colorHex,
                    color: getTextColor(division.colorHex),
                    padding: '16px',
                    borderRadius: '8px',
                    border: '2px solid rgba(0,0,0,0.1)',
                    fontWeight: '600',
                    fontSize: '14px',
                    textAlign: 'center',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={() => handleEdit(division)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {division.name}
                </div>
                <button
                  onClick={() => handleDelete(division.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                  title="Delete division"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <DivisionModal
          division={editingDivision}
          onClose={() => setShowModal(false)}
          onSave={async () => {
            await loadDivisions()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

interface DivisionModalProps {
  division: Division | null
  onClose: () => void
  onSave: () => void
}

function DivisionModal({ division, onClose, onSave }: DivisionModalProps) {
  const [formData, setFormData] = useState({
    name: division?.name || '',
    colorHex: division?.colorHex || AVAILABLE_COLORS[0].hex
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (division) {
        // Update existing division
        await updateDivision(division.id, {
          name: formData.name,
          colorHex: formData.colorHex
        })
      } else {
        // Create new division
        await createDivision({
          name: formData.name,
          colorHex: formData.colorHex
        })
      }
      onSave()
    } catch (err) {
      console.error('Error saving division:', err)
      setError('Failed to save division. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Helper to determine if text should be white or black based on background color
  const getTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155 ? '#000000' : '#FFFFFF'
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
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ overflowY: 'scroll', padding: '32px', flexGrow: 1 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
            {division ? 'Edit Division' : 'Add Custom Division'}
          </h2>

          {error && (
            <div style={{ marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '12px' }}>
              <p style={{ color: '#991b1b', fontSize: '14px' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Division Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                placeholder="e.g., 10u CoEd, Masters 40+"
              />
            </div>

            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                Color *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, colorHex: color.hex })}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: formData.colorHex === color.hex ? '2px solid #2563eb' : '2px solid #d1d5db',
                      cursor: 'pointer',
                      minHeight: '60px',
                      transition: 'all 0.2s',
                      boxShadow: formData.colorHex === color.hex ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none'
                    }}
                    title={color.name}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '40px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: color.hex,
                        color: getTextColor(color.hex)
                      }}
                    >
                      {color.name}
                    </div>
                  </button>
                ))}
              </div>
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
                {saving ? 'Saving...' : division ? 'Update Division' : 'Create Division'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
