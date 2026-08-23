import type { Match, Standing, Team, TeamStanding } from '../types/index'

export function calculateHeadToHead(teamAId: string, teamBId: string, matches: Match[]) {
  let teamAPoints = 0
  let teamBPoints = 0
  let teamAGoalDiff = 0
  let teamBGoalDiff = 0

  matches.forEach(match => {
    if (match.status !== 'final' || match.darkTeamScore === undefined || match.lightTeamScore === undefined) return
    if (!((match.darkTeamId === teamAId && match.lightTeamId === teamBId) || (match.darkTeamId === teamBId && match.lightTeamId === teamAId))) return
    const teamAIsDark = match.darkTeamId === teamAId
    const teamAScore = teamAIsDark ? match.darkTeamScore : match.lightTeamScore
    const teamBScore = teamAIsDark ? match.lightTeamScore : match.darkTeamScore
    if (teamAScore > teamBScore) teamAPoints += 2
    else if (teamBScore > teamAScore) teamBPoints += 2
    else {
      teamAPoints++
      teamBPoints++
    }
    teamAGoalDiff += teamAScore - teamBScore
    teamBGoalDiff += teamBScore - teamAScore
  })
  return { teamAPoints, teamBPoints, teamAGoalDiff, teamBGoalDiff }
}

export function calculateStandings(teams: Team[], matches: Match[]): Omit<Standing, 'divisionId' | 'tournamentId' | 'updatedAt'> {
  const stats = new Map<string, TeamStanding>(teams.map(team => [team.id, {
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
  }]))

  matches.forEach(match => {
    if (match.status !== 'final' || match.darkTeamScore === undefined || match.lightTeamScore === undefined) return
    const dark = stats.get(match.darkTeamId)
    const light = stats.get(match.lightTeamId)
    if (!dark || !light) return
    dark.games++
    light.games++
    dark.goalsFor += match.darkTeamScore
    dark.goalsAgainst += match.lightTeamScore
    light.goalsFor += match.lightTeamScore
    light.goalsAgainst += match.darkTeamScore
    if (match.darkTeamScore > match.lightTeamScore) {
      dark.wins++
      light.losses++
    } else if (match.lightTeamScore > match.darkTeamScore) {
      light.wins++
      dark.losses++
    } else {
      dark.draws++
      light.draws++
    }
  })

  stats.forEach(row => {
    row.goalsFor = Math.round(row.goalsFor * 100) / 100
    row.goalsAgainst = Math.round(row.goalsAgainst * 100) / 100
    row.goalDiff = Math.round((row.goalsFor - row.goalsAgainst) * 100) / 100
    row.points = row.wins * 2 + row.draws
  })

  const table = [...stats.values()]
  const tiedMetrics = new Map<string, { points: number; goalDiff: number }>()
  const pointGroups = new Map<number, TeamStanding[]>()
  table.forEach(row => pointGroups.set(row.points, [...(pointGroups.get(row.points) || []), row]))
  pointGroups.forEach(group => {
    if (group.length < 2) return
    const ids = new Set(group.map(row => row.teamId))
    group.forEach(row => tiedMetrics.set(row.teamId, { points: 0, goalDiff: 0 }))
    matches.forEach(match => {
      if (match.status !== 'final' || match.darkTeamScore === undefined || match.lightTeamScore === undefined) return
      if (!ids.has(match.darkTeamId) || !ids.has(match.lightTeamId)) return
      const dark = tiedMetrics.get(match.darkTeamId)!
      const light = tiedMetrics.get(match.lightTeamId)!
      if (match.darkTeamScore > match.lightTeamScore) dark.points += 2
      else if (match.lightTeamScore > match.darkTeamScore) light.points += 2
      else {
        dark.points++
        light.points++
      }
      dark.goalDiff += match.darkTeamScore - match.lightTeamScore
      light.goalDiff += match.lightTeamScore - match.darkTeamScore
    })
  })

  table.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    const aTied = tiedMetrics.get(a.teamId)!
    const bTied = tiedMetrics.get(b.teamId)!
    if (aTied.points !== bTied.points) return bTied.points - aTied.points
    if (aTied.goalDiff !== bTied.goalDiff) return bTied.goalDiff - aTied.goalDiff
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor
    if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst
    return a.teamName.localeCompare(b.teamName)
  })

  const tiebreakerNotes: string[] = []
  table.forEach((row, index) => {
    row.rank = index + 1
    if (index === 0 || row.points !== table[index - 1].points) return
    const previous = table[index - 1]
    const previousTied = tiedMetrics.get(previous.teamId)!
    const rowTied = tiedMetrics.get(row.teamId)!
    const reason = previousTied.points !== rowTied.points ? 'head-to-head points'
      : previousTied.goalDiff !== rowTied.goalDiff ? 'head-to-head goal differential'
        : previous.goalDiff !== row.goalDiff ? 'overall goal differential'
          : previous.goalsFor !== row.goalsFor ? 'goals scored'
            : previous.goalsAgainst !== row.goalsAgainst ? 'fewest goals allowed'
              : 'team name (last resort)'
    tiebreakerNotes.push(`${previous.teamName} ranked above ${row.teamName} on ${reason}.`)
  })

  return { table, tiebreakerNotes: tiebreakerNotes.length ? tiebreakerNotes : undefined }
}
