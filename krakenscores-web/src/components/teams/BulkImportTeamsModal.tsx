import { useState } from 'react'
import type { Club, Division } from '../../types'
import { createTeam } from '../../services/teams'

interface BulkImportTeamsModalProps {
  clubs: Club[]
  divisions: Division[]
  onClose: () => void
  onImportComplete: () => void
}

interface ParsedTeam {
  clubAbbreviation: string
  divisionName: string
  teamName: string
  clubId?: string
  divisionId?: string
}

export default function BulkImportTeamsModal({
  clubs,
  divisions,
  onClose,
  onImportComplete
}: BulkImportTeamsModalProps) {
  const [csvText, setCsvText] = useState('')
  const [parsedTeams, setParsedTeams] = useState<ParsedTeam[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [importing, setImporting] = useState(false)

  const handleParse = () => {
    const errors: string[] = []
    const teams: ParsedTeam[] = []

    // Split by newlines and filter empty lines
    const lines = csvText.split('\n').filter(line => line.trim() !== '')

    // Skip header if present (check if first line contains "Club" or "Division")
    const startIndex = lines[0]?.toLowerCase().includes('club') ||
                      lines[0]?.toLowerCase().includes('division') ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Parse CSV (handle both comma and tab separators)
      const parts = line.includes('\t')
        ? line.split('\t').map(p => p.trim())
        : line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''))

      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: Invalid format. Expected: Club Abbreviation, Division Name`)
        continue
      }

      const [clubAbbr, divisionName] = parts

      // Find matching club (case-insensitive abbreviation match)
      const club = clubs.find(c =>
        c.abbreviation.toLowerCase() === clubAbbr.toLowerCase()
      )
      if (!club) {
        errors.push(`Line ${i + 1}: Club abbreviation "${clubAbbr}" not found`)
        continue
      }

      // Find matching division (case-insensitive name match)
      const division = divisions.find(d =>
        d.name.toLowerCase() === divisionName.toLowerCase()
      )
      if (!division) {
        errors.push(`Line ${i + 1}: Division "${divisionName}" not found`)
        continue
      }

      // Auto-generate team name: "Division Club"
      const autoTeamName = `${division.name} ${club.name}`

      teams.push({
        clubAbbreviation: clubAbbr,
        divisionName: divisionName,
        teamName: autoTeamName,
        clubId: club.id,
        divisionId: division.id
      })
    }

    setValidationErrors(errors)
    setParsedTeams(teams)

    if (errors.length === 0 && teams.length > 0) {
      setStep('preview')
    }
  }

  const handleConfirmImport = async () => {
    setImporting(true)
    const creationErrors: string[] = []

    for (const team of parsedTeams) {
      if (!team.clubId || !team.divisionId) {
        creationErrors.push(`Skipped team: ${team.teamName} (missing IDs)`)
        continue
      }

      try {
        await createTeam({
          clubId: team.clubId,
          divisionId: team.divisionId,
          name: team.teamName
        })
      } catch (error) {
        console.error('Error creating team:', error)
        creationErrors.push(`Failed to create team: ${team.teamName}`)
      }
    }

    setImporting(false)

    if (creationErrors.length > 0) {
      alert(`Import completed with ${creationErrors.length} error(s):\n\n${creationErrors.join('\n')}`)
    } else {
      alert(`Successfully imported ${parsedTeams.length} team${parsedTeams.length === 1 ? '' : 's'}!`)
    }

    onImportComplete()
  }

  const handleBack = () => {
    setStep('input')
    setValidationErrors([])
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
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
            Bulk Import Teams
          </h2>

          {step === 'input' && (
            <>
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af', marginBottom: '12px' }}>
                  📋 CSV Format Instructions
                </h3>
                <p style={{ fontSize: '14px', color: '#1e3a8a', marginBottom: '8px' }}>
                  Paste CSV data with two columns:
                </p>
                <code style={{ display: 'block', padding: '12px', backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace', marginBottom: '12px' }}>
                  Club Abbreviation, Division Name<br/>
                  TOWPC, 12u CoEd<br/>
                  ORL, 14u CoEd<br/>
                  TOWPC, 16u Boys
                </code>
                <ul style={{ fontSize: '13px', color: '#1e3a8a', marginLeft: '20px', marginTop: '8px' }}>
                  <li>Team names will be auto-generated as "Division Club" (e.g., "12u CoEd Team Orlando")</li>
                  <li>Club abbreviations must match existing clubs exactly</li>
                  <li>Division names must match existing divisions exactly</li>
                  <li>Header row is optional (will be auto-detected)</li>
                  <li>Supports both comma and tab separators</li>
                </ul>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  CSV Data *
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Club Abbreviation, Division Name&#10;TOWPC, 12u CoEd&#10;ORL, 14u CoEd"
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {validationErrors.length > 0 && (
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#991b1b', marginBottom: '12px' }}>
                    ⚠️ Validation Errors ({validationErrors.length})
                  </h3>
                  <ul style={{ fontSize: '13px', color: '#991b1b', marginLeft: '20px' }}>
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!csvText.trim()}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: csvText.trim() ? '#2563eb' : '#9ca3af',
                    color: 'white',
                    fontWeight: '500',
                    cursor: csvText.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Parse & Validate
                </button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                <p style={{ fontSize: '15px', color: '#166534', fontWeight: '500' }}>
                  ✅ Ready to import {parsedTeams.length} team{parsedTeams.length === 1 ? '' : 's'}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Teams to be created:</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>#</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Club</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Division</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Team Name (Auto-generated)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedTeams.map((team, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px' }}>{team.clubAbbreviation}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px' }}>{team.divisionName}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '500' }}>{team.teamName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={importing}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontWeight: '500',
                    cursor: importing ? 'not-allowed' : 'pointer',
                    opacity: importing ? 0.5 : 1
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: importing ? '#9ca3af' : '#16a34a',
                    color: 'white',
                    fontWeight: '500',
                    cursor: importing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {importing ? 'Importing...' : `Import ${parsedTeams.length} Team${parsedTeams.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
