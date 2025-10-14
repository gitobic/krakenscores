// Core domain types for KrakenScores

export interface Tournament {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  logoUrl?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Division {
  id: string;
  name: string; // e.g., "12u CoEd", "16u Boys"
  colorHex: string; // Color-blind safe color from CLAUDE.md
  createdAt: Date;
  updatedAt: Date;
}

export interface Club {
  id: string;
  name: string;
  abbreviation: string; // e.g., "TOWPC", "ORL"
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  tournamentId: string;
  clubId: string;
  divisionId: string;
  name: string; // e.g., "Orlando Black", "Tampa Blue"
  seedRank?: number; // Initial seeding
  createdAt: Date;
  updatedAt: Date;
}

export interface Pool {
  id: string;
  tournamentId: string;
  name: string; // e.g., "Pool A", "Championship Pool"
  location: string; // Physical location
  defaultStartTime: string; // Default start time for games in this pool
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleBreak {
  id: string;
  poolId: string;
  startTime: string;
  endTime: string;
  reason: string; // e.g., "Lunch Break", "Awards Ceremony"
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  tournamentId: string;
  divisionId: string;
  poolId: string;
  gameNumber: number;
  scheduledTime: string;
  duration: number; // Duration in minutes (default 55)
  darkTeamId: string;
  lightTeamId: string;
  darkTeamScore?: number;
  lightTeamScore?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  isSemiFinal: boolean;
  isFinal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Standing {
  id: string;
  tournamentId: string;
  divisionId: string;
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number; // Calculated: wins * 3 + ties * 1
  rank: number;
  updatedAt: Date;
}

export interface Announcement {
  id: string;
  tournamentId: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admin {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: 'super_admin' | 'tournament_admin';
  createdAt: Date;
  updatedAt: Date;
}

// Helper types for UI
export interface TeamWithDetails extends Team {
  club: Club;
  division: Division;
}

export interface GameWithDetails extends Game {
  division: Division;
  pool: Pool;
  darkTeam: TeamWithDetails;
  lightTeam: TeamWithDetails;
}

export interface StandingWithDetails extends Standing {
  team: TeamWithDetails;
}
