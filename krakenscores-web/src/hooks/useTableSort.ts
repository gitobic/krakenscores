import { useState, useMemo } from 'react'

/**
 * Custom hook for sortable tables
 *
 * @param data - Array of items to sort
 * @param initialColumn - Initial column to sort by (optional)
 * @param initialDirection - Initial sort direction (default: 'asc')
 * @returns Sorted data, sort state, and handler function
 *
 * @example
 * const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort(
 *   matches,
 *   'matchNumber'
 * )
 *
 * // In table header:
 * <th onClick={() => handleSort('matchNumber')}>
 *   # {sortColumn === 'matchNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
 * </th>
 */
export function useTableSort<T>(
  data: T[],
  initialColumn?: keyof T,
  initialDirection: 'asc' | 'desc' = 'asc'
) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(initialColumn || null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialDirection)

  /**
   * Toggle sort column and direction
   * - If clicking the same column: toggle direction
   * - If clicking a new column: sort ascending
   */
  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  /**
   * Memoized sorted data
   * Re-sorts only when data, sortColumn, or sortDirection changes
   */
  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      // Handle null/undefined values (push to end)
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal)
        return sortDirection === 'asc' ? comparison : -comparison
      }

      // Number comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      // Date comparison
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc'
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime()
      }

      // Default: no change
      return 0
    })
  }, [data, sortColumn, sortDirection])

  return {
    sortedData,
    sortColumn,
    sortDirection,
    handleSort
  }
}

/**
 * Helper function to get sort indicator for table headers
 *
 * @param currentColumn - The column being rendered
 * @param sortColumn - The currently sorted column
 * @param sortDirection - The current sort direction
 * @returns Sort indicator string ('⇅', '↑', or '↓')
 *
 * @example
 * <th>
 *   Match # {getSortIndicator('matchNumber', sortColumn, sortDirection)}
 * </th>
 */
export function getSortIndicator<T>(
  currentColumn: keyof T,
  sortColumn: keyof T | null,
  sortDirection: 'asc' | 'desc'
): string {
  if (sortColumn !== currentColumn) {
    return '⇅' // Not sorted
  }
  return sortDirection === 'asc' ? '↑' : '↓'
}
