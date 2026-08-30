import { describe, expect, it } from 'vitest'
import type { Club, Division, Team } from '../types/index'
import { resolveTeamIdentifier, teamCompactName, teamOptionLabel, teamPublicName } from './teamIdentity'

const teamOrlando = { id: 'club-to', name: 'Team Orlando', abbreviation: 'TO' } as Club
const teams = [
  { id: 'to-black', clubId: teamOrlando.id, divisionId: 'masters', name: 'Team Orlando Black' },
  { id: 'to-blue', clubId: teamOrlando.id, divisionId: 'masters', name: 'Team Orlando Blue' },
  { id: 'to-16', clubId: teamOrlando.id, divisionId: '16u', name: 'Team Orlando' },
] as Team[]

describe('team identity', () => {
  it('uses full team names when one club fields variants in a division', () => {
    expect(teamCompactName(teams[0], teamOrlando, teams)).toBe('Team Orlando Black')
    expect(teamCompactName(teams[1], teamOrlando, teams)).toBe('Team Orlando Blue')
    expect(teamCompactName(teams[2], teamOrlando, teams)).toBe('TO')
    expect(teamCompactName(teams[2], teamOrlando, [teams[2], teams[2]])).toBe('TO')
    expect(teamPublicName(teams[0], teamOrlando)).toBe('Team Orlando Black')
  })

  it('includes the division in team selector labels', () => {
    expect(teamOptionLabel(teams[2], { name: '16u Boys' } as Division)).toBe('Team Orlando — 16u Boys')
    expect(teamOptionLabel(teams[2])).toBe('Team Orlando')
  })

  it('resolves an exact team name before considering its club', () => {
    expect(resolveTeamIdentifier('Team Orlando Blue', 'masters', teams, [teamOrlando])).toEqual({ status: 'found', team: teams[1] })
  })

  it('rejects a club abbreviation when it represents multiple division teams', () => {
    const result = resolveTeamIdentifier('TO', 'masters', teams, [teamOrlando])
    expect(result.status).toBe('ambiguous')
    if (result.status === 'ambiguous') expect(result.teams.map(team => team.name)).toEqual(['Team Orlando Black', 'Team Orlando Blue'])
  })

  it('keeps Wolverines color variants distinct under one club', () => {
    const club = { id: 'club-wolv', name: 'Wolverines', abbreviation: 'WOLV' } as Club
    const variants = [
      { id: 'wolv-blue', clubId: club.id, divisionId: '14u', name: 'Wolverines Blue' },
      { id: 'wolv-yellow', clubId: club.id, divisionId: '14u', name: 'Wolverines Yellow' },
    ] as Team[]

    expect(teamCompactName(variants[0], club, variants)).toBe('Wolverines Blue')
    expect(teamCompactName(variants[1], club, variants)).toBe('Wolverines Yellow')
  })
})
