import { useState } from 'react'
import type { Match } from '../../types/index'
import { useMatchHelpers } from '../../hooks/useMatchHelpers'
import type { Pool, Division, Team, Club } from '../../types/index'

type SortField = 'matchNumber' | 'date' | 'time' | 'pool' | 'division' | 'status'
type SortDirection = 'asc' | 'desc'

interface MatchTableProps {
  matches: Match[]
  pools: Pool[]
  divisions: Division[]
  teams: Team[]
  clubs: Club[]
  onEdit: (match: Match) => void
  onDelete: (matchId: string) => void
}

export default function MatchTable({
  matches,
  pools,
  divisions,
  teams,
  clubs,
  onEdit,
  onDelete
}: MatchTableProps) {
  const [sortField, setSortField] = useState<SortField>('matchNumber')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const { getPoolName, getDivisionName, getDivisionColor, getTeamAbbreviation } =
    useMatchHelpers(pools, divisions, teams, clubs)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedMatches = [...matches].sort((a, b) => {
    let comparison = 0

    if (sortField === 'matchNumber') {
      comparison = a.matchNumber - b.matchNumber
    } else if (sortField === 'date') {
      comparison = a.scheduledDate.localeCompare(b.scheduledDate)
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

  return (
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
                onClick={() => handleSort('date')}
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
                Date
                {sortField === 'date' && (
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
              <td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '14px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
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
                  {(() => {
                    // Parse date as local to avoid timezone shift
                    const [year, month, day] = match.scheduledDate.split('-').map(Number)
                    const localDate = new Date(year, month - 1, day)
                    return localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  })()}
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
                    onClick={() => onEdit(match)}
                    style={{ color: '#4f46e5', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(match.id)}
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
  )
}
