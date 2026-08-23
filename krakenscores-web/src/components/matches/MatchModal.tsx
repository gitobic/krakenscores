import { useState } from 'react'
import type { Match, MatchParticipantSlot, Tournament, Pool, Division, Team, ScheduleBreak } from '../../types/index'
import { createMatch, updateMatch } from '../../services/matches'
import { validateMatch } from '../../utils/matchValidation'
import { fixedTeamSlot, parseGroupSeed, participantLabel } from '../../utils/participantSlots'

type ParticipantRuleType = 'groupSeed' | 'winnerOf' | 'loserOf'

function initialParticipantRule(match: Match | null, side: 'dark' | 'light'): { type: ParticipantRuleType; value: string } {
  const participant = side === 'dark' ? match?.darkParticipant : match?.lightParticipant
  if (participant?.source === 'groupSeed') return { type: 'groupSeed', value: `${participant.rank}${participant.groupId}` }
  if (participant?.source === 'matchOutcome') {
    return { type: participant.outcome === 'winner' ? 'winnerOf' : 'loserOf', value: participant.matchId }
  }

  const legacy = side === 'dark' ? match?.feedsFrom?.darkFrom : match?.feedsFrom?.lightFrom
  if (legacy?.type === 'winnerOf' || legacy?.type === 'loserOf') return { type: legacy.type, value: String(legacy.value) }
  return { type: 'groupSeed', value: legacy ? String(legacy.value) : '' }
}

interface MatchModalProps {
  match: Match | null
  matches: Match[]
  tournaments: Tournament[]
  pools: Pool[]
  divisions: Division[]
  teams: Team[]
  scheduleBreaks: ScheduleBreak[]
  defaultTournamentId: string
  onClose: () => void
  onSave: () => void
}

export default function MatchModal({
  match,
  matches,
  tournaments,
  pools,
  divisions,
  teams,
  scheduleBreaks,
  defaultTournamentId,
  onClose,
  onSave
}: MatchModalProps) {
  // Calculate next available match number
  const getNextMatchNumber = () => {
    if (match) return match.matchNumber
    if (matches.length === 0) return 1
    const maxMatchNumber = Math.max(...matches.map(m => m.matchNumber))
    return maxMatchNumber + 1
  }

  // Get tournament start date for default
  const getDefaultDate = () => {
    if (match?.scheduledDate) return match.scheduledDate

    const tournament = tournaments.find(t => t.id === (match?.tournamentId || defaultTournamentId))
    if (tournament?.startDate) {
      const date = tournament.startDate instanceof Date ? tournament.startDate : new Date(tournament.startDate)
      return date.toISOString().split('T')[0]
    }

    return new Date().toISOString().split('T')[0]
  }

  // Get default duration from tournament
  const getDefaultDuration = () => {
    if (match?.duration) return match.duration
    const tournament = tournaments.find(t => t.id === (match?.tournamentId || defaultTournamentId))
    return tournament?.defaultMatchDuration || 55
  }

  const [formData, setFormData] = useState({
    tournamentId: match?.tournamentId || defaultTournamentId || '',
    poolId: match?.poolId || '',
    divisionId: match?.divisionId || '',
    matchNumber: getNextMatchNumber(),
    scheduledDate: getDefaultDate(),
    scheduledTime: match?.scheduledTime || '08:00',
    duration: getDefaultDuration(),
    darkTeamId: match?.darkParticipant && match.darkParticipant.source !== 'team' ? 'TBD' : match?.darkTeamId || '',
    lightTeamId: match?.lightParticipant && match.lightParticipant.source !== 'team' ? 'TBD' : match?.lightTeamId || '',
    darkTeamScore: match?.darkTeamScore,
    lightTeamScore: match?.lightTeamScore,
    status: match?.status || 'scheduled' as 'scheduled' | 'in_progress' | 'final' | 'forfeit' | 'cancelled',
    isSemiFinal: match?.isSemiFinal || false,
    roundType: match?.roundType || 'pool' as 'pool' | 'semi' | 'final' | 'placement',
    isFinal: match?.isFinal || false,
    bracketRef: match?.bracketRef || ''
  })
  const [saving, setSaving] = useState(false)

  // Bracket rule state for TBD teams
  const [darkTeamRule, setDarkTeamRule] = useState(() => initialParticipantRule(match, 'dark'))
  const [lightTeamRule, setLightTeamRule] = useState(() => initialParticipantRule(match, 'light'))

  // Filter pools by selected tournament
  const availablePools = pools.filter(p => p.tournamentId === formData.tournamentId)

  // Get divisions that have teams
  const availableDivisions = divisions.filter(division =>
    teams.some(team => team.divisionId === division.id)
  )

  // Filter teams by selected division only (teams are global resources)
  const availableTeams = teams.filter(t => t.divisionId === formData.divisionId)

  // Filter teams to prevent selecting the same team twice
  const availableDarkTeams = availableTeams.filter(t => t.id !== formData.lightTeamId)
  const availableLightTeams = availableTeams.filter(t => t.id !== formData.darkTeamId)
  const availableSourceMatches = matches.filter(candidate =>
    candidate.id !== match?.id &&
    candidate.tournamentId === formData.tournamentId &&
    candidate.divisionId === formData.divisionId
  )

  const buildParticipant = (teamId: string, rule: { type: ParticipantRuleType; value: string }): MatchParticipantSlot | null => {
    if (teamId !== 'TBD') return teamId ? fixedTeamSlot(teamId) : null
    if (rule.type === 'groupSeed') return parseGroupSeed(rule.value)
    if (!rule.value) return null
    return { source: 'matchOutcome', matchId: rule.value, outcome: rule.type === 'winnerOf' ? 'winner' : 'loser' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const darkParticipant = buildParticipant(formData.darkTeamId, darkTeamRule)
    const lightParticipant = buildParticipant(formData.lightTeamId, lightTeamRule)

    if (!darkParticipant) {
      alert('Please select or define the Dark Team participant')
      return
    }
    if (!lightParticipant) {
      alert('Please select or define the Light Team participant')
      return
    }

    const submissionData = {
      ...formData,
      darkParticipant,
      lightParticipant,
      darkTeamId: formData.darkTeamId === 'TBD' ? '' : formData.darkTeamId,
      lightTeamId: formData.lightTeamId === 'TBD' ? '' : formData.lightTeamId,
      ...(participantLabel(darkParticipant, matches) && { darkTeamLabel: participantLabel(darkParticipant, matches) }),
      ...(participantLabel(lightParticipant, matches) && { lightTeamLabel: participantLabel(lightParticipant, matches) })
    }

    // Validate match using centralized validation
    const validationError = validateMatch(
      submissionData,
      matches,
      pools,
      teams,
      scheduleBreaks,
      match?.id
    )

    if (validationError) {
      alert(validationError)
      return
    }

    setSaving(true)

    try {
      // Remove undefined score fields to prevent Firebase errors
      const { darkTeamScore, lightTeamScore, ...matchData } = submissionData
      const cleanedData = {
        ...matchData,
        ...(darkTeamScore !== undefined && { darkTeamScore }),
        ...(lightTeamScore !== undefined && { lightTeamScore })
      }

      if (match) {
        await updateMatch(match.id, cleanedData)
      } else {
        await createMatch(cleanedData as Omit<Match, 'id' | 'createdAt' | 'updatedAt'>)
      }
      // Wait for data to reload before closing
      await onSave()
      onClose()
    } catch (error) {
      console.error('Error saving match:', error)
      alert('Failed to save match. Please try again.')
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
          maxWidth: '800px',
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
            {match ? 'Edit Match' : 'Schedule New Match'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Tournament and Pool */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
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
                  onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value, poolId: '', divisionId: '', darkTeamId: '', lightTeamId: '' })}
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

              <div>
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
            </div>

            {/* Division */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Division *
              </label>
              <select
                required
                value={formData.divisionId}
                onChange={(e) => setFormData({ ...formData, divisionId: e.target.value, darkTeamId: '', lightTeamId: '' })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
                disabled={!formData.tournamentId}
              >
                <option value="">Select division</option>
                {availableDivisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
              {formData.tournamentId && availableDivisions.length === 0 && (
                <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                  No divisions with teams found for this tournament. Please add teams first.
                </p>
              )}
            </div>

            {/* Match Number, Date, Time, Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Match # *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.matchNumber}
                  onChange={(e) => setFormData({ ...formData, matchNumber: parseInt(e.target.value) })}
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

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
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
                  Duration (min) *
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="120"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
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

            {/* Teams */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Dark Team *
                </label>
                <select
                  required
                  value={formData.darkTeamId}
                  onChange={(e) => setFormData({ ...formData, darkTeamId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  disabled={!formData.divisionId}
                >
                  <option value="">Select dark team</option>
                  <option value="TBD">TBD - To Be Determined</option>
                  {availableDarkTeams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>

                {/* Bracket Rule Builder for Dark Team */}
                {formData.darkTeamId === 'TBD' && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#1e40af',
                      marginBottom: '4px'
                    }}>
                      How is this team determined?
                    </label>
                    <p style={{
                      fontSize: '11px',
                      color: '#1e40af',
                      marginBottom: '8px',
                      margin: '0 0 8px 0'
                    }}>
                      {darkTeamRule.type === 'winnerOf' && 'Select the source match whose winner will play here.'}
                      {darkTeamRule.type === 'loserOf' && 'Select the source match whose loser will play here.'}
                      {darkTeamRule.type === 'groupSeed' && 'Enter the group rank and group code (for example, 1F or 3O).'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                      <select
                        value={darkTeamRule.type}
                        onChange={(e) => setDarkTeamRule({ type: e.target.value as ParticipantRuleType, value: '' })}
                        style={{
                          padding: '8px',
                          fontSize: '14px',
                          border: '1px solid #bfdbfe',
                          borderRadius: '4px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="winnerOf">Winner of</option>
                        <option value="loserOf">Loser of</option>
                        <option value="groupSeed">Group seed</option>
                      </select>
                      {darkTeamRule.type === 'groupSeed' ? (
                        <input type="text" value={darkTeamRule.value} onChange={(e) => setDarkTeamRule({ ...darkTeamRule, value: e.target.value })} placeholder="1F" style={{ padding: '8px', fontSize: '14px', border: '1px solid #bfdbfe', borderRadius: '4px' }} />
                      ) : (
                        <select value={darkTeamRule.value} onChange={(e) => setDarkTeamRule({ ...darkTeamRule, value: e.target.value })} style={{ padding: '8px', fontSize: '14px', border: '1px solid #bfdbfe', borderRadius: '4px', backgroundColor: 'white' }}>
                          <option value="">Select source game</option>
                          {availableSourceMatches.map(source => <option key={source.id} value={source.id}>Game {source.matchNumber}{source.bracketRef ? ` — ${source.bracketRef}` : ''}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Light Team *
                </label>
                <select
                  required
                  value={formData.lightTeamId}
                  onChange={(e) => setFormData({ ...formData, lightTeamId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  disabled={!formData.divisionId}
                >
                  <option value="">Select light team</option>
                  <option value="TBD">TBD - To Be Determined</option>
                  {availableLightTeams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>

                {/* Bracket Rule Builder for Light Team */}
                {formData.lightTeamId === 'TBD' && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#1e40af',
                      marginBottom: '4px'
                    }}>
                      How is this team determined?
                    </label>
                    <p style={{
                      fontSize: '11px',
                      color: '#1e40af',
                      marginBottom: '8px',
                      margin: '0 0 8px 0'
                    }}>
                      {lightTeamRule.type === 'winnerOf' && 'Select the source match whose winner will play here.'}
                      {lightTeamRule.type === 'loserOf' && 'Select the source match whose loser will play here.'}
                      {lightTeamRule.type === 'groupSeed' && 'Enter the group rank and group code (for example, 1F or 3O).'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                      <select
                        value={lightTeamRule.type}
                        onChange={(e) => setLightTeamRule({ type: e.target.value as ParticipantRuleType, value: '' })}
                        style={{
                          padding: '8px',
                          fontSize: '14px',
                          border: '1px solid #bfdbfe',
                          borderRadius: '4px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="winnerOf">Winner of</option>
                        <option value="loserOf">Loser of</option>
                        <option value="groupSeed">Group seed</option>
                      </select>
                      {lightTeamRule.type === 'groupSeed' ? (
                        <input type="text" value={lightTeamRule.value} onChange={(e) => setLightTeamRule({ ...lightTeamRule, value: e.target.value })} placeholder="1G" style={{ padding: '8px', fontSize: '14px', border: '1px solid #bfdbfe', borderRadius: '4px' }} />
                      ) : (
                        <select value={lightTeamRule.value} onChange={(e) => setLightTeamRule({ ...lightTeamRule, value: e.target.value })} style={{ padding: '8px', fontSize: '14px', border: '1px solid #bfdbfe', borderRadius: '4px', backgroundColor: 'white' }}>
                          <option value="">Select source game</option>
                          {availableSourceMatches.map(source => <option key={source.id} value={source.id}>Game {source.matchNumber}{source.bracketRef ? ` — ${source.bracketRef}` : ''}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scores (only if editing) */}
            {match && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Dark Team Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.darkTeamScore ?? ''}
                    onChange={(e) => setFormData({ ...formData, darkTeamScore: e.target.value ? parseInt(e.target.value) : undefined })}
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
                    Light Team Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lightTeamScore ?? ''}
                    onChange={(e) => setFormData({ ...formData, lightTeamScore: e.target.value ? parseInt(e.target.value) : undefined })}
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
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Match['status'] })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="final">Final</option>
                    <option value="forfeit">Forfeit</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}

            {/* Match Type and Bracket Reference */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Round Type
                </label>
                <select
                  value={formData.roundType}
                  onChange={(e) => setFormData({
                    ...formData,
                    roundType: e.target.value as Match['roundType'],
                    isSemiFinal: e.target.value === 'semi',
                    isFinal: e.target.value === 'final'
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <option value="pool">Pool Play</option>
                  <option value="semi">Semi-Final</option>
                  <option value="final">Final</option>
                  <option value="placement">Placement</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Bracket Reference (Optional)
                </label>
                <input
                  type="text"
                  value={formData.bracketRef}
                  onChange={(e) => setFormData({ ...formData, bracketRef: e.target.value })}
                  placeholder="e.g., SF1, SF2, F, 3rd, 5th"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Used to identify playoff matches (SF1, SF2, F, etc.)
                </p>
              </div>
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
                {saving ? 'Saving...' : match ? 'Update Match' : 'Schedule Match'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
