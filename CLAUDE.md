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
- **Tournament** → contains multiple Divisions
- **Division** → contains multiple Teams, assigned a color for UI differentiation
- **Team** → belongs to a Club and Division
- **Club** → has multiple Teams across divisions
- **Pool** → physical location where games are played
- **Game** → scheduled match between two teams (dark caps vs light caps)
- **Bracket** → playoff structure within a division

## Design Requirements

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


### Game Scheduling
- Default game slot: 55 minutes
- Configurable starting times per pool
- Support for breaks in schedule per pool
- Visual highlighting for semi-finals and finals
- Real-time conflict validation
- Set defaults for all games, but ability to edit on a per-game basis

### Score Entry and Updates
- Scores automatically update standings and bracket progression
- Team rankings update dynamically as scores are entered
- Bracket advancement determined by game outcomes

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
├── FRESH_START_CHECKLIST.md          # Setup instructions
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
├── firebase.json                     # Firebase config (TO BE CREATED)
├── firestore.rules                   # Security rules (TO BE CREATED)
├── firestore.indexes.json            # Database indexes (TO BE CREATED)
│
└── krakenscores-web/                # React app directory (TO BE CREATED)
    ├── package.json
    ├── vite.config.ts
    ├── .env.local                    # Firebase API keys (gitignored)
    ├── src/
    │   ├── main.tsx                  # App entry point
    │   ├── App.tsx                   # Root component + routing
    │   ├── lib/firebase.ts           # Firebase initialization
    │   ├── hooks/                    # Custom React hooks
    │   ├── contexts/                 # Auth & Tournament contexts
    │   ├── components/               # React components
    │   │   ├── ui/                   # shadcn/ui components
    │   │   ├── layout/               # Navbar, Sidebar, Footer
    │   │   └── shared/               # GameCard, StandingsTable, etc.
    │   ├── pages/
    │   │   ├── public/               # Public-facing pages
    │   │   └── admin/                # Admin-only pages
    │   ├── services/                 # Firebase CRUD operations
    │   ├── types/                    # TypeScript interfaces
    │   └── utils/                    # Helper functions
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

## Firebase Firestore Collections

```
/tournaments/{tournamentId}
/clubs/{clubId}
/divisions/{divisionId}
/teams/{teamId}
/pools/{poolId}
/games/{gameId}
/scheduleBreaks/{breakId}
/announcements/{announcementId}
/standings/{standingId}
/admins/{userId}
```

**Security Model:**
- All collections: Public read, admin write only
- Admin check: User must exist in `/admins/{uid}` collection
- Admins collection: Only readable by existing admins (manual setup required)

## Implementation Phases

**Phase 1: Foundation & Admin Setup** (Weeks 1-2)
- Firebase project setup and deployment
- Authentication system (email/password)
- Tournament, club, division, and team management (CRUD)

**Phase 2: Scheduling & Scoring** (Weeks 3-4)
- Pool management with breaks
- Game scheduling with conflict validation
- Score entry with real-time updates
- Automatic standings calculation

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

## Current Implementation Status

**Project Phase:** Phase 1 - In Progress

**Completed:**
- ✅ Project planning and requirements
- ✅ Technical specification (Firebase architecture)
- ✅ Design mockups in ref_images/
- ✅ Documentation (this file, TECHNICAL_SPEC_FIREBASE.md, FRESH_START_CHECKLIST.md)
- ✅ Firebase project setup (krakenscores-prod)
- ✅ React app with Vite + TypeScript + Tailwind CSS
- ✅ Authentication system (AuthContext, Login page, Protected routes)
- ✅ Admin Dashboard
- ✅ Tournament management (full CRUD with publish/unpublish)

**In Progress:**
- Club management (CRUD)
- Division management (CRUD)
- Team management (CRUD)

**Next Steps:**
1. Complete Phase 1: Club, Division, and Team management
2. Begin Phase 2: Pool and Game scheduling
3. Implement score entry and standings calculation

## Future Enhancements / Backlog

**UI/UX Improvements:**
- [ ] SVG logo upload component with automatic data URI conversion (for tournaments, clubs, divisions)
  - Current: Accepts URLs (including SVG URLs and data URIs)
  - Enhancement: Add drag-and-drop SVG upload that converts to data URI automatically
  - Benefits: Better performance, no external dependencies, embedded in database

**Phase 2+ Features:**
- [ ] Pool management with breaks
- [ ] Game scheduling with drag-and-drop
- [ ] Score entry interface
- [ ] Real-time standings updates
- [ ] Public-facing pages (master schedule, scores, standings)
- [ ] Bracket management
- [ ] Statistics pages
- [ ] Archive and export functionality

