import { describe, expect, it } from 'vitest'
import { sortBreaksChronologically, sortMatchesChronologically, sortPoolsByName, sortTeamsByName } from './collectionOrdering'

describe('client-side Firestore result ordering', () => {
  it('orders matches by date, time, then public game number', () => {
    const matches = [
      { scheduledDate: '2030-03-09', scheduledTime: '07:05', matchNumber: 14 },
      { scheduledDate: '2030-03-08', scheduledTime: '16:00', matchNumber: 2 },
      { scheduledDate: '2030-03-08', scheduledTime: '16:00', matchNumber: 1 },
    ]
    expect(sortMatchesChronologically(matches).map(match => match.matchNumber)).toEqual([1, 2, 14])
  })

  it('orders teams and pools by their display names', () => {
    expect(sortTeamsByName([{ name: 'Tampa' }, { name: 'Barcelona' }]).map(item => item.name)).toEqual(['Barcelona', 'Tampa'])
    expect(sortPoolsByName([{ name: 'Pool 3' }, { name: 'Pool 1' }]).map(item => item.name)).toEqual(['Pool 1', 'Pool 3'])
  })

  it('orders schedule breaks by date and start time', () => {
    const breaks = [
      { scheduledDate: '2030-03-09', startTime: '15:20' },
      { scheduledDate: '2030-03-08', startTime: '18:00' },
    ]
    expect(sortBreaksChronologically(breaks)).toEqual([breaks[1], breaks[0]])
  })
})
