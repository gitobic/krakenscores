import { describe, expect, it } from 'vitest'
import { accessibleTextColor, contrastRatio } from './colorContrast'

const divisionColors = ['#F0E442', '#8DD3C7', '#CAB2D6', '#E69F00', '#6A3D9A', '#56B4E9', '#CC79A7', '#D55E00', '#009E73', '#0072B2', '#B3DE69', '#EE95A8']

describe('division color contrast', () => {
  it.each(divisionColors)('%s has WCAG AA text contrast', background => {
    expect(contrastRatio(background, accessibleTextColor(background))).toBeGreaterThanOrEqual(4.5)
  })

  it('uses white text on the darkest division colors', () => {
    expect(accessibleTextColor('#0072B2')).toBe('#ffffff')
  })
})
