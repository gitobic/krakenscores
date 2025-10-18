import { useState, useEffect } from 'react'
import type { Match, Tournament, Pool, Division, Team, ScheduleBreak } from '../../types/index'
import { getAllMatches, createMatch, updateMatch, deleteMatch } from '../../services/matches'
import { getAllTournaments } from '../../services/tournaments'
import { getAllPools } from '../../services/pools'
import { getAllDivisions } from '../../services/divisions'
import { getAllTeams } from '../../services/teams'
import { getAllScheduleBreaks, checkScheduleBreakConflict } from '../../services/scheduleBreaks'

type SortField = 'matchNumber' | 'time' | 'pool' | 'division' | 'status'
type SortDirection = 'asc' | 'desc'

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [scheduleBreaks, setScheduleBreaks] = useState<ScheduleBreak[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('matchNumber')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Auto-select first tournament when tournaments load
    if (tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0].id)
    }
  }, [tournaments, selectedTournamentId])

  const loadData = async () => {
    try {
      const [matchesData, tournamentsData, poolsData, divisionsData, teamsData, breaksData] = await Promise.all([
        getAllMatches(),
        getAllTournaments(),
        getAllPools(),
        getAllDivisions(),
        getAllTeams(),
        getAllScheduleBreaks()
      ])
      setMatches(matchesData)
      setTournaments(tournamentsData)
      setPools(poolsData)
      setDivisions(divisionsData)
      setTeams(teamsData)
      setScheduleBreaks(breaksData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMatch(null)
    setShowModal(true)
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match?')) {
      return
    }

    try {
      await deleteMatch(id)
      await loadData()
    } catch (error) {
      console.error('Error deleting match:', error)
      alert('Failed to delete match. Please try again.')
    }
  }

  const handleExportTemplate = () => {
    if (!selectedTournamentId) {
      alert('Please select a tournament first')
      return
    }

    // Get tournament info
    const tournament = tournaments.find(t => t.id === selectedTournamentId)
    if (!tournament) return

    // Build CSV content with all teams organized by division
    let csvContent = '# Tournament: ' + tournament.name + '\n'
    csvContent += '# Format: Match#\tPool\tDivision\tTime\tDark Team\tLight Team\n'
    csvContent += '# Time format: Use 24-hour (16:00) or 12-hour with AM/PM (4:00 PM)\n'
    csvContent += '# Teams: Use full team names exactly as shown below\n'
    csvContent += '# \n'
    csvContent += '# Available Pools:\n'

    // Add available pools first
    const tournamentPools = pools.filter(p => p.tournamentId === selectedTournamentId)
    tournamentPools.forEach(pool => {
      csvContent += `#   ${pool.name} - ${pool.location}\n`
    })

    csvContent += '# \n'
    csvContent += '# Available Teams by Division:\n'

    // Group teams by division
    const tournamentTeams = teams.filter(t => t.tournamentId === selectedTournamentId)
    const teamsByDivision = divisions.reduce((acc, division) => {
      const divTeams = tournamentTeams.filter(t => t.divisionId === division.id)
      if (divTeams.length > 0) {
        acc[division.name] = divTeams.map(t => t.name)
      }
      return acc
    }, {} as Record<string, string[]>)

    // Add team names to CSV as comments
    Object.entries(teamsByDivision).forEach(([divName, teamNames]) => {
      csvContent += `#   ${divName}: ${teamNames.join(', ')}\n`
    })

    csvContent += '# \n'
    csvContent += '# Example rows:\n'
    csvContent += '# 1\t1\t18u Boys\t08:00\tOrlando Black\tTampa Blue\n'
    csvContent += '# 2\t1\t18u Boys\t08:55\tSeminole Gold\tPatriots White\n'
    csvContent += '# 3\t2\t16u Girls\t08:00\tTeam Orlando\tSJ Cariba\n'
    csvContent += '# \n'
    csvContent += 'Match#\tPool\tDivision\tTime\tDark Team\tLight Team\n'

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/tab-separated-values' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tournament.name.replace(/\s+/g, '_')}_import_template.tsv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Clubs state and loading (needed for helper functions)
  const [clubs, setClubs] = useState<import('../../types').Club[]>([])

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const { getAllClubs } = await import('../../services/clubs')
        const clubsData = await getAllClubs()
        setClubs(clubsData)
      } catch (error) {
        console.error('Error loading clubs:', error)
      }
    }
    loadClubs()
  }, [])

  // Helper functions to get names and details
  const getPoolName = (poolId: string) => {
    const pool = pools.find(p => p.id === poolId)
    return pool?.name || 'Unknown'
  }

  const getDivisionName = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId)
    return division?.name || 'Unknown'
  }

  const getDivisionColor = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId)
    return division?.colorHex || '#cccccc'
  }

  const getTeamAbbreviation = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return 'Unknown'

    const club = clubs.find(c => c.id === team.clubId)
    return club?.abbreviation || team.name
  }

  // Filter and sort matches
  const filteredMatches = selectedTournamentId
    ? matches.filter(match => match.tournamentId === selectedTournamentId)
    : matches

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    let comparison = 0

    if (sortField === 'matchNumber') {
      comparison = a.matchNumber - b.matchNumber
    } else if (sortField === 'time') {
      comparison = a.scheduledTime.localeCompare(b.scheduledTime)
    } else if (sortField === 'pool') {
      comparison = getPoolName(a.poolId).localeCompare(getPoolName(b.poolId))
    } else if (sortField === 'division') {
      comparison = getDivisionName(a.divisionId).localeCompare(getDivisionName(b.divisionId))
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status)
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
            <p className="text-gray-600 mt-1">Manage match schedules and scores</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleExportTemplate}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#374151',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
                e.currentTarget.style.borderColor = '#9ca3af'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
            >
              📥 Export Template
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#374151',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
                e.currentTarget.style.borderColor = '#9ca3af'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
            >
              📋 Bulk Import
            </button>
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
              + Schedule Match
            </button>
          </div>
        </div>

        {/* Tournament Filter */}
        {tournaments.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Tournament
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Tournaments</option>
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Matches Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  <button
                    onClick={() => handleSort('matchNumber')}
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
                    Match #
                    {sortField === 'matchNumber' && (
                      <span style={{ fontSize: '10px' }}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  <button
                    onClick={() => handleSort('time')}
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
                    Time
                    {sortField === 'time' && (
                      <span style={{ fontSize: '10px' }}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  <button
                    onClick={() => handleSort('pool')}
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
                    Pool
                    {sortField === 'pool' && (
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
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  Dark
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  vs
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  Light
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
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
                      fontFamily: 'inherit'
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
              {sortedMatches.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '14px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                    No matches scheduled. Click "Schedule Match" to create one.
                  </td>
                </tr>
              ) : (
                sortedMatches.map((match, index) => (
                  <tr key={match.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {match.matchNumber}
                      {match.isSemiFinal && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#2563eb' }}>SF</span>}
                      {match.isFinal && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#ca8a04' }}>F</span>}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {match.scheduledTime}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {getPoolName(match.poolId)}
                    </td>
                    <td style={{ padding: '8px 12px', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '2px',
                            border: '1px solid #d1d5db',
                            backgroundColor: getDivisionColor(match.divisionId)
                          }}
                        />
                        <span style={{ fontSize: '14px' }}>{getDivisionName(match.divisionId)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', color: '#111827', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {getTeamAbbreviation(match.darkTeamId)}
                    </td>
                    <td style={{ padding: '8px 4px', fontSize: '12px', color: '#9ca3af', textAlign: 'center', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      vs
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', color: '#111827', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      {getTeamAbbreviation(match.lightTeamId)}
                    </td>
                    <td style={{ padding: '8px 12px', borderRight: '1px solid #e5e7eb', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: '500',
                          borderRadius: '12px',
                          backgroundColor: match.status === 'final' ? '#dcfce7' :
                                          match.status === 'in_progress' ? '#dbeafe' :
                                          match.status === 'forfeit' ? '#fed7aa' :
                                          match.status === 'cancelled' ? '#fee2e2' : '#f3f4f6',
                          color: match.status === 'final' ? '#166534' :
                                match.status === 'in_progress' ? '#1e40af' :
                                match.status === 'forfeit' ? '#9a3412' :
                                match.status === 'cancelled' ? '#991b1b' : '#6b7280'
                        }}
                      >
                        {match.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                      <button
                        onClick={() => handleEdit(match)}
                        style={{ color: '#4f46e5', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(match.id)}
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
        <MatchModal
          match={editingMatch}
          matches={matches}
          tournaments={tournaments}
          pools={pools}
          divisions={divisions}
          teams={teams}
          scheduleBreaks={scheduleBreaks}
          defaultTournamentId={selectedTournamentId}
          onClose={() => setShowModal(false)}
          onSave={loadData}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          matches={matches}
          tournaments={tournaments}
          pools={pools}
          divisions={divisions}
          teams={teams}
          defaultTournamentId={selectedTournamentId}
          onClose={() => setShowBulkImport(false)}
          onSave={loadData}
        />
      )}
    </div>
  )
}

interface MatchModalProps {
  match: Match | null
  matches: Match[]
  tournaments: Tournament[]
  pools: Pool[]
  divisions: Division[]
  teams: Team[]
  scheduleBreaks: ScheduleBreak[]
  defaultTournamentId: string
  onClose: () => void
  onSave: () => void
}

function MatchModal({ match, matches, tournaments, pools, divisions, teams, scheduleBreaks, defaultTournamentId, onClose, onSave }: MatchModalProps) {
  // Calculate next available game number
  const getNextMatchNumber = () => {
    if (match) return match.matchNumber // Keep existing number when editing
    if (matches.length === 0) return 1
    const maxMatchNumber = Math.max(...matches.map(m => m.matchNumber))
    return maxMatchNumber + 1
  }

  const [formData, setFormData] = useState({
    tournamentId: match?.tournamentId || defaultTournamentId || '',
    poolId: match?.poolId || '',
    divisionId: match?.divisionId || '',
    matchNumber: getNextMatchNumber(),
    scheduledTime: match?.scheduledTime || '08:00',
    duration: match?.duration || 55,
    darkTeamId: match?.darkTeamId || '',
    lightTeamId: match?.lightTeamId || '',
    darkTeamScore: match?.darkTeamScore,
    lightTeamScore: match?.lightTeamScore,
    status: match?.status || 'scheduled' as 'scheduled' | 'in_progress' | 'final' | 'forfeit' | 'cancelled',
    isSemiFinal: match?.isSemiFinal || false,
    roundType: match?.roundType || 'pool' as 'pool' | 'semi' | 'final' | 'placement',
    isFinal: match?.isFinal || false,
  })
  const [saving, setSaving] = useState(false)

  // Filter pools and teams by selected tournament
  const availablePools = pools.filter(p => p.tournamentId === formData.tournamentId)
  const availableTeams = teams.filter(t =>
    t.tournamentId === formData.tournamentId &&
    t.divisionId === formData.divisionId
  )

  // Filter teams to prevent selecting the same team twice
  const availableDarkTeams = availableTeams.filter(t => t.id !== formData.lightTeamId)
  const availableLightTeams = availableTeams.filter(t => t.id !== formData.darkTeamId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.darkTeamId === formData.lightTeamId) {
      alert('Dark team and light team cannot be the same')
      return
    }

    // Check for duplicate game number (only when creating new game or changing game number)
    if (!match || match.matchNumber !== formData.matchNumber) {
      const duplicateMatch = matches.find(m => m.matchNumber === formData.matchNumber && m.id !== match?.id)
      if (duplicateMatch) {
        alert(`Match number ${formData.matchNumber} is already assigned. Please use a different match number.`)
        return
      }
    }

    // Check for pool/time conflicts (consider match duration for overlapping windows)
    const poolTimeConflict = matches.find(m => {
      if (m.id === match?.id) return false // Don't check against itself when editing
      if (m.poolId !== formData.poolId) return false // Different pool, no conflict

      // Convert time strings to minutes since midnight for easier comparison
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
      }

      const currentStart = timeToMinutes(formData.scheduledTime)
      const currentEnd = currentStart + formData.duration

      const existingStart = timeToMinutes(m.scheduledTime)
      const existingEnd = existingStart + m.duration

      // Check if time windows overlap
      // Overlap occurs if: currentStart < existingEnd AND currentEnd > existingStart
      return currentStart < existingEnd && currentEnd > existingStart
    })

    if (poolTimeConflict) {
      const conflictPool = pools.find(p => p.id === formData.poolId)
      const existingStart = poolTimeConflict.scheduledTime
      const existingEnd = (() => {
        const [hours, minutes] = existingStart.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + poolTimeConflict.duration
        const endHours = Math.floor(totalMinutes / 60)
        const endMinutes = totalMinutes % 60
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
      })()

      alert(`Pool "${conflictPool?.name}" is occupied from ${existingStart} to ${existingEnd} (Match #${poolTimeConflict.matchNumber}, ${poolTimeConflict.duration} min). Your match time (${formData.scheduledTime}, ${formData.duration} min) overlaps with this. Please choose a different time or pool.`)
      return
    }

    // Check for team conflicts (teams can't play in two matches at the same time)
    const teamConflict = matches.find(m => {
      if (m.id === match?.id) return false // Don't check against itself when editing
      if (m.scheduledTime !== formData.scheduledTime) return false // Different time, no conflict

      // Check if any team is playing in both matches
      const conflictTeams = [m.darkTeamId, m.lightTeamId]
      const currentTeams = [formData.darkTeamId, formData.lightTeamId]

      return conflictTeams.some(teamId => currentTeams.includes(teamId))
    })

    if (teamConflict) {
      const conflictTeamId = [teamConflict.darkTeamId, teamConflict.lightTeamId]
        .find(teamId => [formData.darkTeamId, formData.lightTeamId].includes(teamId))
      const conflictTeamName = teams.find(t => t.id === conflictTeamId)?.name
      alert(`Team "${conflictTeamName}" is already scheduled to play at ${formData.scheduledTime} in Match #${teamConflict.matchNumber}. A team cannot play in two matches at the same time.`)
      return
    }

    // Check for schedule break conflicts
    const scheduleBreakConflict = checkScheduleBreakConflict(
      formData.poolId,
      formData.scheduledTime,
      formData.duration,
      scheduleBreaks
    )

    if (scheduleBreakConflict) {
      const conflictPool = pools.find(p => p.id === formData.poolId)
      alert(`This match conflicts with a schedule break in "${conflictPool?.name}" from ${scheduleBreakConflict.startTime} to ${scheduleBreakConflict.endTime} (${scheduleBreakConflict.reason}). Please choose a different time.`)
      return
    }

    setSaving(true)

    try {
      if (match) {
        await updateMatch(match.id, formData)
      } else {
        // Remove undefined score fields for new games (Firebase doesn't allow undefined)
        const { darkTeamScore, lightTeamScore, ...matchData } = formData
        const newMatchData = {
          ...matchData,
          ...(darkTeamScore !== undefined && { darkTeamScore }),
          ...(lightTeamScore !== undefined && { lightTeamScore })
        }
        await createMatch(newMatchData as Omit<Match, 'id' | 'createdAt' | 'updatedAt'>)
      }
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving match:', error)
      alert('Failed to save match. Please try again.')
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
          maxWidth: '800px',
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
            {match ? 'Edit Match' : 'Schedule New Match'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Tournament and Pool */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Tournament *
                </label>
                <select
                  required
                  value={formData.tournamentId}
                  onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value, poolId: '', divisionId: '', darkTeamId: '', lightTeamId: '' })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <option value="">Select tournament</option>
                  {tournaments.map(tournament => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Pool *
                </label>
                <select
                  required
                  value={formData.poolId}
                  onChange={(e) => setFormData({ ...formData, poolId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  disabled={!formData.tournamentId}
                >
                  <option value="">Select pool</option>
                  {availablePools.map(pool => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name} - {pool.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Division */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Division *
              </label>
              <select
                required
                value={formData.divisionId}
                onChange={(e) => setFormData({ ...formData, divisionId: e.target.value, darkTeamId: '', lightTeamId: '' })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="">Select division</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Match Number, Time, Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Match Number *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.matchNumber}
                  onChange={(e) => setFormData({ ...formData, matchNumber: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Scheduled Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Duration (min) *
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="120"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>

            {/* Teams */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Dark Team *
                </label>
                <select
                  required
                  value={formData.darkTeamId}
                  onChange={(e) => setFormData({ ...formData, darkTeamId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  disabled={!formData.divisionId}
                >
                  <option value="">Select dark team</option>
                  {availableDarkTeams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Light Team *
                </label>
                <select
                  required
                  value={formData.lightTeamId}
                  onChange={(e) => setFormData({ ...formData, lightTeamId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  disabled={!formData.divisionId}
                >
                  <option value="">Select light team</option>
                  {availableLightTeams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scores (only if editing) */}
            {match && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Dark Team Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.darkTeamScore ?? ''}
                    onChange={(e) => setFormData({ ...formData, darkTeamScore: e.target.value ? parseInt(e.target.value) : undefined })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Light Team Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lightTeamScore ?? ''}
                    onChange={(e) => setFormData({ ...formData, lightTeamScore: e.target.value ? parseInt(e.target.value) : undefined })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="final">Final</option>
                    <option value="forfeit">Forfeit</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}

            {/* Match Type Flags */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '12px'
              }}>
                Match Type
              </label>
              <div style={{ display: 'flex', gap: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isSemiFinal}
                    onChange={(e) => setFormData({ ...formData, isSemiFinal: e.target.checked, isFinal: false })}
                    style={{ marginRight: '8px', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>Semi-Final</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFinal}
                    onChange={(e) => setFormData({ ...formData, isFinal: e.target.checked, isSemiFinal: false })}
                    style={{ marginRight: '8px', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>Final</span>
                </label>
              </div>
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
                {saving ? 'Saving...' : match ? 'Update Match' : 'Schedule Match'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface BulkImportModalProps {
  matches: Match[]
  tournaments: Tournament[]
  pools: Pool[]
  divisions: Division[]
  teams: Team[]
  defaultTournamentId: string
  onClose: () => void
  onSave: () => void
}

interface ParsedMatch {
  matchNum: number
  poolName: string
  divisionName: string
  time: string
  darkTeamName: string
  lightTeamName: string
  lineNum: number
  // Resolved entities
  pool?: Pool
  division?: Division
  darkTeam?: Team
  lightTeam?: Team
  scheduledTime?: string
}

function BulkImportModal({ matches, tournaments, pools, divisions, teams, defaultTournamentId, onClose, onSave }: BulkImportModalProps) {
  const [selectedTournamentId, setSelectedTournamentId] = useState(defaultTournamentId)
  const [importData, setImportData] = useState('')
  const [importing, setImporting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Get next game number
  const getNextMatchNumber = () => {
    if (matches.length === 0) return 1
    return Math.max(...matches.map(m => m.matchNumber)) + 1
  }

  const handleParse = () => {
    setErrors([])
    setParsedMatches([])

    const lines = importData.trim().split('\n').filter(line => line.trim())

    if (lines.length === 0) {
      setErrors(['No data to import'])
      return
    }

    if (!selectedTournamentId) {
      setErrors(['Please select a tournament'])
      return
    }

    const newErrors: string[] = []
    const parsed: ParsedMatch[] = []
    let currentMatchNumber = getNextMatchNumber()
    const usedMatchNumbers = new Set(matches.map(m => m.matchNumber))

    // Helper functions
    const findPool = (poolName: string) => {
      return pools.find(p =>
        p.tournamentId === selectedTournamentId &&
        (p.name.toLowerCase() === poolName.toLowerCase() || p.name === poolName)
      )
    }

    const findDivision = (divisionName: string) => {
      return divisions.find(d =>
        d.name.toLowerCase() === divisionName.toLowerCase() || d.name === divisionName
      )
    }

    const findTeam = (teamName: string, divisionId: string) => {
      // Try exact match first
      let team = teams.find(t =>
        t.tournamentId === selectedTournamentId &&
        t.divisionId === divisionId &&
        t.name.toLowerCase() === teamName.toLowerCase()
      )

      // If no exact match, try partial match
      if (!team) {
        team = teams.find(t =>
          t.tournamentId === selectedTournamentId &&
          t.divisionId === divisionId &&
          t.name.toLowerCase().includes(teamName.toLowerCase())
        )
      }

      return team
    }

    // Parse each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNum = i + 1

      // Skip header rows and comments
      if (line.startsWith('#') || line.toLowerCase().includes('match#')) {
        continue
      }

      // Split by tab or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',')
      const cleaned = parts.map(p => p.trim()).filter(p => p)

      // Expected format: MatchNum, Pool, Division, Time, Dark Team, Light Team
      if (cleaned.length < 6) {
        newErrors.push(`Line ${lineNum}: Not enough columns (need 6: match#, pool, division, time, dark team, light team). Found ${cleaned.length} columns`)
        continue
      }

      const [matchNumStr, poolName, divisionName, time, darkTeamName, lightTeamName] = cleaned

      // Parse game number
      let matchNum = parseInt(matchNumStr)
      if (isNaN(matchNum) || matchNum < 1) {
        // Auto-assign match number
        matchNum = currentMatchNumber++
      } else {
        // Check for duplicate in existing matches
        if (usedMatchNumbers.has(matchNum)) {
          newErrors.push(`Line ${lineNum}: Match number ${matchNum} already exists`)
          continue
        }
        // Check for duplicate within this import batch
        if (parsed.some(m => m.matchNum === matchNum)) {
          newErrors.push(`Line ${lineNum}: Match number ${matchNum} is duplicated in this import`)
          continue
        }
        usedMatchNumbers.add(matchNum)
        currentMatchNumber = Math.max(currentMatchNumber, matchNum + 1)
      }

      // Find entities
      const pool = findPool(poolName)
      const division = findDivision(divisionName)
      const darkTeam = division ? findTeam(darkTeamName, division.id) : undefined
      const lightTeam = division ? findTeam(lightTeamName, division.id) : undefined

      // Validate
      if (!pool) {
        newErrors.push(`Line ${lineNum}: Pool "${poolName}" not found`)
      }
      if (!division) {
        newErrors.push(`Line ${lineNum}: Division "${divisionName}" not found`)
      }
      if (division && !darkTeam) {
        const availableTeams = teams.filter(t => t.tournamentId === selectedTournamentId && t.divisionId === division.id)
        newErrors.push(`Line ${lineNum}: Dark team "${darkTeamName}" not found in ${divisionName}. Available: ${availableTeams.map(t => t.name).join(', ')}`)
      }
      if (division && !lightTeam) {
        const availableTeams = teams.filter(t => t.tournamentId === selectedTournamentId && t.divisionId === division.id)
        newErrors.push(`Line ${lineNum}: Light team "${lightTeamName}" not found in ${divisionName}. Available: ${availableTeams.map(t => t.name).join(', ')}`)
      }
      if (darkTeam && lightTeam && darkTeam.id === lightTeam.id) {
        newErrors.push(`Line ${lineNum}: Cannot have same team as both dark and light`)
      }

      // Parse time (handle formats like "4:00 PM" or "16:00")
      let scheduledTime = time
      if (time.includes('PM') || time.includes('AM')) {
        const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
        if (match) {
          let hours = parseInt(match[1])
          const minutes = match[2]
          const period = match[3].toUpperCase()

          if (period === 'PM' && hours !== 12) hours += 12
          if (period === 'AM' && hours === 12) hours = 0

          scheduledTime = `${hours.toString().padStart(2, '0')}:${minutes}`
        }
      }

      // Add to parsed matches (even if there are errors, so we can show what was parsed)
      parsed.push({
        matchNum,
        poolName,
        divisionName,
        time,
        darkTeamName,
        lightTeamName,
        lineNum,
        pool,
        division,
        darkTeam,
        lightTeam,
        scheduledTime
      })
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    // Success - show preview
    setParsedMatches(parsed)
    setShowPreview(true)
  }

  const handleConfirmImport = async () => {
    setImporting(true)
    const creationErrors: string[] = []

    for (const match of parsedMatches) {
      if (!match.pool || !match.division || !match.darkTeam || !match.lightTeam || !match.scheduledTime) {
        creationErrors.push(`Line ${match.lineNum}: Missing required data`)
        continue
      }

      try {
        await createMatch({
          tournamentId: selectedTournamentId,
          poolId: match.pool.id,
          divisionId: match.division.id,
          matchNumber: match.matchNum,
          scheduledTime: match.scheduledTime,
          duration: 55,
          darkTeamId: match.darkTeam.id,
          lightTeamId: match.lightTeam.id,
          status: 'scheduled',
          roundType: 'pool',
          isSemiFinal: false,
          isFinal: false
        })
      } catch (error) {
        creationErrors.push(`Line ${match.lineNum}: Failed to create match - ${error}`)
      }
    }

    setImporting(false)

    if (creationErrors.length > 0) {
      setErrors(creationErrors)
      setShowPreview(false)
    } else {
      onSave()
      onClose()
    }
  }

  // Show preview screen if parsing was successful
  if (showPreview) {
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
            maxWidth: '1100px',
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
              marginBottom: '8px'
            }}>
              Confirm Import ({parsedMatches.length} matches)
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              Review the matched teams and confirm to import all matches.
            </p>

            {/* Preview Table */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Match #</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Pool</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Division</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Teams</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedMatches.map((match, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{match.matchNum}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{match.pool?.name || match.poolName}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{match.division?.name || match.divisionName}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{match.time}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px' }}>
                          <div>
                            <span style={{ color: '#6b7280' }}>"{match.darkTeamName}"</span>
                            {match.darkTeam && (
                              <span style={{ color: '#16a34a', marginLeft: '8px' }}>→ {match.darkTeam.name}</span>
                            )}
                          </div>
                          <div style={{ color: '#9ca3af', margin: '4px 0' }}>vs</div>
                          <div>
                            <span style={{ color: '#6b7280' }}>"{match.lightTeamName}"</span>
                            {match.lightTeam && (
                              <span style={{ color: '#16a34a', marginLeft: '8px' }}>→ {match.lightTeam.name}</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#dc2626',
                  marginBottom: '8px'
                }}>
                  Errors:
                </p>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '13px',
                  color: '#dc2626'
                }}>
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px'
            }}>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
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
                ← Back to Edit
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: importing ? '#9ca3af' : '#16a34a',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: importing ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!importing) e.currentTarget.style.backgroundColor = '#15803d'
                }}
                onMouseLeave={(e) => {
                  if (!importing) e.currentTarget.style.backgroundColor = '#16a34a'
                }}
              >
                {importing ? 'Importing...' : `✓ Confirm & Import ${parsedMatches.length} Matches`}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show input form
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
          maxWidth: '900px',
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
            marginBottom: '8px'
          }}>
            Bulk Import Matches
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Paste schedule data from Excel/spreadsheet (tab or comma separated). Use the "Export Template" button to get a starter file with all available teams and pools.
          </p>

          {/* Tournament Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Tournament *
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="">Select tournament</option>
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>

          {/* Example Format */}
          <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Required Format (6 columns, tab or comma separated):
            </p>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              Match# → Pool → Division → Time → Dark Team → Light Team
            </p>
            <pre style={{
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'monospace',
              margin: 0,
              whiteSpace: 'pre-wrap'
            }}>
{`1	1	18u Boys	08:00	Orlando Black	Tampa Blue
2	1	18u Boys	08:55	Seminole Gold	Patriots White
3	2	16u Girls	08:00	Team Orlando	SJ Cariba`}
            </pre>
            <p style={{
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '8px'
            }}>
              💡 Tip: Click "Export Template" to get a file with all available pools and teams pre-filled
            </p>
          </div>

          {/* Import Textarea */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Paste Schedule Data
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your schedule data here..."
              rows={12}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#dc2626',
                marginBottom: '8px'
              }}>
                Errors:
              </p>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '13px',
                color: '#dc2626'
              }}>
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

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
              onClick={handleParse}
              style={{
                flex: 1,
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Preview & Validate →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
