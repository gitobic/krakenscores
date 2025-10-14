import { useState, useEffect } from 'react'
import type { Team, Club, Division, Tournament } from '../../types'
import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam
} from '../../services/teams'
import { getAllClubs } from '../../services/clubs'
import { getAllDivisions } from '../../services/divisions'
import { getAllTournaments } from '../../services/tournaments'

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [error, setError] = useState('')
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [teamsData, clubsData, divisionsData, tournamentsData] = await Promise.all([
        getAllTeams(),
        getAllClubs(),
        getAllDivisions(),
        getAllTournaments()
      ])
      setTeams(teamsData)
      setClubs(clubsData)
      setDivisions(divisionsData)
      setTournaments(tournamentsData)

      // Auto-select the first tournament if none selected
      if (!selectedTournamentId && tournamentsData.length > 0) {
        setSelectedTournamentId(tournamentsData[0].id)
      }
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

  const getTournamentName = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId)
    return tournament?.name || 'Unknown Tournament'
  }

  // Filter teams by selected tournament
  const filteredTeams = selectedTournamentId
    ? teams.filter(team => team.tournamentId === selectedTournamentId)
    : teams

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

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600 mt-1">Manage tournament teams by club and division</p>
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

          {/* Tournament Filter */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tournament (filters table and sets default for new teams)
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Tournaments</option>
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {filteredTeams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {selectedTournamentId ? 'No teams for this tournament yet' : 'No teams yet'}
            </p>
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
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb' }}>
                    Team
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb' }}>
                    Club
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb' }}>
                    Division
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb' }}>
                    Tournament
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb' }}>
                    Seed
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team, index) => (
                  <tr key={team.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', borderRight: '1px solid #e5e7eb' }}>
                      {team.name}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb' }}>
                      {getClubName(team.clubId)}
                    </td>
                    <td style={{ padding: '8px 12px', borderRight: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{ width: '16px', height: '16px', borderRadius: '2px', border: '1px solid #d1d5db', backgroundColor: getDivisionColor(team.divisionId) }}
                        />
                        <span style={{ fontSize: '14px' }}>{getDivisionName(team.divisionId)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb' }}>
                      {getTournamentName(team.tournamentId)}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                      {team.seedRank || '-'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleEdit(team)}
                        style={{ color: '#4f46e5', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(team.id)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
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
          tournaments={tournaments}
          defaultTournamentId={selectedTournamentId}
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
  tournaments: Tournament[]
  defaultTournamentId: string
  onClose: () => void
  onSave: () => void
}

function TeamModal({ team, clubs, divisions, tournaments, defaultTournamentId, onClose, onSave }: TeamModalProps) {
  const [formData, setFormData] = useState({
    tournamentId: team?.tournamentId || defaultTournamentId,
    clubId: team?.clubId || '',
    divisionId: team?.divisionId || '',
    name: team?.name || '',
    seedRank: team?.seedRank || undefined
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // All divisions are now global, no filtering needed
  const availableDivisions = formData.tournamentId ? divisions : []

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
          tournamentId: formData.tournamentId,
          clubId: formData.clubId,
          divisionId: formData.divisionId,
          name: formData.name,
          seedRank: formData.seedRank
        })
      } else {
        // Create new team
        await createTeam({
          tournamentId: formData.tournamentId,
          clubId: formData.clubId,
          divisionId: formData.divisionId,
          name: formData.name,
          seedRank: formData.seedRank
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
          {/* Tournament Selection */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Tournament *
            </label>
            <select
              value={formData.tournamentId}
              onChange={(e) => setFormData({
                ...formData,
                tournamentId: e.target.value,
                divisionId: '' // Reset division when tournament changes
              })}
              required
              style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            >
              <option value="">Select a tournament</option>
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>

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
                disabled={!formData.tournamentId}
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: !formData.tournamentId ? '#f3f4f6' : 'white' }}
              >
                <option value="">
                  {formData.tournamentId ? 'Select a division' : 'Select tournament first'}
                </option>
                {availableDivisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Team Name and Seed Rank */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '40px' }}>
            <div>
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
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Seed Rank
              </label>
              <input
                type="number"
                value={formData.seedRank || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  seedRank: e.target.value ? parseInt(e.target.value) : undefined
                })}
                min="1"
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                placeholder="Optional"
              />
            </div>
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
