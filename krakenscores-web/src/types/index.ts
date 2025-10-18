// Core domain types for KrakenScores

export interface Tournament {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  logoUrl?: string;
  defaultMatchDuration: number; // Default match duration in minutes (e.g., 55, 60)
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
  tournamentId?: string; // Optional - teams can be created without tournament assignment
  clubId: string;
  divisionId: string;
  name: string; // e.g., "Orlando Black", "Tampa Blue"
  seedRank?: number; // Initial seeding (assigned when team is added to tournament)
  createdAt: Date;
  updatedAt: Date;
}

// Pool represents a physical swimming pool venue where matches are played.
// A tournament venue can have multiple pools (e.g., Pool 1, Pool 2, Pool 3).
// Teams from various divisions can compete in any pool at their assigned time.
// Only one match can be scheduled per pool at any given time.
export interface Pool {
  id: string;
  tournamentId?: string; // Optional - pools can be created without tournament assignment
  name: string; // e.g., "Pool A", "1", "Championship Pool"
  location: string; // Physical location description (e.g., "North End", "Main Competition Pool")
  defaultStartTime: string; // Default start time for matches in HH:MM format (e.g., "08:00")
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleBreak {
  id: string;
  tournamentId: string;
  poolId: string;
  startTime: string; // HH:MM format (24-hour)
  endTime: string; // HH:MM format (24-hour)
  reason: string; // e.g., "Lunch Break", "Awards Ceremony"
  createdAt: Date;
  updatedAt: Date;
}

// Match represents a scheduled water polo game between two teams.
// Matches can be pool play, semi-finals, finals, or placement games.
export interface Match {
  id: string;
  tournamentId: string;
  divisionId: string;
  poolId: string;

  // Scheduling
  matchNumber: number;
  scheduledDate: string; // YYYY-MM-DD format (e.g., "2025-01-15")
  scheduledTime: string; // HH:MM format (24-hour)
  duration: number; // Duration in minutes (default 55)
  venue?: string; // Optional explicit venue name

  // Teams
  darkTeamId: string;
  lightTeamId: string;

  // Scoring (optional until match is finalized)
  darkTeamScore?: number;
  lightTeamScore?: number;
  period?: number; // Current/final period (1-4 quarters)

  // Status
  status: 'scheduled' | 'in_progress' | 'final' | 'forfeit' | 'cancelled';

  // Bracket/Playoff Support
  roundType: 'pool' | 'semi' | 'final' | 'placement';
  bracketRef?: string; // "SF1", "SF2", "F", "3rd", "5th"
  feedsFrom?: {
    // For automatic bracket progression
    darkFrom?: {
      type: 'seed' | 'place' | 'winnerOf' | 'loserOf';
      value: string | number; // e.g., "SF1", 1, "Pool A 1st"
    };
    lightFrom?: {
      type: 'seed' | 'place' | 'winnerOf' | 'loserOf';
      value: string | number;
    };
  };

  // Flags (deprecated - use roundType instead, kept for backward compatibility)
  isSemiFinal: boolean;
  isFinal: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Standing represents the complete standings table for a division
// Stored as a single document per division: /standings/{divisionId}
export interface Standing {
  divisionId: string; // Document ID
  tournamentId: string;
  table: TeamStanding[]; // Sorted by rank
  tiebreakerNotes?: string[]; // Explanation of tie-break decisions
  updatedAt: Date;
}

// TeamStanding represents one team's record within a division's standings
export interface TeamStanding {
  teamId: string;
  teamName: string; // Denormalized for quick display
  games: number;
  wins: number;
  losses: number;
  draws: number; // Changed from "ties" to match CLAUDE.md
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number; // goalsFor - goalsAgainst
  points: number; // 2 per win, 1 per draw (configurable)
  rank: number; // Final rank with tie-breaks applied
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

export interface MatchWithDetails extends Match {
  division: Division;
  pool: Pool;
  darkTeam: TeamWithDetails;
  lightTeam: TeamWithDetails;
}

export interface TeamStandingWithDetails extends TeamStanding {
  team: TeamWithDetails;
}

export interface StandingWithDetails extends Standing {
  tableWithDetails: TeamStandingWithDetails[];
}
