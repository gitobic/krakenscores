import { useMemo, useState } from 'react'
import type { Match, Pool, Division, Team, Club, ScheduleBreak } from '../../types/index'
import { useMatchHelpers } from '../../hooks/useMatchHelpers'
import {
  checkPoolTimeConflict,
  checkTeamConflict,
  checkScheduleBreakConflict
} from '../../utils/matchValidation'

interface ScheduleGridProps {
  matches: Match[]
  pools: Pool[]
  divisions: Division[]
  teams: Team[]
  clubs: Club[]
  scheduleBreaks: ScheduleBreak[]
  onEdit: (match: Match) => void
  onMatchDrop?: (matchId: string, newPoolId: string, newTime: string) => void
}

interface TimeSlot {
  time: string
  matchesByPool: Record<string, Match | null>
  breaks: ScheduleBreak[]
}

interface DaySchedule {
  date: string
  timeSlots: TimeSlot[]
}

export default function ScheduleGrid({
  matches,
  pools,
  divisions,
  teams,
  clubs,
  scheduleBreaks,
  onEdit,
  onMatchDrop
}: ScheduleGridProps) {
  const { getDivisionName, getDivisionColor, getTeamAbbreviation } =
    useMatchHelpers(pools, divisions, teams, clubs)

  const [draggedMatch, setDraggedMatch] = useState<Match | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<{ poolId: string; time: string } | null>(null)

  // Generate day schedules from matches and schedule breaks
  const daySchedules = useMemo((): DaySchedule[] => {
    const dayMap = new Map<string, Map<string, TimeSlot>>()

    // Add all match times grouped by date
    matches.forEach(match => {
      const date = match.scheduledDate
      if (!dayMap.has(date)) {
        dayMap.set(date, new Map<string, TimeSlot>())
      }
      const daySlots = dayMap.get(date)!

      if (!daySlots.has(match.scheduledTime)) {
        daySlots.set(match.scheduledTime, {
          time: match.scheduledTime,
          matchesByPool: {},
          breaks: []
        })
      }
      const slot = daySlots.get(match.scheduledTime)!
      slot.matchesByPool[match.poolId] = match
    })

    // Add schedule breaks to each day
    // (Schedule breaks don't have dates, so they apply to all days)
    dayMap.forEach((daySlots) => {
      scheduleBreaks.forEach(breakItem => {
        if (!daySlots.has(breakItem.startTime)) {
          daySlots.set(breakItem.startTime, {
            time: breakItem.startTime,
            matchesByPool: {},
            breaks: []
          })
        }
        const slot = daySlots.get(breakItem.startTime)!
        slot.breaks.push(breakItem)
      })
    })

    // Convert to array and sort
    return Array.from(dayMap.entries())
      .map(([date, slotsMap]) => ({
        date,
        timeSlots: Array.from(slotsMap.values()).sort((a, b) =>
          a.time.localeCompare(b.time)
        )
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [matches, scheduleBreaks])

  // Check if a drop would create conflicts
  const wouldCreateConflict = (match: Match, newPoolId: string, newTime: string): string | null => {
    // Filter out the current match from validation
    const otherMatches = matches.filter(m => m.id !== match.id)

    // Check pool/date/time conflict
    const poolConflict = checkPoolTimeConflict(
      newPoolId,
      match.scheduledDate, // Keep same date when dragging
      newTime,
      match.duration,
      otherMatches
    )
    if (poolConflict) {
      return `Pool conflict with Match #${poolConflict.matchNumber}`
    }

    // Check team conflict
    const teamConflict = checkTeamConflict(
      match.darkTeamId,
      match.lightTeamId,
      match.scheduledDate, // Keep same date when dragging
      newTime,
      otherMatches
    )
    if (teamConflict) {
      return `Team conflict with Match #${teamConflict.conflict.matchNumber}`
    }

    // Check schedule break conflict
    const breakConflict = checkScheduleBreakConflict(
      newPoolId,
      newTime,
      match.duration,
      scheduleBreaks
    )
    if (breakConflict) {
      return `Conflicts with ${breakConflict.reason}`
    }

    return null
  }

  const handleDragStart = (match: Match) => {
    setDraggedMatch(match)
  }

  const handleDragOver = (e: React.DragEvent, poolId: string, time: string) => {
    e.preventDefault()
    setDragOverSlot({ poolId, time })
  }

  const handleDragLeave = () => {
    setDragOverSlot(null)
  }

  const handleDrop = (e: React.DragEvent, poolId: string, time: string) => {
    e.preventDefault()
    setDragOverSlot(null)

    if (!draggedMatch || !onMatchDrop) return

    // Check if position actually changed
    if (draggedMatch.poolId === poolId && draggedMatch.scheduledTime === time) {
      setDraggedMatch(null)
      return
    }

    // Validate the drop
    const conflict = wouldCreateConflict(draggedMatch, poolId, time)
    if (conflict) {
      alert(`Cannot move match: ${conflict}`)
      setDraggedMatch(null)
      return
    }

    // Execute the drop
    onMatchDrop(draggedMatch.id, poolId, time)
    setDraggedMatch(null)
  }

  const getMatchConflicts = (match: Match): string[] => {
    const otherMatches = matches.filter(m => m.id !== match.id)
    const conflicts: string[] = []

    // Check pool/date/time conflict
    const poolConflict = checkPoolTimeConflict(
      match.poolId,
      match.scheduledDate,
      match.scheduledTime,
      match.duration,
      otherMatches
    )
    if (poolConflict) {
      conflicts.push(`Pool conflict with Match #${poolConflict.matchNumber}`)
    }

    // Check team conflict
    const teamConflict = checkTeamConflict(
      match.darkTeamId,
      match.lightTeamId,
      match.scheduledDate,
      match.scheduledTime,
      otherMatches
    )
    if (teamConflict) {
      conflicts.push(`Team conflict with Match #${teamConflict.conflict.matchNumber}`)
    }

    // Check schedule break conflict
    const breakConflict = checkScheduleBreakConflict(
      match.poolId,
      match.scheduledTime,
      match.duration,
      scheduleBreaks
    )
    if (breakConflict) {
      conflicts.push(`Conflicts with ${breakConflict.reason}`)
    }

    return conflicts
  }

  if (pools.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No pools configured. Please create pools before scheduling matches.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 border-b border-gray-300" style={{ display: 'grid', gridTemplateColumns: `120px repeat(${pools.length}, 1fr)` }}>
        <div style={{ padding: '12px', fontWeight: '600', fontSize: '14px', borderRight: '1px solid #d1d5db' }}>
          Time
        </div>
        {pools.map(pool => (
          <div
            key={pool.id}
            style={{
              padding: '12px',
              fontWeight: '600',
              fontSize: '14px',
              borderRight: '1px solid #d1d5db',
              textAlign: 'center'
            }}
          >
            <div>{pool.name}</div>
            <div style={{ fontSize: '11px', fontWeight: '400', color: '#6b7280', marginTop: '4px' }}>
              {pool.location}
            </div>
          </div>
        ))}
      </div>

      {/* Day Schedules */}
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {daySchedules.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
            No matches scheduled. Schedule your first match to see it here.
          </div>
        ) : (
          daySchedules.map((daySchedule) => (
            <div key={daySchedule.date} style={{ marginBottom: '32px' }}>
              {/* Date Header */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#1f2937',
                color: 'white',
                fontWeight: '600',
                fontSize: '16px',
                borderBottom: '2px solid #374151',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                {(() => {
                  // Parse date as local to avoid timezone shift
                  const [year, month, day] = daySchedule.date.split('-').map(Number)
                  const localDate = new Date(year, month - 1, day)
                  return localDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })
                })()}
              </div>

              {/* Time Slots for this day */}
              {daySchedule.timeSlots.map((slot, index) => (
            <div
              key={slot.time}
              style={{
                display: 'grid',
                gridTemplateColumns: `120px repeat(${pools.length}, 1fr)`,
                borderBottom: '1px solid #e5e7eb',
                minHeight: '80px',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
              }}
            >
              {/* Time column */}
              <div
                style={{
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151',
                  borderRight: '1px solid #d1d5db',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {slot.time}
              </div>

              {/* Pool columns */}
              {pools.map(pool => {
                const match = slot.matchesByPool[pool.id]
                const breakForThisPool = slot.breaks.find(b => b.poolId === pool.id)
                const isDragOver = dragOverSlot?.poolId === pool.id && dragOverSlot?.time === slot.time
                const conflicts = match ? getMatchConflicts(match) : []
                const hasConflict = conflicts.length > 0

                return (
                  <div
                    key={pool.id}
                    style={{
                      padding: '8px',
                      borderRight: '1px solid #d1d5db',
                      position: 'relative',
                      backgroundColor: isDragOver ? '#dbeafe' : undefined,
                      transition: 'background-color 0.2s'
                    }}
                    onDragOver={(e) => handleDragOver(e, pool.id, slot.time)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, pool.id, slot.time)}
                  >
                    {breakForThisPool ? (
                      // Schedule Break
                      <div
                        style={{
                          padding: '8px',
                          backgroundColor: '#fef3c7',
                          border: '1px solid #fbbf24',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#92400e',
                          textAlign: 'center'
                        }}
                      >
                        🕐 {breakForThisPool.reason}
                        <div style={{ fontSize: '11px', marginTop: '2px', color: '#78350f' }}>
                          {breakForThisPool.startTime} - {breakForThisPool.endTime}
                        </div>
                      </div>
                    ) : match ? (
                      // Match Card
                      <div
                        draggable={!!onMatchDrop}
                        onDragStart={() => handleDragStart(match)}
                        onClick={() => onEdit(match)}
                        style={{
                          padding: '8px',
                          backgroundColor: getDivisionColor(match.divisionId),
                          border: hasConflict ? '2px solid #dc2626' : '1px solid #d1d5db',
                          borderRadius: '4px',
                          cursor: onMatchDrop ? 'grab' : 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: hasConflict ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : undefined
                        }}
                        onMouseEnter={(e) => {
                          if (!hasConflict) {
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = hasConflict ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : 'none'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#111827' }}>
                            Match #{match.matchNumber}
                          </span>
                          <span style={{ fontSize: '11px', color: '#374151' }}>
                            {getDivisionName(match.divisionId)}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
                          {getTeamAbbreviation(match.darkTeamId)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>vs</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                          {getTeamAbbreviation(match.lightTeamId)}
                        </div>
                        {(match.isSemiFinal || match.isFinal) && (
                          <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: '600', color: match.isFinal ? '#ca8a04' : '#2563eb' }}>
                            {match.isFinal ? '🏆 FINAL' : '🎯 SEMI-FINAL'}
                          </div>
                        )}
                        {hasConflict && (
                          <div
                            style={{
                              marginTop: '6px',
                              padding: '4px',
                              backgroundColor: '#fee2e2',
                              border: '1px solid #dc2626',
                              borderRadius: '3px',
                              fontSize: '10px',
                              color: '#991b1b',
                              fontWeight: '500'
                            }}
                            title={conflicts.join('\n')}
                          >
                            ⚠️ Conflict
                          </div>
                        )}
                      </div>
                    ) : (
                      // Empty slot
                      <div
                        style={{
                          height: '100%',
                          minHeight: '64px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#d1d5db',
                          fontSize: '12px'
                        }}
                      >
                        {isDragOver && '↓ Drop here'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderTop: '1px solid #d1d5db', fontSize: '12px', color: '#6b7280' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div>💡 <strong>Tip:</strong> {onMatchDrop ? 'Drag matches to reschedule' : 'Click matches to edit'}</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>🏆 Final</div>
            <div>🎯 Semi-Final</div>
            <div>⚠️ Conflict detected</div>
            <div>🕐 Schedule break</div>
          </div>
        </div>
      </div>
    </div>
  )
}
