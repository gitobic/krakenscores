import { useState, useEffect } from 'react'
import type { Match } from '../../types/index'
import { deleteMatch } from '../../services/matches'
import { useMatchData } from '../../hooks/useMatchData'
import MatchModal from '../../components/matches/MatchModal'
import BulkImportModal from '../../components/matches/BulkImportModal'
import MatchTable from '../../components/matches/MatchTable'

export default function Matches() {
  const {
    matches,
    tournaments,
    pools,
    divisions,
    teams,
    scheduleBreaks,
    clubs,
    loading,
    reload: loadData
  } = useMatchData()

  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')

  // Auto-select first tournament
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0].id)
    }
  }, [tournaments, selectedTournamentId])

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

    const tournament = tournaments.find(t => t.id === selectedTournamentId)
    if (!tournament) return

    // Build CSV content with all teams organized by division
    let csvContent = '# Tournament: ' + tournament.name + '\n'
    csvContent += '# Format: Match#\tPool\tDivision\tTime\tDark Team\tLight Team\n'
    csvContent += '# Time format: Use 24-hour (16:00) or 12-hour with AM/PM (4:00 PM)\n'
    csvContent += '# Teams: Use full team names exactly as shown below\n'
    csvContent += '# \n'
    csvContent += '# Available Pools:\n'

    // Add available pools
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

  // Filter matches by tournament
  const filteredMatches = selectedTournamentId
    ? matches.filter(match => match.tournamentId === selectedTournamentId)
    : matches

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

        {/* Page Header */}
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
        <MatchTable
          matches={filteredMatches}
          pools={pools}
          divisions={divisions}
          teams={teams}
          clubs={clubs}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modals */}
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
