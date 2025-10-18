import { useMemo } from 'react'
import type { Pool, Division, Team, Club } from '../types/index'

/**
 * Custom hook that provides helper functions for displaying match data
 */
export function useMatchHelpers(
  pools: Pool[],
  divisions: Division[],
  teams: Team[],
  clubs: Club[]
) {
  return useMemo(() => {
    const getPoolName = (poolId: string): string => {
      const pool = pools.find(p => p.id === poolId)
      return pool?.name || 'Unknown'
    }

    const getDivisionName = (divisionId: string): string => {
      const division = divisions.find(d => d.id === divisionId)
      return division?.name || 'Unknown'
    }

    const getDivisionColor = (divisionId: string): string => {
      const division = divisions.find(d => d.id === divisionId)
      return division?.colorHex || '#cccccc'
    }

    const getTeamName = (teamId: string): string => {
      const team = teams.find(t => t.id === teamId)
      return team?.name || 'Unknown'
    }

    const getTeamAbbreviation = (teamId: string): string => {
      const team = teams.find(t => t.id === teamId)
      if (!team) return 'Unknown'

      const club = clubs.find(c => c.id === team.clubId)
      return club?.abbreviation || team.name
    }

    return {
      getPoolName,
      getDivisionName,
      getDivisionColor,
      getTeamName,
      getTeamAbbreviation
    }
  }, [pools, divisions, teams, clubs])
}
