import { useState } from 'react'
import type { Match, Tournament, Pool, Division, Team } from '../../types/index'
import { createMatch } from '../../services/matches'

interface BulkImportModalProps {
  matches: Match[]
  tournaments: Tournament[]
  pools: Pool[]
  divisions: Division[]
  teams: Team[]
  defaultTournamentId: string
  onClose: () => void
  onSave: () => void
}

interface ParsedMatch {
  matchNum: number
  poolName: string
  divisionName: string
  time: string
  darkTeamName: string
  lightTeamName: string
  lineNum: number
  // Resolved entities
  pool?: Pool
  division?: Division
  darkTeam?: Team
  lightTeam?: Team
  scheduledTime?: string
}

export default function BulkImportModal({
  matches,
  tournaments,
  pools,
  divisions,
  teams,
  defaultTournamentId,
  onClose,
  onSave
}: BulkImportModalProps) {
  const [selectedTournamentId, setSelectedTournamentId] = useState(defaultTournamentId)
  const [importData, setImportData] = useState('')
  const [importing, setImporting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Get next match number
  const getNextMatchNumber = () => {
    if (matches.length === 0) return 1
    return Math.max(...matches.map(m => m.matchNumber)) + 1
  }

  const handleParse = () => {
    setErrors([])
    setParsedMatches([])

    const lines = importData.trim().split('\n').filter(line => line.trim())

    if (lines.length === 0) {
      setErrors(['No data to import'])
      return
    }

    if (!selectedTournamentId) {
      setErrors(['Please select a tournament'])
      return
    }

    const newErrors: string[] = []
    const parsed: ParsedMatch[] = []
    let currentMatchNumber = getNextMatchNumber()
    const usedMatchNumbers = new Set(matches.map(m => m.matchNumber))

    // Helper functions
    const findPool = (poolName: string) => {
      return pools.find(p =>
        p.tournamentId === selectedTournamentId &&
        (p.name.toLowerCase() === poolName.toLowerCase() || p.name === poolName)
      )
    }

    const findDivision = (divisionName: string) => {
      return divisions.find(d =>
        d.name.toLowerCase() === divisionName.toLowerCase() || d.name === divisionName
      )
    }

    const findTeam = (teamName: string, divisionId: string) => {
      // Try exact match first
      let team = teams.find(t =>
        t.tournamentId === selectedTournamentId &&
        t.divisionId === divisionId &&
        t.name.toLowerCase() === teamName.toLowerCase()
      )

      // If no exact match, try partial match
      if (!team) {
        team = teams.find(t =>
          t.tournamentId === selectedTournamentId &&
          t.divisionId === divisionId &&
          t.name.toLowerCase().includes(teamName.toLowerCase())
        )
      }

      return team
    }

    // Parse each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNum = i + 1

      // Skip header rows and comments
      if (line.startsWith('#') || line.toLowerCase().includes('match#')) {
        continue
      }

      // Split by tab or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',')
      const cleaned = parts.map(p => p.trim()).filter(p => p)

      // Expected format: MatchNum, Pool, Division, Time, Dark Team, Light Team
      if (cleaned.length < 6) {
        newErrors.push(`Line ${lineNum}: Not enough columns (need 6: match#, pool, division, time, dark team, light team). Found ${cleaned.length} columns`)
        continue
      }

      const [matchNumStr, poolName, divisionName, time, darkTeamName, lightTeamName] = cleaned

      // Parse match number
      let matchNum = parseInt(matchNumStr)
      if (isNaN(matchNum) || matchNum < 1) {
        // Auto-assign match number
        matchNum = currentMatchNumber++
      } else {
        // Check for duplicate in existing matches
        if (usedMatchNumbers.has(matchNum)) {
          newErrors.push(`Line ${lineNum}: Match number ${matchNum} already exists`)
          continue
        }
        // Check for duplicate within this import batch
        if (parsed.some(m => m.matchNum === matchNum)) {
          newErrors.push(`Line ${lineNum}: Match number ${matchNum} is duplicated in this import`)
          continue
        }
        usedMatchNumbers.add(matchNum)
        currentMatchNumber = Math.max(currentMatchNumber, matchNum + 1)
      }

      // Find entities
      const pool = findPool(poolName)
      const division = findDivision(divisionName)
      const darkTeam = division ? findTeam(darkTeamName, division.id) : undefined
      const lightTeam = division ? findTeam(lightTeamName, division.id) : undefined

      // Validate
      if (!pool) {
        newErrors.push(`Line ${lineNum}: Pool "${poolName}" not found`)
      }
      if (!division) {
        newErrors.push(`Line ${lineNum}: Division "${divisionName}" not found`)
      }
      if (division && !darkTeam) {
        const availableTeams = teams.filter(t => t.tournamentId === selectedTournamentId && t.divisionId === division.id)
        newErrors.push(`Line ${lineNum}: Dark team "${darkTeamName}" not found in ${divisionName}. Available: ${availableTeams.map(t => t.name).join(', ')}`)
      }
      if (division && !lightTeam) {
        const availableTeams = teams.filter(t => t.tournamentId === selectedTournamentId && t.divisionId === division.id)
        newErrors.push(`Line ${lineNum}: Light team "${lightTeamName}" not found in ${divisionName}. Available: ${availableTeams.map(t => t.name).join(', ')}`)
      }
      if (darkTeam && lightTeam && darkTeam.id === lightTeam.id) {
        newErrors.push(`Line ${lineNum}: Cannot have same team as both dark and light`)
      }

      // Parse time (handle formats like "4:00 PM" or "16:00")
      let scheduledTime = time
      if (time.includes('PM') || time.includes('AM')) {
        const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
        if (match) {
          let hours = parseInt(match[1])
          const minutes = match[2]
          const period = match[3].toUpperCase()

          if (period === 'PM' && hours !== 12) hours += 12
          if (period === 'AM' && hours === 12) hours = 0

          scheduledTime = `${hours.toString().padStart(2, '0')}:${minutes}`
        }
      }

      // Add to parsed matches (even if there are errors, so we can show what was parsed)
      parsed.push({
        matchNum,
        poolName,
        divisionName,
        time,
        darkTeamName,
        lightTeamName,
        lineNum,
        pool,
        division,
        darkTeam,
        lightTeam,
        scheduledTime
      })
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    // Success - show preview
    setParsedMatches(parsed)
    setShowPreview(true)
  }

  const handleConfirmImport = async () => {
    setImporting(true)
    const creationErrors: string[] = []

    for (const match of parsedMatches) {
      if (!match.pool || !match.division || !match.darkTeam || !match.lightTeam || !match.scheduledTime) {
        creationErrors.push(`Line ${match.lineNum}: Missing required data`)
        continue
      }

      try {
        await createMatch({
          tournamentId: selectedTournamentId,
          poolId: match.pool.id,
          divisionId: match.division.id,
          matchNumber: match.matchNum,
          scheduledTime: match.scheduledTime,
          duration: 55,
          darkTeamId: match.darkTeam.id,
          lightTeamId: match.lightTeam.id,
          status: 'scheduled',
          roundType: 'pool',
          isSemiFinal: false,
          isFinal: false
        })
      } catch (error) {
        creationErrors.push(`Line ${match.lineNum}: Failed to create match - ${error}`)
      }
    }

    setImporting(false)

    if (creationErrors.length > 0) {
      setErrors(creationErrors)
      setShowPreview(false)
    } else {
      onSave()
      onClose()
    }
  }

  // Show preview screen if parsing was successful
  if (showPreview) {
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
            maxWidth: '1100px',
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
              marginBottom: '8px'
            }}>
              Confirm Import ({parsedMatches.length} matches)
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              Review the matched teams and confirm to import all matches.
            </p>

            {/* Preview Table */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Match #</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Pool</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Division</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Teams</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedMatches.map((match, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{match.matchNum}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{match.pool?.name || match.poolName}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{match.division?.name || match.divisionName}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{match.time}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px' }}>
                          <div>
                            <span style={{ color: '#6b7280' }}>"{match.darkTeamName}"</span>
                            {match.darkTeam && (
                              <span style={{ color: '#16a34a', marginLeft: '8px' }}>→ {match.darkTeam.name}</span>
                            )}
                          </div>
                          <div style={{ color: '#9ca3af', margin: '4px 0' }}>vs</div>
                          <div>
                            <span style={{ color: '#6b7280' }}>"{match.lightTeamName}"</span>
                            {match.lightTeam && (
                              <span style={{ color: '#16a34a', marginLeft: '8px' }}>→ {match.lightTeam.name}</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#dc2626',
                  marginBottom: '8px'
                }}>
                  Errors:
                </p>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '13px',
                  color: '#dc2626'
                }}>
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px'
            }}>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
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
                ← Back to Edit
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: importing ? '#9ca3af' : '#16a34a',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: importing ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!importing) e.currentTarget.style.backgroundColor = '#15803d'
                }}
                onMouseLeave={(e) => {
                  if (!importing) e.currentTarget.style.backgroundColor = '#16a34a'
                }}
              >
                {importing ? 'Importing...' : `✓ Confirm & Import ${parsedMatches.length} Matches`}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show input form
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
          maxWidth: '900px',
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
            marginBottom: '8px'
          }}>
            Bulk Import Matches
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Paste schedule data from Excel/spreadsheet (tab or comma separated). Use the "Export Template" button to get a starter file with all available teams and pools.
          </p>

          {/* Tournament Selection */}
          <div style={{ marginBottom: '24px' }}>
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
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
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

          {/* Example Format */}
          <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Required Format (6 columns, tab or comma separated):
            </p>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              Match# → Pool → Division → Time → Dark Team → Light Team
            </p>
            <pre style={{
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'monospace',
              margin: 0,
              whiteSpace: 'pre-wrap'
            }}>
{`1	1	18u Boys	08:00	Orlando Black	Tampa Blue
2	1	18u Boys	08:55	Seminole Gold	Patriots White
3	2	16u Girls	08:00	Team Orlando	SJ Cariba`}
            </pre>
            <p style={{
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '8px'
            }}>
              💡 Tip: Click "Export Template" to get a file with all available pools and teams pre-filled
            </p>
          </div>

          {/* Import Textarea */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Paste Schedule Data
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your schedule data here..."
              rows={12}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#dc2626',
                marginBottom: '8px'
              }}>
                Errors:
              </p>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '13px',
                color: '#dc2626'
              }}>
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

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
              onClick={handleParse}
              style={{
                flex: 1,
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Preview & Validate →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
