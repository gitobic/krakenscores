import { useTableSort, getSortIndicator } from '../hooks/useTableSort'
import type { Match, Division, Team, Club, Pool } from '../types/index'

interface MatchWithDetails {
  match: Match
  division: Division
  pool: Pool
  darkTeam: Team
  lightTeam: Team
  darkTeamClub: Club
  lightTeamClub: Club
}

type SortableMatch = MatchWithDetails & {
  matchNumber: number
  scheduledTime: string
  poolName: string
  divisionName: string
}

interface SortableMatchTableProps {
  matches: MatchWithDetails[]
  showFullClubNames: boolean
}

export default function SortableMatchTable({ matches, showFullClubNames }: SortableMatchTableProps) {
  // Add sortable properties
  const matchesWithSortKeys: SortableMatch[] = matches.map(m => ({
    ...m,
    matchNumber: m.match.matchNumber,
    scheduledTime: m.match.scheduledTime,
    poolName: m.pool.name,
    divisionName: m.division.name
  }))

  // Use sorting hook
  const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort<SortableMatch>(
    matchesWithSortKeys,
    'matchNumber',
    'asc'
  )

  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'fixed'
    }}>
      <colgroup>
        <col style={{ width: '40px' }} />
        <col style={{ width: '50px' }} />
        <col style={{ width: '45px' }} />
        <col style={{ width: '70px' }} />
        <col style={{ width: 'auto' }} />
        <col style={{ width: '60px' }} />
      </colgroup>
      <thead>
        <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
          <th
            onClick={() => handleSort('matchNumber')}
            style={{
              padding: '6px 4px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            #{getSortIndicator('matchNumber', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('scheduledTime')}
            style={{
              padding: '6px 4px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Time{getSortIndicator('scheduledTime', sortColumn, sortDirection)}
          </th>
          <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>
            Pool
          </th>
          <th
            onClick={() => handleSort('divisionName')}
            style={{
              padding: '6px 4px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Div{getSortIndicator('divisionName', sortColumn, sortDirection)}
          </th>
          <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'left', color: '#374151' }}>
            Dark vs Light
          </th>
          <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center', color: '#374151' }}>
            Score
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item, idx) => {
          const { match, division, pool, darkTeamClub, lightTeamClub } = item
          const isEven = idx % 2 === 0

          return (
            <tr
              key={match.id}
              style={{
                backgroundColor: isEven ? '#ffffff' : '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}
            >
              {/* Match Number */}
              <td style={{
                padding: '6px 4px',
                fontSize: '13px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#111827'
              }}>
                {match.matchNumber}
              </td>

              {/* Time */}
              <td style={{
                padding: '6px 4px',
                fontSize: '12px',
                textAlign: 'center',
                color: '#374151',
                whiteSpace: 'nowrap'
              }}>
                {match.scheduledTime}
              </td>

              {/* Pool */}
              <td style={{
                padding: '6px 4px',
                fontSize: '12px',
                textAlign: 'center',
                color: '#374151'
              }}>
                {pool.name}
              </td>

              {/* Division */}
              <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                <div style={{
                  backgroundColor: division.colorHex,
                  color: '#000000',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '600',
                  display: 'inline-block',
                  whiteSpace: 'nowrap'
                }}>
                  {division.name}
                </div>
              </td>

              {/* Teams */}
              <td style={{ padding: '6px 4px', fontSize: '12px', color: '#111827' }}>
                <span style={{ fontWeight: '600' }}>
                  {showFullClubNames ? darkTeamClub.name : darkTeamClub.abbreviation}
                </span>
                {' vs '}
                <span style={{ fontWeight: '600' }}>
                  {showFullClubNames ? lightTeamClub.name : lightTeamClub.abbreviation}
                </span>
              </td>

              {/* Score */}
              <td style={{
                padding: '6px 4px',
                fontSize: '12px',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                {match.status === 'final' && match.darkTeamScore !== undefined && match.lightTeamScore !== undefined ? (
                  <div style={{
                    color: match.darkTeamScore > match.lightTeamScore
                      ? '#16a34a'
                      : match.lightTeamScore > match.darkTeamScore
                        ? '#16a34a'
                        : '#6b7280'
                  }}>
                    {match.darkTeamScore} - {match.lightTeamScore}
                  </div>
                ) : (
                  <span style={{ color: '#9ca3af' }}>-</span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
