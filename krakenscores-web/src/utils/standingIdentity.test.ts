import { describe, expect, it } from 'vitest'
import { divisionIdFromStandingDocument, standingDocumentId } from './standingIdentity'

describe('tournament-scoped standing identity', () => {
  it('keeps the same division independent across tournaments', () => {
    expect(standingDocumentId('fall-2026', '18u-boys')).not.toBe(standingDocumentId('spring-2030', '18u-boys'))
    expect(divisionIdFromStandingDocument(standingDocumentId('spring-2030', '18u-boys'))).toBe('18u-boys')
  })

  it('continues to read legacy division-only document ids', () => {
    expect(divisionIdFromStandingDocument('18u-boys')).toBe('18u-boys')
  })
})
