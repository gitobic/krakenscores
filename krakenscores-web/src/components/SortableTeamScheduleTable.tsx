import { useTableSort, getSortIndicator } from '../hooks/useTableSort'
import { colors, typography, tableStyles, columnWidths, containerStyles } from '../styles/theme'
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

interface SortableTeamScheduleTableProps {
  matches: MatchWithDetails[]
  selectedClubId: string
}

export default function SortableTeamScheduleTable({ matches, selectedClubId }: SortableTeamScheduleTableProps) {
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
    undefined,
    'asc'
  )

  return (
    <table style={tableStyles.container}>
      <colgroup>
        <col style={{ width: columnWidths.matchNumber }} />
        <col style={{ width: columnWidths.time }} />
        <col style={{ width: columnWidths.pool }} />
        <col style={{ width: columnWidths.division }} />
        <col style={{ width: columnWidths.auto }} />
        <col style={{ width: columnWidths.score }} />
      </colgroup>
      <thead style={tableStyles.header}>
        <tr>
          <th
            onClick={() => handleSort('matchNumber')}
            style={{
              ...tableStyles.headerCell,
              textAlign: 'center',
              whiteSpace: 'nowrap' as const,
              cursor: 'pointer',
              userSelect: 'none' as const
            }}
          >
            # {getSortIndicator('matchNumber', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('scheduledTime')}
            style={{
              ...tableStyles.headerCell,
              textAlign: 'center',
              whiteSpace: 'nowrap' as const,
              cursor: 'pointer',
              userSelect: 'none' as const
            }}
          >
            Time {getSortIndicator('scheduledTime', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('poolName')}
            style={{
              ...tableStyles.headerCell,
              textAlign: 'center',
              whiteSpace: 'nowrap' as const,
              cursor: 'pointer',
              userSelect: 'none' as const
            }}
          >
            Pool {getSortIndicator('poolName', sortColumn, sortDirection)}
          </th>
          <th
            onClick={() => handleSort('divisionName')}
            style={{
              ...tableStyles.headerCell,
              textAlign: 'center',
              whiteSpace: 'nowrap' as const,
              cursor: 'pointer',
              userSelect: 'none' as const
            }}
          >
            Div {getSortIndicator('divisionName', sortColumn, sortDirection)}
          </th>
          <th style={{ ...tableStyles.headerCell, textAlign: 'left' }}>
            Opponent
          </th>
          <th style={{ ...tableStyles.headerCell, textAlign: 'center' }}>
            Score
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item, idx) => {
          const { match, division, pool, darkTeamClub, lightTeamClub } = item
          const isEven = idx % 2 === 0
          const isUserTeamDark = selectedClubId ? darkTeamClub.id === selectedClubId : false
          const opponent = isUserTeamDark ? lightTeamClub : darkTeamClub
          const opponentCaps = isUserTeamDark ? 'Light' : 'Dark'
          const userScore = isUserTeamDark ? match.darkTeamScore : match.lightTeamScore
          const opponentScore = isUserTeamDark ? match.lightTeamScore : match.darkTeamScore

          return (
            <tr
              key={match.id}
              style={{
                ...tableStyles.bodyRow(isEven)
              }}
            >
              {/* Match Number */}
              <td style={{
                padding: '6px 4px',
                fontSize: typography.fontSize.tableBody,
                textAlign: 'center',
                fontWeight: typography.fontWeight.semiBold,
                color: colors.gray.black
              }}>
                {match.matchNumber}
              </td>

              {/* Time */}
              <td style={{
                padding: '6px 4px',
                fontSize: typography.fontSize.tableStat,
                textAlign: 'center',
                color: colors.gray.dark,
                whiteSpace: 'nowrap' as const
              }}>
                {match.scheduledTime}
              </td>

              {/* Pool */}
              <td style={{
                padding: '6px 4px',
                fontSize: typography.fontSize.tableStat,
                textAlign: 'center',
                color: colors.gray.dark
              }}>
                {pool.name}
              </td>

              {/* Division (colored badge) */}
              <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                <div style={containerStyles.divisionBadge(division.colorHex)}>
                  {division.name}
                </div>
              </td>

              {/* Opponent */}
              <td style={{ padding: '6px 4px', fontSize: typography.fontSize.tableStat, color: colors.gray.black }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: colors.gray.medium }}>vs </span>
                    <span style={{ fontWeight: typography.fontWeight.semiBold }}>
                      {opponent.name}
                    </span>
                    <span style={{ fontSize: typography.fontSize.badgeText, color: colors.gray.medium, marginLeft: '4px' }}>
                      ({opponentCaps})
                    </span>
                  </div>
                </div>
              </td>

              {/* Score */}
              <td style={{
                padding: '6px 4px',
                fontSize: typography.fontSize.tableStat,
                textAlign: 'center',
                fontWeight: typography.fontWeight.semiBold
              }}>
                {match.status === 'final' && userScore !== undefined && opponentScore !== undefined ? (
                  <div style={{
                    color: userScore > opponentScore ? colors.semantic.win : userScore < opponentScore ? colors.semantic.loss : colors.gray.medium
                  }}>
                    {userScore} - {opponentScore}
                  </div>
                ) : (
                  <span style={{ color: colors.gray.light }}>-</span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
