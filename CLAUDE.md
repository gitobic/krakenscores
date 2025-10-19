# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KrakenScores is a water polo tournament scoring and tracking application for Team Orlando Water Polo Club. It replaces a manual Google Sheets-based system with a dedicated application for managing tournaments, scores, schedules, and team information.

**Key Context:**
- Low traffic: <100 concurrent users, used only twice a year (two weekends)
- Budget constraint: Free/low-cost solution required
- Technical level: Volunteer-maintained
- Available resources: Google Workspace (non-profit), GoDaddy webserver, Stripe payments, Firebase)
- Development is being done on local macOS with VSCode and working locally with ability to puth to GitHub repo 
- New Repo (public) has been created, git@github.com:gitobic/krakenscores.git
- Besure to set up gitignore and use .env to mask sensitive files (including API key and .DS_store)  
- Firebase has been setup on a "Spark" plan and api keys are held by the author

## Architecture

The application has two main components:

### Admin Backend
- Tournament setup and configuration (names, dates, logos, game slots, pool schedules)
- Club, division, and team management
- Schedule generation with calendar-based UI, drag-and-drop functionality, and conflict validation
- Score management with automatic standings and bracket progression
- Bracket management (automatic semi-finals/finals setup, team ranking: Gold, Silver, Bronze, 4th, 5th, etc.)
- Archive and export functionality

### Public Frontend
- Mobile-first responsive design (primary viewing platform)
- Master schedule view (game number, division, pool, time, teams with cap colors, scores)
- Scores and standings with real-time updates
- Search and filter (by club, team, division)
- "Pocket schedule" feature (schedules by club or team)
- Announcements area for game changes and schedule status
- Information area (facility info, merchandise links)
- Fun Stats page (total/average points by division, pool, club)
- Bracket Stats page (wins, rankings, goals for/against, goal difference)

## Domain Model

Key entities and their relationships:

### Core Hierarchy
- **Tournament** → held at a Venue, contains multiple Divisions
- **Venue** → physical location of the tournament, has multiple Pools
- **Division** → age/gender group (e.g., "12u CoEd"), contains multiple Teams, assigned a color for UI differentiation
- **Team** → belongs to a Club and Division
- **Club** → water polo organization, has multiple Teams across divisions

### Scheduling & Competition
- **Pool** → physical swimming pool location within a venue where matches are held
  - A venue can have 3+ pools (e.g., "Pool 1", "Pool 2", "Pool 3")
  - Each pool can host matches from any division
  - Time slots are critical: only one match per pool at a time
  - Pool scheduling prevents double-booking of physical space

- **Match** → scheduled water polo game between two teams (dark caps vs light caps)
  - Assigned to a specific Pool at a specific Time
  - Can be pool play, semi-final, final, or placement game
  - Teams from various divisions compete in their assigned pool at their assigned time

### Standings & Brackets
- **Standing** → computed rankings within a division based on match results
  - Wins, losses, draws, goals for/against, goal differential
  - Tie-breakers: points → head-to-head → goal diff → goals for
  - Recalculated when match scores are finalized

- **Bracket** → playoff/tournament structure for a division
  - Pool play → Semi-finals → Finals → Placement games
  - Automatic progression based on standings
  - Match feeds (e.g., "Winner of SF1 vs Winner of SF2")

## Design Requirements

### UI/UX Design System

**Phase 1 established a consistent design language across all admin pages:**

**Component Styling Approach:**
- **Inline Styles**: Primary method for custom components to avoid Tailwind CSS conflicts and ensure consistency
- **Tailwind Classes**: Used for layout utilities (grid, flex) and standard spacing
- **Hover States**: Implemented via React event handlers (onMouseEnter/onMouseLeave) for reliable cross-browser behavior

**Modal Design Pattern:**
- Fixed backdrop overlay (rgba(0, 0, 0, 0.5), z-index 9999)
- Modal container: 672px-800px width, 90vh max-height, centered
- Scrollable content area: Single div with `overflowY: 'scroll'` and `flexGrow: 1`
- All content (header, form fields, buttons) scrolls as one unit
- Form buttons in footer: Cancel (gray) and Submit (blue) with equal flex sizing

**Button Patterns:**
- **Navigation/Back buttons**: White background, gray border (#d1d5db), gray text (#374151), subtle hover to #f9fafb
- **Primary action buttons**: Blue background (#2563eb), white text, darkens to #1d4ed8 on hover
- **Secondary action buttons**: Green (#16a34a) for initialization/bulk actions
- **Danger buttons**: Red (#dc2626) for delete operations
- All buttons: 8-10px vertical padding, 16-20px horizontal, 6px border radius, 0.2s transitions

**Card/Tile Design:**
- Dashboard Quick Actions: Square tiles (aspect ratio 1:1), slate background (#475569), blue on hover
- Division Color Blocks: Square tiles showing division colors, lift animation on hover
- Compact sizing: 140-160px minimum width for optimal grid layout
- Icons: 36-48px for visual emphasis

**Form Layout:**
- Two-column grids for related fields (dates, club/division)
- 32px margin between field groups for clear visual separation
- Labels: 14px, font-weight 500, #374151
- Inputs: 16px font, 12-16px padding, 1px solid #d1d5db border, 6px border radius

**Typography:**
- Page titles: 30px, bold, #111827
- Section headings: 20-24px, semi-bold (600), #111827
- Card titles: 15-18px, semi-bold (600)
- Body text: 14-16px, #6b7280
- Labels: 14px, medium (500), #374151

**Color Palette (Beyond Division Colors):**
- Primary Blue: #2563eb (buttons, links, accents)
- Dark Blue: #1d4ed8 (hover states)
- Slate: #475569 (dashboard tiles)
- Gray scale: #111827 (headings), #374151 (labels), #6b7280 (body), #d1d5db (borders), #f9fafb (subtle backgrounds)
- Success Green: #16a34a (#15803d on hover)
- Danger Red: #dc2626

### Division Color Coding
Each division is assigned a color-blind safe color at setup, used consistently across all interfaces. The recommended colors are assigned below.  Extras are included as "to-be-assigned" for future needs.
| # | Division | Hex Code | Description |
|---|-----------|----------|-------------|
| 1 | 12u CoEd | `#8DD3C7` | Soft teal – calm and readable |
| 2 | 13u CoEd | `#F0E442` | Bright but gentle; contrasts nicely with both 12u Aqua and 14u Gold. Good transition color in the age spectrum. |
| 3 | 14u CoEd | `#FDB462` | Warm peach-orange high contrast |
| 4 | 15u Boys | `#6A3D9A` | Deep violet – rich, mature purple — gives strong visual contrast with younger divisions and differentiates from 16u Blue. |
| 5 | 16u Boys | `#80B1D3` | Muted sky blue |
| 6 | 16u Girls | `#CAB2D6` | Muted lavender – soft background |
| 7 | 18u Boys | `#FB8072` | Coral red (not overpowering) |
| 8 | 18u Girls | `#B3DE69` | Gentle yellow-green |
| 9 | 1st Place | `#FFD700` | True Gold – universal winner color, bright and high visibility |
| 10 | 2nd Place | `#C0C0C0` | Platinum Silver – neutral metallic tone for 2nd place |
| 11 | 3rd Place | `#CD7F32` | Bronze – warm earthy tone for 3rd place, readable with black text |
| 12 | Final / Championship Game | `#E69F00` | Royal Gold – championship tone, strong contrast as border or stripe |
| 13 | Mens Open | `#009E73` | Strong teal-green colorblind safe |
| 14 | Semi-Final Game | `#0072B2` | Electric Blue – border accent for semi-final games, crisp and visible |
| 15 | Womens Open | `#EE95A8` | Rosy pink – readable and friendly — distinct from lavender (16u Girls) and avoids confusion with coral (18u Boys). High contrast with black text. |
| 16 | to-be-assigned | `#FCCE5C` | Bright sunflower yellow |
| 17 | to-be-assigned | `#C1E6E5` | Light aqua (excellent legibility) |
| 18 | to-be-assigned | `#E6B081` | Warm beige-tan – good neutral |
| 19 | to-be-assigned | `#B8B58D` | Earthy olive-gray tone |
| 20 | to-be-assigned | `#56B4E9` | Vibrant but not harsh blue |
| 21 | to-be-assigned | `#D55E00` | Burnt orange – readable, distinct |
| 22 | to-be-assigned | `#CC79A7` | Magenta – vivid but still safe |
| 23 | to-be-assigned | `#33A02C` | Medium forest green |
| 24 | to-be-assigned | `#E31A1C` | Bold red – controlled brightness |
| 25 | to-be-assigned | `#FF7F00` | Bright orange (contrast booster) |
| 26 | to-be-assigned | `#57A559` | Greenish mint variant |
| 27 | to-be-assigned | `#96AAC1` | Dusty steel blue-gray |


### Match Scheduling
- Default match duration: 55 minutes (configurable per match)
- Configurable starting times per pool
- Support for schedule breaks per pool (lunch, ceremonies, etc.)
- Visual highlighting for semi-finals and finals
- Real-time conflict validation:
  - **Unique time slots**: No two matches can use the same pool at the same time
  - **No team double-booking**: A team cannot play in overlapping matches
  - **Division/pool constraints**: Only teams from appropriate divisions can be scheduled
- Set defaults for all matches, with per-match override capability

### Score Entry and Updates
- Scores entered when matches are finalized (not mid-game)
- Score entry triggers automatic standings recalculation
- Standings recalculation is efficient (~3 matches/hour complete)
- Team rankings update dynamically as scores are entered
- Bracket advancement determined by standings + match outcomes
- Match feeds auto-populate (e.g., "1st place Pool A" → Semi-final slot)

## Reference Materials

The `ref_images/` directory contains design mockups and current system examples:
- `01-MobileFriendly` [.pdf | .png]  - Mobile UI design reference
- `02-Scores` [.pdf | .png] - Scores page layout
- `03-Bracket_Status` [.pdf | .png] - Bracket standings view
- `04-FunStats` [.pdf | .png] - Statistics page design
- `05-Master` [.pdf | .png] - Master schedule layout
- `06-PocketSchedule` [.pdf | .png] - Pocket schedule feature
- `ref_2025-NOID-schedule-GoogleSheet.xlsx` - Current Google Sheets system
- `ref_PRD.md` - prior attempt at this app using streamlit and python. reference only

## Development Workflow

### Admin Workflow
1. Head coach logs into KrakenScores
2. Fills out tournament information
3. Assigns teams to brackets and pools
4. Creates schedule by assigning teams to time slots
5. Tournament admin publishes public-facing portion
6. Admin enters scores as games complete

## Technology Stack

**Backend & Hosting:**
- Firebase (Firestore + Auth + Hosting + Functions)
- Firebase Spark Plan (Free Tier)

**Frontend:**
- Vite (Build Tool)
- React 18 + TypeScript
- React Router v6 (Client-side routing)

**UI & Styling:**
- Tailwind CSS (Utility-first styling)
- shadcn/ui + Radix UI (Component library)

**State & Data:**
- React Context API (Global state)
- react-firebase-hooks (Real-time Firestore listeners)

**Forms & Utilities:**
- React Hook Form (Form validation)
- date-fns (Date manipulation)

**Testing:**
- Vitest + React Testing Library (Unit tests)
- Playwright (E2E tests)

## Project Structure

```
krakenscores/                         # Git repo root (CURRENT LOCATION)
├── CLAUDE.md                         # This file
├── TECHNICAL_SPEC_FIREBASE.md        # Complete technical specification
├── ref_images/                       # Design mockups and examples
│   ├── 01-MobileFriendly.{pdf,png}
│   ├── 02-Scores.{pdf,png}
│   ├── 03-Bracket_Status.{pdf,png}
│   ├── 04-FunStats.{pdf,png}
│   ├── 05-Master.{pdf,png}
│   ├── 06-PocketSchedule.{pdf,png}
│   ├── ref_2025-NOID-schedule-GoogleSheet.xlsx
│   └── ref_PRD.md
│
├── firebase.json                     # Firebase config
├── firestore.rules                   # Security rules
├── firestore.indexes.json            # Database indexes
│
└── krakenscores-web/                # React app directory
    ├── package.json
    ├── vite.config.ts
    ├── .env.local                    # Firebase API keys (gitignored)
    ├── src/
    │   ├── main.tsx                  # App entry point
    │   ├── App.tsx                   # Root component + routing
    │   ├── lib/firebase.ts           # Firebase initialization
    │   ├── hooks/                    # Custom React hooks
    │   │   ├── useMatchData.ts       # Match data loading hook
    │   │   └── useMatchHelpers.ts    # Helper functions (getPoolName, etc.)
    │   ├── contexts/                 # Auth & Tournament contexts
    │   ├── components/               # React components
    │   │   ├── ui/                   # shadcn/ui components
    │   │   ├── layout/               # Navbar, Sidebar, Footer
    │   │   ├── matches/              # Match management components
    │   │   │   ├── MatchModal.tsx    # Create/edit match form
    │   │   │   ├── BulkImportModal.tsx # CSV bulk import
    │   │   │   └── MatchTable.tsx    # Sortable match table
    │   │   └── shared/               # Shared components
    │   ├── pages/
    │   │   ├── public/               # Public-facing pages
    │   │   └── admin/                # Admin-only pages
    │   ├── services/                 # Firebase CRUD operations
    │   ├── types/                    # TypeScript interfaces
    │   └── utils/                    # Helper functions
    │       └── matchValidation.ts    # Match conflict validation logic
    └── dist/                         # Build output (deployed to Firebase)
```

## Development Commands

### Initial Setup (First Time Only)

```bash
# 1. Initialize git repository (if not already done)
git init
git remote add origin git@github.com:gitobic/krakenscores.git

# 2. Install Firebase CLI globally
npm install -g firebase-tools

# 3. Login to Firebase
firebase login
# Use: digitalkraken@teamorlandowpc.com

# 4. Initialize Firebase in project root
firebase init
# Select: Firestore, Hosting, Storage, Authentication
# Public directory: dist (important!)
# Single-page app: Yes

# 5. Create Vite + React + TypeScript app
npm create vite@latest krakenscores-web -- --template react-ts
cd krakenscores-web

# 6. Install dependencies
npm install
npm install firebase react-router-dom react-firebase-hooks react-hook-form date-fns
npm install -D @types/react-router-dom tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 7. Create .env.local with Firebase API keys (see TECHNICAL_SPEC_FIREBASE.md)
# NEVER commit .env.local - already in .gitignore

# 8. Create src/lib/firebase.ts initialization file
# (See TECHNICAL_SPEC_FIREBASE.md for complete code)
```

### Daily Development Workflow

```bash
# Start Vite dev server (React app with hot reload)
cd krakenscores-web
npm run dev
# Opens browser at http://localhost:5173

# In separate terminal: Start Firebase emulators (optional, for local testing)
firebase emulators:start
# Firestore UI: http://localhost:4000
# Firestore: localhost:8080
# Auth: localhost:9099
```

### Building and Deploying

```bash
# Build production bundle
cd krakenscores-web
npm run build
# Creates optimized files in dist/

# Preview production build locally
npm run preview

# Deploy to Firebase Hosting (from project root)
cd ..
firebase deploy --only hosting

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy everything
firebase deploy

# Live URL: https://krakenscores.web.app
```

### Common Tasks

```bash
# Type checking (no build)
npm run type-check

# Lint code
npm run lint

# Run tests
npm run test

# View Firebase logs
firebase functions:log

# Check Firestore usage
firebase firestore:usage
```

## Important File Locations

**Firebase Configuration:**
- `firebase.json` - Hosting, emulator config (project root)
- `firestore.rules` - Security rules (project root)
- `firestore.indexes.json` - Database indexes (project root)

**Environment Variables:**
- `krakenscores-web/.env.local` - Firebase API keys (NEVER commit)

**Key Source Files:**
- `krakenscores-web/src/lib/firebase.ts` - Firebase SDK initialization
- `krakenscores-web/src/contexts/AuthContext.tsx` - Authentication state
- `krakenscores-web/src/contexts/TournamentContext.tsx` - Active tournament state

## Data Model Reference

Complete TypeScript schemas for all Firestore collections. Use these exact schemas when creating or modifying types.

### Tournament
```typescript
interface Tournament {
  id: string
  name: string
  nickname?: string              // e.g., "NMI-2025", "Kraken Cup"
  startDate: Date
  endDate: Date
  location?: string              // Venue name
  logoUrl?: string
  status: 'draft' | 'active' | 'archived'
  published: boolean             // Controls public visibility
  createdAt: Date
  updatedAt: Date
}
```

### Division
```typescript
interface Division {
  id: string
  name: string                   // "12u CoEd", "18u Boys"
  colorHex: string               // Color-blind safe palette
  sortOrder: number
  tournamentId: string
  createdAt: Date
  updatedAt: Date
}
```

### Club
```typescript
interface Club {
  id: string
  name: string
  abbreviation: string           // <= 10 chars, uppercase
  logoUrl?: string
  website?: string
  createdAt: Date
  updatedAt: Date
}
```

### Team
```typescript
interface Team {
  id: string
  name: string
  clubId: string
  divisionId: string
  tournamentId: string
  abbreviation?: string
  seed?: number
  coachName?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

### Pool
```typescript
interface Pool {
  id: string
  name: string                   // "1", "2", "3" or "Pool A", "Pool B"
  location: string               // Physical location description
  tournamentId: string
  defaultStartTime?: string      // Default time for matches (HH:MM format)
  createdAt: Date
  updatedAt: Date
}
```

### Match (Renamed from Game)
```typescript
interface Match {
  id: string
  tournamentId: string
  divisionId: string
  poolId: string

  // Scheduling
  matchNumber: number            // Sequential, unique across tournament
  scheduledTime: string          // HH:MM format (24-hour)
  duration: number               // Minutes, default 55
  venue?: string                 // Optional explicit venue name

  // Teams
  darkTeamId: string
  lightTeamId: string

  // Scoring (optional until match is finalized)
  darkScore?: number
  lightScore?: number
  period?: number                // Current/final period (1-4 quarters)

  // Status
  status: 'scheduled' | 'in_progress' | 'final' | 'forfeit' | 'cancelled'

  // Bracket/Playoff Support
  roundType: 'pool' | 'semi' | 'final' | 'placement'
  bracketRef?: string            // "SF1", "SF2", "F", "3rd", "5th"
  feedsFrom?: {                  // For automatic bracket progression
    darkFrom?: {
      type: 'seed' | 'place' | 'winnerOf' | 'loserOf'
      value: string | number     // e.g., "SF1", 1, "Pool A 1st"
    }
    lightFrom?: {
      type: 'seed' | 'place' | 'winnerOf' | 'loserOf'
      value: string | number
    }
  }

  // Flags
  isSemiFinal: boolean
  isFinal: boolean

  createdAt: Date
  updatedAt: Date
}
```

### Standing
```typescript
interface Standing {
  divisionId: string             // Document ID
  tournamentId: string
  table: TeamStanding[]          // Sorted by rank
  tiebreakerNotes?: string[]     // Explanation of tie-break decisions
  updatedAt: Date
}

interface TeamStanding {
  teamId: string
  teamName: string               // Denormalized for quick display
  games: number
  wins: number
  losses: number
  draws: number                  // Always 0 - water polo has no draws (shootouts decide winner)
  goalsFor: number               // Supports decimals for shootout notation (e.g., 4.5)
  goalsAgainst: number           // Supports decimals for shootout notation (e.g., 4.6)
  goalDiff: number               // goalsFor - goalsAgainst (rounded to 2 decimals)
  points: number                 // 2 per win (no draws in water polo)
  rank: number                   // Final rank with tie-breaks applied
}
```

**Tie-breaker Order (applied in sequence):**
1. Points (win = 2, no draws in water polo)
2. Head-to-head points among tied teams (future implementation)
3. Total goal differential
4. Total goals for
5. Fewest goals against
6. Alphabetical by team name

### Schedule Break
```typescript
interface ScheduleBreak {
  id: string
  tournamentId: string
  poolId: string                 // Break applies to specific pool
  startTime: string              // HH:MM format
  endTime: string                // HH:MM format
  reason: string                 // "Lunch", "Opening Ceremony", etc.
  createdAt: Date
  updatedAt: Date
}
```

### Announcement
```typescript
interface Announcement {
  id: string
  tournamentId: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  expiresAt?: Date               // Auto-hide after this time
  createdAt: Date
  updatedAt: Date
}
```

## Firebase Firestore Collections

```
/tournaments/{tournamentId}
/clubs/{clubId}
/divisions/{divisionId}
/teams/{teamId}
/pools/{poolId}
/matches/{matchId}            # Renamed from /games
/scheduleBreaks/{breakId}
/announcements/{announcementId}
/standings/{divisionId}       # One standing document per division
/admins/{userId}
/staff/{userId}               # Scorekeeper role (future)
```

**Security Model:**
- **Public (unauthenticated)**: Read-only access to:
  - Tournaments (status = 'active' or 'published')
  - Divisions, Pools, Teams (limited fields)
  - Matches (status != 'cancelled')
  - Standings (all)
  - Announcements (all)

- **Staff (authenticated, role = 'staff')**: Public read + limited write:
  - Can update match scores (darkScore, lightScore fields only)
  - Can update match status (scheduled → in_progress → final)
  - Can update match period (1-4)
  - Cannot create/delete matches or modify teams/schedules

- **Admin (authenticated, role = 'admin')**: Full CRUD on all collections
  - Tournament setup, team management, scheduling
  - Score overrides and corrections
  - User role management

**Role Management:**
- Admin check: User must exist in `/admins/{uid}` collection with role = 'admin'
- Staff check: User must exist in `/staff/{uid}` collection with role = 'staff'
- Admins collection: Only readable by existing admins (manual setup via Firebase Console)

## Implementation Phases

**Phase 1: Foundation & Admin Setup** (Weeks 1-2)
- Firebase project setup and deployment
- Authentication system (email/password)
- Tournament, club, division, and team management (CRUD)

**Phase 2: Scheduling & Scoring** (Weeks 3-4)
- **Phase 2A: Refactoring** (Critical foundation work)
  - Rename Game → Match across entire codebase
  - Clarify Pool model (physical venue location)
  - Expand Match schema (roundType, bracketRef, feedsFrom, period, venue)
  - Create Standings collection and calculation logic
  - Update Firestore security rules for staff role
- **Phase 2B: Match Scheduling**
  - Match scheduling grid with conflict validation
  - Schedule breaks support
  - Bulk import improvements
- **Phase 2C: Scorekeeper & Standings**
  - Score entry interface
  - Automatic standings recalculation on score finalization
  - Match status workflow (scheduled → in_progress → final)

**Phase 3: Public Pages** (Weeks 5-6)
- Master schedule view (mobile-first)
- Scores & standings with search/filter
- Pocket schedule (search by club/team)
- Announcements display

**Phase 4: Advanced Features** (Weeks 7-8)
- Bracket management (auto-generate semi-finals/finals)
- Bracket status display
- Fun stats page
- Archive & export functionality

## Code Architecture & Best Practices

### Component Refactoring Pattern

**Context**: As the application grew, the Matches.tsx file became a 1903-line monolithic file that was difficult to maintain, test, and reason about. We applied a systematic refactoring pattern that can be reused for other large components.

**Refactoring Strategy:**
1. **Extract Modals**: Separate modal components into their own files
2. **Extract Tables/Lists**: Move complex table/list rendering to dedicated components
3. **Create Custom Hooks**: Consolidate data loading and helper functions
4. **Centralize Validation**: Move validation logic to utility modules
5. **Maintain Type Safety**: Preserve all TypeScript types and interfaces

**Example: Matches.tsx Refactoring**

**Before (1903 lines):**
```
Matches.tsx
├── Main component with all state (200 lines)
├── MatchModal component (600 lines)
├── BulkImportModal component (650 lines)
├── Table rendering logic (300 lines)
├── Sorting logic (50 lines)
├── Helper functions (100 lines)
└── Validation logic (100 lines)
```

**After (305 lines):**
```
Main orchestration: Matches.tsx (305 lines)

Components:
├── components/matches/MatchModal.tsx (632 lines)
├── components/matches/BulkImportModal.tsx (663 lines)
└── components/matches/MatchTable.tsx (304 lines)

Utilities:
├── hooks/useMatchData.ts (66 lines)
├── hooks/useMatchHelpers.ts (45 lines)
└── utils/matchValidation.ts (189 lines)
```

**Benefits Achieved:**
- ✅ **84% reduction** in main file size (1903 → 305 lines)
- ✅ **Reusability**: MatchModal can now be used in scorekeeper interface
- ✅ **Testability**: Each component can be unit tested independently
- ✅ **Maintainability**: Changes are isolated to specific concerns
- ✅ **Performance**: Better tree-shaking and code splitting potential
- ✅ **DRY Principle**: Validation logic centralized and reusable

**Key Files Created:**

1. **`useMatchData.ts`** - Custom hook for data loading
   - Loads all match-related data (matches, tournaments, pools, divisions, teams, clubs, schedule breaks)
   - Returns loading state and reload function
   - Consolidates 7 separate data fetching calls

2. **`useMatchHelpers.ts`** - Display helper functions
   - Memoized helper functions for formatting (getPoolName, getDivisionName, etc.)
   - Prevents recreating functions on every render
   - Centralized display logic

3. **`matchValidation.ts`** - Validation utilities
   - `validateMatch()` - Comprehensive match validation
   - `checkDuplicateMatchNumber()` - Match number conflicts
   - `checkPoolTimeConflict()` - Time/pool overlap detection
   - `checkTeamConflict()` - Team double-booking detection
   - `checkScheduleBreakConflict()` - Schedule break conflicts
   - `timeToMinutes()` / `minutesToTime()` - Time conversion utilities

**When to Apply This Pattern:**
- File exceeds 500 lines
- Multiple distinct concerns in one file
- Components have embedded sub-components
- Repeated validation or helper logic
- Difficult to find specific functionality

## Current Implementation Status

**Project Phase:** Phase 2C Complete - Ready for Phase 3 🎉

### ✅ Phase 1 Complete
- ✅ Project planning and requirements
- ✅ Technical specification (Firebase architecture)
- ✅ Design mockups in ref_images/
- ✅ Documentation (CLAUDE.md, TECHNICAL_SPEC_FIREBASE.md)
- ✅ Firebase project setup (krakenscores-prod)
- ✅ React app with Vite + TypeScript + Tailwind CSS
- ✅ Authentication system (AuthContext, Login page, Protected routes)
- ✅ Admin Dashboard with polished UI
- ✅ Tournament management (full CRUD with publish/unpublish)
- ✅ Club management (full CRUD with abbreviation support)
- ✅ Division management (full CRUD with color-blind safe color picker)
- ✅ Team management (full CRUD with club/division/tournament associations and tournament filtering)
- ✅ Pool management (full CRUD for physical pool locations)
- ✅ Match management (full CRUD with bulk import and schedule break integration)
- ✅ Schedule Breaks management (full CRUD with conflict detection)
- ✅ Consistent UI/UX design system across all admin pages

### ✅ Phase 2A Complete: Refactoring
**Goal**: Established solid foundation with proper architecture

**Completed Refactoring:**
- ✅ **R1**: Updated documentation with refactoring details
- ✅ **R2**: Renamed Game → Match throughout codebase
  - Files: `games.ts` → `matches.ts`
  - Types: `Game` → `Match`
  - Collections: `/games` → `/matches`
  - Variables: `game` → `match`, `gameNumber` → `matchNumber`
  - UI: "Schedule Game" → "Schedule Match"
- ✅ **R3**: Clarified Pool model (physical venue location)
- ✅ **R4**: Expanded Match schema with bracket/playoff fields
  - Added `roundType: 'pool' | 'semi' | 'final' | 'placement'`
  - Added `bracketRef?: string` (e.g., "SF1", "F", "3rdPlace")
  - Added `feedsFrom` for automatic bracket progression
  - Added `period?: number` for live scoring (1-4 quarters)
  - Added `venue?: string` for explicit venue name
- ✅ **R5**: Created Standings infrastructure (types and validation ready)
  - Added `/standings/{divisionId}` collection schema
  - Defined tie-breaker calculation logic
  - Ready for score finalization triggers
- ✅ **R6**: Component Architecture Refactoring (Matches.tsx)
  - **Before**: 1903-line monolithic file
  - **After**: Clean 305-line orchestration file (84% reduction)
  - **New Components**:
    - `MatchModal.tsx` (632 lines) - Create/edit match form
    - `BulkImportModal.tsx` (663 lines) - CSV import with validation
    - `MatchTable.tsx` (304 lines) - Sortable table component
  - **New Utilities**:
    - `useMatchData.ts` - Custom hook for data loading
    - `useMatchHelpers.ts` - Display helper functions
    - `matchValidation.ts` - Centralized validation logic
  - **Benefits**: Better maintainability, reusability, testability
- ✅ **R7**: Updated Firestore security rules for staff role
- ✅ **R8**: Tested all functionality - build succeeds (856KB bundle)

**Phase 1 UI Design Patterns Established:**
- **Modal Pattern**: 672px-800px width, scrollable content area, inline styles for consistency
- **Navigation Buttons**: Pill-style back buttons with gray borders and hover effects
- **Action Buttons**: Blue primary buttons with consistent hover states and shadows
- **Card Layout**: Square aspect ratio tiles for dashboard and divisions (compact, space-efficient)
- **Form Layout**: Two-column grids for related fields, generous spacing, clear labels
- **Color System**: Tailwind-based grays, blues for primary actions, greens for success states
- **Smart Filtering**: Tournament selector filters table and pre-fills forms
- **Bulk Import**: Two-step validation with preview/confirmation screen

### ✅ Phase 2B Complete: Match Scheduling
- ✅ Schedule breaks support (full CRUD)
- ✅ Schedule break conflict detection integrated into match scheduling
- ✅ Component architecture refactoring for better maintainability
- ⏭️ Match scheduling grid/calendar view with drag-and-drop (deferred to Phase 4)
- ⏭️ Visual conflict indicators in schedule view (deferred to Phase 4)
- ⏭️ Match bulk operations (copy, move, delete multiple) (deferred to Phase 4)

### ✅ Phase 2C Complete: Scorekeeper & Standings
**Goal**: Enable score entry and automatic standings calculation

**Completed Features:**
- ✅ **Scorekeeper Interface** (`/admin/scorekeeper`)
  - Full table layout with inline score entry (one row per match)
  - Tournament filter with day-based date grouping
  - Sortable columns (Match #, Pool, Division, Time, Teams, Scores, Status)
  - Compact "cozy" design for viewing many matches on mobile
  - Score entry supports decimal notation for shootouts (e.g., 4.5 = 4 regular + 5 shootout)
  - Team abbreviation display with toggle for full club names
  - Status workflow: scheduled → in_progress → final → forfeit/cancelled
  - Automatic standings recalculation on status change to 'final'
  - Split date/time columns for better mobile readability
  - Centered text alignment with system-ui font family
  - Mobile-first responsive design

- ✅ **Automatic Standings Recalculation**
  - Triggers when match status changes to 'final'
  - Integrated into Scorekeeper save operation
  - Uses existing `recalculateStandingsForDivision()` service
  - Immediate standings update after score finalization
  - Handles decimal scores correctly (shootout notation)

- ✅ **Standings Display Page** (`/admin/standings`)
  - Division-by-division standings tables
  - Tournament filtering
  - Manual recalculate button per division
  - Comprehensive stats: GP, W, L, GF, GA, GD, Pts (no draws column - water polo specific)
  - Tie-breaker notes display
  - Color-coded division headers
  - Legend with tie-breaker order explanation
  - Floating-point precision fix (rounds to 2 decimals)

- ✅ **Standings Calculation Service**
  - Pure function for testability
  - Water polo specific: No draws, all matches decided (shootouts if tied)
  - Points calculation: 2 per win (no draw points)
  - Tie-breaker logic (points → goal diff → goals for → goals against → alphabetical)
  - Head-to-head calculation function (reserved for future enhancement)
  - Automatic rank assignment with tie detection
  - Floating-point precision handling (rounds goals and differentials to 2 decimals)

- ✅ **Mobile UX Improvements**
  - Moved bulk action buttons (Delete All, Bulk Import) below tables on Teams and Matches pages
  - Prevents accidental clicks near "Back to Dashboard" button
  - Removed Export Template button from Matches (instructions included in import modal)
  - Vite dev server configured to listen on LAN (host: '0.0.0.0') for mobile testing

- ✅ **Security & Permissions**
  - Staff role can update: darkTeamScore, lightTeamScore, status
  - Staff cannot create/delete/modify teams or schedules
  - Admin has full access
  - Public read access to standings

- ✅ **Dashboard Integration**
  - New "Scorekeeper" quick action card (🎯 icon)
  - Existing "Standings" quick action card
  - Routes configured in App.tsx

- ✅ **Build Success**: Tested on mobile device over LAN, all features working

### ⏭️ Phase 3: Public Pages
1. Master schedule view (mobile-first)
2. Live scores & standings with search/filter
3. Pocket schedule (by club/team)
4. Announcements display

## Future Enhancements / Backlog

**Code Quality & Architecture:**
- ✅ Component refactoring (Matches.tsx: 1903 → 305 lines)
- [ ] Apply similar refactoring to other large admin pages
- [ ] Add unit tests for validation utilities
- [ ] Add integration tests for match scheduling flows

**UI/UX Improvements:**
- [ ] SVG logo upload component with automatic data URI conversion (for tournaments, clubs, divisions)
  - Current: Accepts URLs (including SVG URLs and data URIs)
  - Enhancement: Add drag-and-drop SVG upload that converts to data URI automatically
  - Benefits: Better performance, no external dependencies, embedded in database
- [ ] Drag-and-drop match rescheduling in calendar view
- [ ] Visual timeline/gantt chart for match schedules per pool

**Phase 2+ Features:**
- ✅ Schedule breaks per pool (lunch, ceremonies)
- ✅ Schedule break conflict detection
- [ ] Advanced conflict detection UI with visual indicators
- [ ] Match feeds auto-population for brackets
- [ ] Public-facing pages (master schedule, live scores, standings)
- [ ] Bracket visualization (tournament tree)
- [ ] Statistics pages (fun stats, historical data)
- [ ] CSV export for matches and standings
- [ ] Archive functionality (past tournaments)

