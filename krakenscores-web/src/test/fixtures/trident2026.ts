export type FixtureParticipantSource =
  | { type: 'seed'; group: string; rank: number }
  | { type: 'winnerOf'; matchId: string }
  | { type: 'loserOf'; matchId: string }

export interface ProgressionFixtureMatch {
  id: string
  matchNumber: number
  division: string
  purpose: string
  dark: FixtureParticipantSource
  light: FixtureParticipantSource
}

const matchId = (matchNumber: number) => `trident-2026-g${matchNumber}`

export const trident2026Girls16uProgression: ProgressionFixtureMatch[] = [
  { id: matchId(52), matchNumber: 52, division: '16u Girls', purpose: 'play-in', dark: { type: 'seed', group: 'F', rank: 2 }, light: { type: 'seed', group: 'G', rank: 3 } },
  { id: matchId(54), matchNumber: 54, division: '16u Girls', purpose: 'play-in', dark: { type: 'seed', group: 'G', rank: 2 }, light: { type: 'seed', group: 'F', rank: 3 } },
  { id: matchId(69), matchNumber: 69, division: '16u Girls', purpose: 'semifinal', dark: { type: 'seed', group: 'F', rank: 1 }, light: { type: 'winnerOf', matchId: matchId(52) } },
  { id: matchId(72), matchNumber: 72, division: '16u Girls', purpose: 'semifinal', dark: { type: 'seed', group: 'G', rank: 1 }, light: { type: 'winnerOf', matchId: matchId(54) } },
  { id: matchId(73), matchNumber: 73, division: '16u Girls', purpose: 'fifth-place', dark: { type: 'loserOf', matchId: matchId(52) }, light: { type: 'loserOf', matchId: matchId(54) } },
  { id: matchId(84), matchNumber: 84, division: '16u Girls', purpose: 'championship', dark: { type: 'winnerOf', matchId: matchId(69) }, light: { type: 'winnerOf', matchId: matchId(72) } },
  { id: matchId(88), matchNumber: 88, division: '16u Girls', purpose: 'third-place', dark: { type: 'loserOf', matchId: matchId(69) }, light: { type: 'loserOf', matchId: matchId(72) } },
]

export const trident2026SeedTierExamples: ProgressionFixtureMatch[] = [
  { id: matchId(66), matchNumber: 66, division: '14u CoEd', purpose: 'first-place tier', dark: { type: 'seed', group: 'C', rank: 1 }, light: { type: 'seed', group: 'D', rank: 1 } },
  { id: matchId(75), matchNumber: 75, division: '14u CoEd', purpose: 'first-place tier', dark: { type: 'seed', group: 'D', rank: 1 }, light: { type: 'seed', group: 'E', rank: 1 } },
  { id: matchId(86), matchNumber: 86, division: '14u CoEd', purpose: 'first-place tier', dark: { type: 'seed', group: 'C', rank: 1 }, light: { type: 'seed', group: 'E', rank: 1 } },
  { id: matchId(78), matchNumber: 78, division: '16u Boys', purpose: 'first-place crossover', dark: { type: 'seed', group: 'H', rank: 1 }, light: { type: 'seed', group: 'J', rank: 1 } },
  { id: matchId(56), matchNumber: 56, division: '18u Boys', purpose: 'first-place tier', dark: { type: 'seed', group: 'M', rank: 1 }, light: { type: 'seed', group: 'O', rank: 1 } },
]

