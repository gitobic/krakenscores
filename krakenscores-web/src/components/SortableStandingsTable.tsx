import { useTableSort, getSortIndicator } from '../hooks/useTableSort'
import type { Standing } from '../types/index'

interface StandingWithClub {
  teamStanding: Standing['table'][0]
  clubName: string
}

type SortableStanding = StandingWithClub & {
  rank: number
  wins: number
  losses: number
  games: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

interface SortableStandingsTableProps {
  standings: StandingWithClub[]
}

export default function SortableStandingsTable({ standings }: SortableStandingsTableProps) {
  // Add sortable properties
  const standingsWithSortKeys: SortableStanding[] = standings.map(item => ({
    ...item,
    rank: item.teamStanding.rank,
    wins: item.teamStanding.wins,
    losses: item.teamStanding.losses,
    games: item.teamStanding.games,
    goalsFor: item.teamStanding.goalsFor,
    goalsAgainst: item.teamStanding.goalsAgainst,
    goalDiff: item.teamStanding.goalDiff,
    points: item.teamStanding.points
  }))

  // Use sorting hook
  const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort<SortableStanding>(
    standingsWithSortKeys,
    'rank',
    'asc'
  )

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '45px' }} />
        <col style={{ width: '30%' }} />
        <col style={{ width: '42px' }} />
        <col style={{ width: '38px' }} />
        <col style={{ width: '38px' }} />
        <col style={{ width: '45px' }} />
        <col style={{ width: '45px' }} />
        <col style={{ width: '50px' }} />
        <col style={{ width: '48px' }} />
      </colgroup>
      <thead>
        <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
          <th
            onClick={() => handleSort('rank')}
            style={{
              padding: '6px 2px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Rank{getSortIndicator('rank', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('clubName')}
            style={{
              padding: '6px 4px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'left',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Team{getSortIndicator('clubName', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('games')}
            style={{
              padding: '6px 2px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            GP{getSortIndicator('games', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('wins')}
            style={{
              padding: '6px 2px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            W{getSortIndicator('wins', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('losses')}
            style={{
              padding: '6px 2px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            L{getSortIndicator('losses', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('goalsFor')}
            style={{
              padding: '6px 2px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            GF{getSortIndicator('goalsFor', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('goalsAgainst')}
            style={{
              padding: '6px 2px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            GA{getSortIndicator('goalsAgainst', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('goalDiff')}
            style={{
              padding: '6px 2px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            GD{getSortIndicator('goalDiff', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('points')}
            style={{
              padding: '6px 2px',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Pts{getSortIndicator('points', sortColumn, sortDirection)}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item, idx) => {
          const { teamStanding, clubName } = item
          const isEven = idx % 2 === 0
          return (
            <tr
              key={teamStanding.teamId}
              style={{
                backgroundColor: isEven ? '#ffffff' : '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}
            >
              <td style={{ padding: '6px 2px', fontSize: '13px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>
                {teamStanding.rank}
              </td>
              <td style={{ padding: '6px 4px', fontSize: '13px', textAlign: 'left', fontWeight: '500', color: '#111827' }}>
                {clubName}
              </td>
              <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: '#374151' }}>
                {teamStanding.games}
              </td>
              <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>
                {teamStanding.wins}
              </td>
              <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: '#dc2626', fontWeight: '600' }}>
                {teamStanding.losses}
              </td>
              <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: '#374151' }}>
                {Math.round(teamStanding.goalsFor * 100) / 100}
              </td>
              <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: '#374151' }}>
                {Math.round(teamStanding.goalsAgainst * 100) / 100}
              </td>
              <td style={{ padding: '6px 2px', fontSize: '12px', textAlign: 'center', color: '#374151', fontWeight: '600' }}>
                {(() => {
                  const rounded = Math.round(teamStanding.goalDiff * 100) / 100
                  return rounded > 0 ? `+${rounded}` : rounded
                })()}
              </td>
              <td style={{ padding: '6px 2px', fontSize: '13px', textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>
                {teamStanding.points}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
