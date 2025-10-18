import { useState, useEffect } from 'react'
import type { Team, Club, Division } from '../../types'
import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam
} from '../../services/teams'
import { getAllClubs } from '../../services/clubs'
import { getAllDivisions } from '../../services/divisions'

type SortField = 'name' | 'club' | 'division'
type SortDirection = 'asc' | 'desc'

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [error, setError] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [teamsData, clubsData, divisionsData] = await Promise.all([
        getAllTeams(),
        getAllClubs(),
        getAllDivisions()
      ])
      setTeams(teamsData)
      setClubs(clubsData)
      setDivisions(divisionsData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTeam(null)
    setShowModal(true)
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team? This may affect associated games.')) return

    try {
      await deleteTeam(id)
      await loadData()
    } catch (err) {
      console.error('Error deleting team:', err)
      alert('Failed to delete team')
    }
  }

  const getClubName = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId)
    return club?.name || 'Unknown Club'
  }

  const getDivisionName = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId)
    return division?.name || 'Unknown Division'
  }

  const getDivisionColor = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId)
    return division?.colorHex || '#cccccc'
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sort all teams
  const sortedTeams = [...teams].sort((a, b) => {
    let comparison = 0

    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (sortField === 'club') {
      comparison = getClubName(a.clubId).localeCompare(getClubName(b.clubId))
    } else if (sortField === 'division') {
      comparison = getDivisionName(a.divisionId).localeCompare(getDivisionName(b.divisionId))
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-600 mt-1">Manage teams by club and division</p>
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
            + Add Team
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {sortedTeams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No teams yet</p>
            <button
              onClick={handleCreate}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first team
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
                      Team
                      {sortField === 'name' && (
                        <span style={{ fontSize: '10px' }}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                    <button
                      onClick={() => handleSort('club')}
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
                      {sortField === 'club' && (
                        <span style={{ fontSize: '10px' }}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                    <button
                      onClick={() => handleSort('division')}
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
                      Division
                      {sortField === 'division' && (
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
                {sortedTeams.map((team, index) => (
                  <tr key={team.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {team.name}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {getClubName(team.clubId)}
                    </td>
                    <td style={{ padding: '8px 12px', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{ width: '16px', height: '16px', borderRadius: '2px', border: '1px solid #d1d5db', backgroundColor: getDivisionColor(team.divisionId) }}
                        />
                        <span style={{ fontSize: '14px' }}>{getDivisionName(team.divisionId)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <button
                        onClick={() => handleEdit(team)}
                        style={{ color: '#4f46e5', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(team.id)}
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
        <TeamModal
          team={editingTeam}
          clubs={clubs}
          divisions={divisions}
          onClose={() => setShowModal(false)}
          onSave={async () => {
            await loadData()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

interface TeamModalProps {
  team: Team | null
  clubs: Club[]
  divisions: Division[]
  onClose: () => void
  onSave: () => void
}

function TeamModal({ team, clubs, divisions, onClose, onSave }: TeamModalProps) {
  const [formData, setFormData] = useState({
    clubId: team?.clubId || '',
    divisionId: team?.divisionId || '',
    name: team?.name || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Auto-generate team name when division or club changes (only for new teams)
  useEffect(() => {
    if (!team && formData.divisionId && formData.clubId) {
      const division = divisions.find(d => d.id === formData.divisionId)
      const club = clubs.find(c => c.id === formData.clubId)

      if (division && club) {
        const autoName = `${division.name} ${club.name}`
        setFormData(prev => ({ ...prev, name: autoName }))
      }
    }
  }, [formData.divisionId, formData.clubId, team, divisions, clubs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (team) {
        // Update existing team
        await updateTeam(team.id, {
          clubId: formData.clubId,
          divisionId: formData.divisionId,
          name: formData.name
        })
      } else {
        // Create new team
        await createTeam({
          clubId: formData.clubId,
          divisionId: formData.divisionId,
          name: formData.name
        })
      }
      onSave()
    } catch (err) {
      console.error('Error saving team:', err)
      setError('Failed to save team. Please try again.')
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
        {/* Scrollable Form Content with header inside */}
        <div style={{ overflowY: 'scroll', padding: '32px', flexGrow: 1 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
            {team ? 'Edit Team' : 'Add Team'}
          </h2>

          {error && (
            <div style={{ marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '12px' }}>
              <p style={{ color: '#991b1b', fontSize: '14px' }}>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
          {/* Two-column layout for Club and Division */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Club *
              </label>
              <select
                value={formData.clubId}
                onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                <option value="">Select a club</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Division *
              </label>
              <select
                value={formData.divisionId}
                onChange={(e) => setFormData({ ...formData, divisionId: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                <option value="">Select a division</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Team Name */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Team Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              placeholder="e.g., Orlando Black, Tampa Blue"
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
              Team name will auto-fill based on division and club selection
            </p>
          </div>

          {/* Buttons inside form */}
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
              {saving ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}
