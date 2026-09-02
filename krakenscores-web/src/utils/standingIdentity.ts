const SEPARATOR = '__'

export function standingDocumentId(tournamentId: string, divisionId: string): string {
  return `${tournamentId}${SEPARATOR}${divisionId}`
}

export function divisionIdFromStandingDocument(documentId: string): string {
  return documentId.includes(SEPARATOR) ? documentId.slice(documentId.lastIndexOf(SEPARATOR) + SEPARATOR.length) : documentId
}
