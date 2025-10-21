import { useState, useEffect } from 'react'
import type { ScheduleBreak, Tournament, Pool } from '../../types/index'
import {
  getAllScheduleBreaks,
  createScheduleBreak,
  updateScheduleBreak,
  deleteScheduleBreak
} from '../../services/scheduleBreaks'
import { getAllTournaments } from '../../services/tournaments'
import { getAllPools } from '../../services/pools'

export default function ScheduleBreaks() {
  const [breaks, setBreaks] = useState<ScheduleBreak[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBreak, setEditingBreak] = useState<ScheduleBreak | null>(null)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')

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
      const [breaksData, tournamentsData, poolsData] = await Promise.all([
        getAllScheduleBreaks(),
        getAllTournaments(),
        getAllPools()
      ])
      setBreaks(breaksData)
      setTournaments(tournamentsData)
      setPools(poolsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingBreak(null)
    setShowModal(true)
  }

  const handleEdit = (scheduleBreak: ScheduleBreak) => {
    setEditingBreak(scheduleBreak)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule break?')) {
      return
    }

    try {
      await deleteScheduleBreak(id)
      await loadData()
    } catch (error) {
      console.error('Error deleting schedule break:', error)
      alert('Failed to delete schedule break. Please try again.')
    }
  }

  const getPoolName = (poolId: string) => {
    const pool = pools.find(p => p.id === poolId)
    return pool?.name || 'Unknown'
  }

  const getTournamentName = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId)
    return tournament?.name || 'Unknown'
  }

  // Filter breaks by tournament
  const filteredBreaks = selectedTournamentId
    ? breaks.filter(b => b.tournamentId === selectedTournamentId)
    : breaks

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule breaks...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Schedule Breaks</h1>
            <p className="text-gray-600 mt-1">Manage lunch breaks, ceremonies, and other schedule interruptions</p>
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
            + Add Schedule Break
          </button>
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

        {/* Schedule Breaks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  Tournament
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  Pool
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  Date
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  Start Time
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  End Time
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderRight: '1px solid #e5e7eb', color: '#111827' }}>
                  Reason
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBreaks.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    No schedule breaks. Click "Add Schedule Break" to create one.
                  </td>
                </tr>
              ) : (
                filteredBreaks.map((scheduleBreak, index) => (
                  <tr key={scheduleBreak.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb' }}>
                      {getTournamentName(scheduleBreak.tournamentId)}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', borderRight: '1px solid #e5e7eb' }}>
                      {getPoolName(scheduleBreak.poolId)}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb' }}>
                      {scheduleBreak.scheduledDate}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb' }}>
                      {scheduleBreak.startTime}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb' }}>
                      {scheduleBreak.endTime}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '14px', color: '#111827', borderRight: '1px solid #e5e7eb' }}>
                      {scheduleBreak.reason}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleEdit(scheduleBreak)}
                        style={{ color: '#4f46e5', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(scheduleBreak.id)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
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
        <ScheduleBreakModal
          scheduleBreak={editingBreak}
          tournaments={tournaments}
          pools={pools}
          defaultTournamentId={selectedTournamentId}
          onClose={() => setShowModal(false)}
          onSave={loadData}
        />
      )}
    </div>
  )
}

interface ScheduleBreakModalProps {
  scheduleBreak: ScheduleBreak | null
  tournaments: Tournament[]
  pools: Pool[]
  defaultTournamentId: string
  onClose: () => void
  onSave: () => void
}

function ScheduleBreakModal({ scheduleBreak, tournaments, pools, defaultTournamentId, onClose, onSave }: ScheduleBreakModalProps) {
  const [formData, setFormData] = useState({
    tournamentId: scheduleBreak?.tournamentId || defaultTournamentId || '',
    poolId: scheduleBreak?.poolId || '',
    scheduledDate: scheduleBreak?.scheduledDate || new Date().toISOString().split('T')[0], // Default to today
    startTime: scheduleBreak?.startTime || '12:00',
    endTime: scheduleBreak?.endTime || '13:00',
    reason: scheduleBreak?.reason || '',
  })
  const [saving, setSaving] = useState(false)

  // Filter pools by selected tournament
  const availablePools = pools.filter(p => p.tournamentId === formData.tournamentId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate time range
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    if (timeToMinutes(formData.startTime) >= timeToMinutes(formData.endTime)) {
      alert('End time must be after start time')
      return
    }

    setSaving(true)

    try {
      if (scheduleBreak) {
        await updateScheduleBreak(scheduleBreak.id, formData)
      } else {
        await createScheduleBreak(formData as Omit<ScheduleBreak, 'id' | 'createdAt' | 'updatedAt'>)
      }
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving schedule break:', error)
      alert('Failed to save schedule break. Please try again.')
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
          maxWidth: '600px',
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
            {scheduleBreak ? 'Edit Schedule Break' : 'Add Schedule Break'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Tournament */}
            <div style={{ marginBottom: '32px' }}>
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
                onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value, poolId: '' })}
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

            {/* Pool */}
            <div style={{ marginBottom: '32px' }}>
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

            {/* Date */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Time Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                  End Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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

            {/* Reason */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Reason *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Lunch Break, Awards Ceremony, Pool Maintenance"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
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
                {saving ? 'Saving...' : scheduleBreak ? 'Update Break' : 'Add Break'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
