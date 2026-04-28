# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

KrakenScores is a water polo tournament scoring and tracking application for Team Orlando Water Polo Club. It replaces a manual Google Sheets-based system with a dedicated application for managing tournaments, scores, schedules, and team information.

**Key Context:**
- Low traffic: <100 concurrent users, used only twice a year (two weekends)
- Budget: Free/low-cost Firebase Spark Plan
- Tech stack: React 18 + TypeScript + Vite + Firebase
- Repo: git@github.com:gitobic/krakenscores.git
- Deployed: https://krakenscores.web.app

## Architecture

### Admin Backend
- Tournament setup and configuration
- Club, division, and team management
- Match scheduling with conflict validation
- Score management with automatic standings calculation
- Announcements management

### Public Frontend
- Mobile-first responsive design
- Master schedule view with filtering and sorting
- Scores and standings with real-time updates
- Team schedule (by club or team)
- Announcements display

## Domain Model

### Core Entities
- **Tournament** → contains Divisions, held at venue with multiple Pools
- **Division** → age/gender group (e.g., "12u CoEd"), has color-coded Teams
- **Club** → water polo organization with multiple Teams
- **Team** → belongs to Club and Division
- **Pool** → physical swimming pool location where Matches are held
- **Match** → scheduled water polo game between two teams at specific Pool and Time
- **Standing** → computed rankings within a division based on Match results
- **ScheduleBreak** → lunch breaks, ceremonies, etc. per pool
- **Announcement** → tournament updates with priority levels (low/normal/high)

### Key Relationships
- One tournament has many divisions, pools, teams, and matches
- Each match must have unique pool+time slot (no double-booking)
- Teams cannot play overlapping matches (conflict validation)
- Match scores trigger automatic standings recalculation

## Design System

### Typography
- Font family: `system-ui, -apple-system, sans-serif`
- Page titles: 30px bold, #111827
- Section headings: 20-24px semi-bold (600), #111827
- Body text: 13-14px, #6b7280
- Labels: 14px medium (500), #374151
- Table headers: 11px uppercase, 0.5px letter-spacing

### Color Palette
- Primary Blue: #2563eb (buttons, links)
- Dark Blue: #1d4ed8 (hover states)
- Slate: #475569 (dashboard tiles)
- Gray scale: #111827 (headings), #374151 (labels), #6b7280 (body), #d1d5db (borders), #f9fafb (backgrounds)
- Success Green: #16a34a
- Danger Red: #dc2626

### Component Patterns
- **Modals**: 672px-800px width, 90vh max-height, scrollable content
- **Buttons**: 8-10px vertical padding, 16-20px horizontal, 6px border radius
- **Tables**: Banded rows (alternating white/#f9fafb), sortable headers, 8px padding
- **Forms**: Two-column grids for related fields, 32px spacing between groups

### Division Colors (Color-Blind Safe)
| Division | Hex | Description |
|----------|-----|-------------|
| 12u CoEd | #8DD3C7 | Soft teal |
| 13u CoEd | #F0E442 | Bright yellow |
| 14u CoEd | #FDB462 | Warm peach-orange |
| 15u Boys | #6A3D9A | Deep violet |
| 16u Boys | #80B1D3 | Muted sky blue |
| 16u Girls | #CAB2D6 | Muted lavender |
| 18u Boys | #FB8072 | Coral red |
| 18u Girls | #B3DE69 | Yellow-green |
| 1st Place | #FFD700 | Gold |
| 2nd Place | #C0C0C0 | Silver |
| 3rd Place | #CD7F32 | Bronze |

*(27 total colors defined in color table - see ref_images/)*

## Tech Stack

- **Backend**: Firebase (Firestore + Auth + Hosting)
- **Frontend**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS + inline styles for consistency
- **State**: React Context API
- **Forms**: React Hook Form
- **Data**: react-firebase-hooks (real-time listeners)
- **Utilities**: date-fns

## Project Structure

```
krakenscores/
├── CLAUDE.md                         # This file
├── TECHNICAL_SPEC_FIREBASE.md        # Complete technical spec
├── ref_images/                       # Design mockups
├── firebase.json                     # Firebase config
├── firestore.rules                   # Security rules
└── krakenscores-web/                # React app
    ├── src/
    │   ├── components/
    │   │   ├── matches/              # Match components (refactored)
    │   │   │   ├── MatchModal.tsx
    │   │   │   ├── BulkImportModal.tsx
    │   │   │   └── MatchTable.tsx
    │   │   └── layout/               # Nav, Sidebar, Footer
    │   ├── pages/
    │   │   ├── admin/                # Admin CRUD pages
    │   │   └── public/               # Public pages
    │   ├── services/                 # Firebase CRUD operations
    │   ├── types/                    # TypeScript interfaces
    │   ├── utils/                    # Helpers and validation
    │   ├── hooks/                    # Custom React hooks
    │   └── contexts/                 # Auth & Tournament contexts
    └── dist/                         # Build output
```

## Development Commands

```bash
# Daily development
cd krakenscores-web
npm run dev                    # Dev server at http://localhost:5173

# Build and deploy
npm run build                  # Creates dist/
firebase deploy --only hosting # Deploy to Firebase

# Other
npm run lint
npm run type-check
firebase emulators:start       # Optional: Local Firestore testing
```

## Data Model

**See `/types/index.ts` for complete TypeScript interfaces.**

### Key Collections
```
/tournaments/{tournamentId}
/clubs/{clubId}
/divisions/{divisionId}
/teams/{teamId}
/pools/{poolId}
/matches/{matchId}
/scheduleBreaks/{breakId}
/announcements/{announcementId}
/standings/{divisionId}       # One document per division
/admins/{userId}
```

### Important Match Fields
- `matchNumber`: Sequential, unique across tournament
- `scheduledDate`: YYYY-MM-DD format
- `scheduledTime`: HH:MM format (24-hour)
- `status`: 'scheduled' | 'in_progress' | 'final' | 'forfeit' | 'cancelled'
- `roundType`: 'pool' | 'semi' | 'final' | 'placement'
- Scores support decimals for shootout notation (e.g., 4.5)

### Standings Tie-Breakers (in order)
1. Points (2 per win, no draws in water polo)
2. Head-to-head points (future)
3. Total goal differential
4. Total goals for
5. Fewest goals against
6. Alphabetical by team name

## Security Model

- **Public (unauthenticated)**: Read-only access to published tournaments, matches, standings, announcements
- **Admin (authenticated)**: Full CRUD on all collections
- **Staff (future)**: Limited scorekeeper access

## Current Status

**Phase:** Phase 3C Complete ✅

### Completed Features
✅ **Admin Pages** (All with consistent UI/UX)
- Dashboard with quick actions
- Tournaments, Clubs, Divisions, Teams, Pools
- Matches (with bulk import, conflict validation)
- Schedule Breaks (date-aware, conflict detection)
- Scorekeeper (inline score entry, auto-recalc standings)
- Standings (manual recalculate, tie-breakers)
- Announcements (sortable, scheduled time support)

✅ **Public Pages** (Mobile-first)
- Master Schedule (filtering, sorting, day grouping)
- Standings & Recent Results (search, filter)
- Team Schedule (by club or team)
- Announcements (priority color coding)

✅ **Architecture**
- Component refactoring (Matches.tsx: 1903 → 305 lines)
- Custom hooks for data loading and helpers
- Centralized validation utilities
- Consistent design system across all pages

### Next Steps (Phase 4)
- Bracket visualization (tournament tree)
- Fun stats page
- Drag-and-drop match rescheduling
- CSV export functionality
- Archive past tournaments

## Code Architecture Best Practices

### Refactoring Large Components
When a component exceeds 500 lines:
1. Extract modals to separate files
2. Extract table/list rendering to dedicated components
3. Create custom hooks for data loading
4. Centralize validation logic in utils/
5. Maintain TypeScript type safety

**Example:** Matches.tsx refactored from 1903 lines to 305 lines (84% reduction)
- Created: `MatchModal.tsx`, `BulkImportModal.tsx`, `MatchTable.tsx`
- Utilities: `useMatchData.ts`, `useMatchHelpers.ts`, `matchValidation.ts`
- Benefits: Reusability, testability, maintainability

### Styling Approach
- **Inline styles** for custom components (avoids Tailwind conflicts)
- **Tailwind classes** for layout (grid, flex, spacing)
- **Hover states** via React handlers (onMouseEnter/onMouseLeave)
- System font family throughout: `system-ui, -apple-system, sans-serif`

### Match Scheduling Validation
- No two matches in same pool at same time
- No team double-booking (overlapping matches)
- Schedule break conflict detection (date + time aware)
- All validation centralized in `utils/matchValidation.ts`

## Reference Files

- `ref_images/` - Design mockups and examples
- `TECHNICAL_SPEC_FIREBASE.md` - Complete technical specification
- `types/index.ts` - All TypeScript interfaces
- `firestore.rules` - Firebase security rules
