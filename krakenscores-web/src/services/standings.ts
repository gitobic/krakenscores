import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Standing, TeamStanding, Match, Team } from '../types/index'

const COLLECTION = 'standings'

/**
 * Get standings for a specific division
 */
export async function getStandingsByDivision(divisionId: string): Promise<Standing | null> {
  const docRef = doc(db, COLLECTION, divisionId)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  return {
    divisionId: snapshot.id,
    tournamentId: data.tournamentId,
    table: data.table || [],
    tiebreakerNotes: data.tiebreakerNotes,
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  } as Standing
}

/**
 * Get all standings for a tournament
 */
export async function getStandingsByTournament(tournamentId: string): Promise<Standing[]> {
  const q = query(collection(db, COLLECTION), where('tournamentId', '==', tournamentId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      divisionId: doc.id,
      tournamentId: data.tournamentId,
      table: data.table || [],
      tiebreakerNotes: data.tiebreakerNotes,
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Standing
  })
}

/**
 * Calculate and save standings for a division
 * This is triggered when a match is finalized (status = 'final')
 */
export async function recalculateStandingsForDivision(divisionId: string): Promise<void> {
  // 1. Get all teams in the division
  const teamsSnapshot = await getDocs(
    query(collection(db, 'teams'), where('divisionId', '==', divisionId))
  )

  const teams: Team[] = teamsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
  } as Team))

  if (teams.length === 0) {
    return // No teams in division
  }

  // 2. Get all final matches for this division
  const matchesSnapshot = await getDocs(
    query(
      collection(db, 'matches'),
      where('divisionId', '==', divisionId),
      where('status', '==', 'final')
    )
  )

  const matches: Match[] = matchesSnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Match
  })

  // 3. Calculate standings
  const standing = calculateStandings(teams, matches)

  // 4. Save to Firestore
  const docRef = doc(db, COLLECTION, divisionId)
  await setDoc(docRef, {
    tournamentId: teams[0].tournamentId,
    table: standing.table,
    tiebreakerNotes: standing.tiebreakerNotes,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Pure function to calculate standings from teams and matches
 * This function is testable and contains all the tie-breaker logic
 */
export function calculateStandings(teams: Team[], matches: Match[]): Omit<Standing, 'divisionId' | 'tournamentId' | 'updatedAt'> {
  // Initialize team stats
  const teamStats = new Map<string, TeamStanding>()

  teams.forEach(team => {
    teamStats.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      rank: 0,
    })
  })

  // Process final matches
  matches.forEach(match => {
    if (match.status !== 'final' || match.darkTeamScore === undefined || match.lightTeamScore === undefined) {
      return
    }

    const darkStats = teamStats.get(match.darkTeamId)
    const lightStats = teamStats.get(match.lightTeamId)

    if (!darkStats || !lightStats) {
      return // Team not in division (shouldn't happen)
    }

    // Update games played
    darkStats.games++
    lightStats.games++

    // Update goals
    darkStats.goalsFor += match.darkTeamScore
    darkStats.goalsAgainst += match.lightTeamScore
    lightStats.goalsFor += match.lightTeamScore
    lightStats.goalsAgainst += match.darkTeamScore

    // Update wins/losses/draws
    if (match.darkTeamScore > match.lightTeamScore) {
      // Dark team wins
      darkStats.wins++
      lightStats.losses++
    } else if (match.lightTeamScore > match.darkTeamScore) {
      // Light team wins
      lightStats.wins++
      darkStats.losses++
    } else {
      // Draw
      darkStats.draws++
      lightStats.draws++
    }
  })

  // Calculate derived stats
  teamStats.forEach(stats => {
    stats.goalDiff = stats.goalsFor - stats.goalsAgainst
    stats.points = stats.wins * 2 + stats.draws * 1 // 2 points per win, 1 per draw
  })

  // Convert to array and sort with tie-breakers
  const table = Array.from(teamStats.values())
  const tiebreakerNotes: string[] = []

  // Sort by: 1. Points, 2. Goal Diff, 3. Goals For, 4. Fewest Goals Against, 5. Team Name
  table.sort((a, b) => {
    // 1. Total points (descending)
    if (a.points !== b.points) {
      return b.points - a.points
    }

    // TODO: 2. Head-to-head points among tied teams (requires additional logic)
    // For now, we'll skip head-to-head and go straight to goal differential

    // 3. Total goal differential (descending)
    if (a.goalDiff !== b.goalDiff) {
      return b.goalDiff - a.goalDiff
    }

    // 4. Total goals for (descending)
    if (a.goalsFor !== b.goalsFor) {
      return b.goalsFor - a.goalsFor
    }

    // 5. Fewest goals against (ascending)
    if (a.goalsAgainst !== b.goalsAgainst) {
      return a.goalsAgainst - b.goalsAgainst
    }

    // 6. Alphabetical by team name (tie-breaker of last resort)
    return a.teamName.localeCompare(b.teamName)
  })

  // Assign ranks (handle ties in points)
  let currentRank = 1
  for (let i = 0; i < table.length; i++) {
    if (i > 0 && table[i].points === table[i - 1].points) {
      // Same points as previous team - check if truly tied or separated by tie-breaker
      const prev = table[i - 1]
      const curr = table[i]

      if (prev.goalDiff === curr.goalDiff && prev.goalsFor === curr.goalsFor) {
        // Truly tied on all criteria except goals against or name
        table[i].rank = table[i - 1].rank
        tiebreakerNotes.push(
          `${curr.teamName} ranked ${curr.rank === prev.rank ? 'equal to' : 'below'} ${prev.teamName}: ` +
          `both have ${curr.points} points, ${curr.goalDiff} goal diff, ${curr.goalsFor} goals for; ` +
          `separated by goals against (${prev.goalsAgainst} vs ${curr.goalsAgainst})`
        )
      } else {
        // Separated by tie-breaker
        table[i].rank = currentRank
        if (prev.goalDiff !== curr.goalDiff) {
          tiebreakerNotes.push(
            `${curr.teamName} ranked below ${prev.teamName}: both have ${curr.points} points, ` +
            `but ${prev.teamName} has better goal differential (+${prev.goalDiff} vs +${curr.goalDiff})`
          )
        } else if (prev.goalsFor !== curr.goalsFor) {
          tiebreakerNotes.push(
            `${curr.teamName} ranked below ${prev.teamName}: both have ${curr.points} points and ` +
            `${prev.goalDiff} goal diff, but ${prev.teamName} scored more goals (${prev.goalsFor} vs ${curr.goalsFor})`
          )
        }
      }
    } else {
      table[i].rank = currentRank
    }
    currentRank++
  }

  return {
    table,
    tiebreakerNotes: tiebreakerNotes.length > 0 ? tiebreakerNotes : undefined,
  }
}

/**
 * Helper function to calculate head-to-head record between two teams
 * Used for tie-breaking when teams have the same points
 *
 * @internal - Reserved for future tie-breaker enhancement (Phase 2C)
 * TODO: Integrate this into the tie-breaker logic in calculateStandings()
 */
// @ts-expect-error - Reserved for future use in tie-breaker implementation
function calculateHeadToHead(teamAId: string, teamBId: string, matches: Match[]): {
  teamAPoints: number
  teamBPoints: number
  teamAGoalDiff: number
  teamBGoalDiff: number
} {
  let teamAPoints = 0
  let teamBPoints = 0
  let teamAGoalDiff = 0
  let teamBGoalDiff = 0

  matches.forEach(match => {
    if (match.status !== 'final' || match.darkTeamScore === undefined || match.lightTeamScore === undefined) {
      return
    }

    // Check if this match involves both teams
    const isHeadToHead =
      (match.darkTeamId === teamAId && match.lightTeamId === teamBId) ||
      (match.darkTeamId === teamBId && match.lightTeamId === teamAId)

    if (!isHeadToHead) {
      return
    }

    // Determine which team is which
    const teamAIsDark = match.darkTeamId === teamAId
    const teamAScore = teamAIsDark ? match.darkTeamScore : match.lightTeamScore
    const teamBScore = teamAIsDark ? match.lightTeamScore : match.darkTeamScore

    // Update points
    if (teamAScore > teamBScore) {
      teamAPoints += 2
    } else if (teamBScore > teamAScore) {
      teamBPoints += 2
    } else {
      teamAPoints += 1
      teamBPoints += 1
    }

    // Update goal differential
    teamAGoalDiff += teamAScore - teamBScore
    teamBGoalDiff += teamBScore - teamAScore
  })

  return { teamAPoints, teamBPoints, teamAGoalDiff, teamBGoalDiff }
}
