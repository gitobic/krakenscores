# KrakenScores Technical Specification
## Firebase + JavaScript Clean-Sheet Implementation

**Version:** 2.1
**Last Updated:** 2025-10-13
**Target Architecture:** Firebase + Vite + React + TypeScript
**Purpose:** Complete rebuild specification for clean-sheet development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Firebase Configuration](#firebase-configuration)
5. [Data Model](#data-model)
6. [Security Rules](#security-rules)
7. [Application Structure](#application-structure)
8. [Feature Specifications](#feature-specifications)
9. [UI/UX Design System](#uiux-design-system)
10. [Deployment Strategy](#deployment-strategy)
11. [Development Workflow](#development-workflow)
12. [Testing Strategy](#testing-strategy)
13. [Migration & Data Import](#migration--data-import)

---

## Executive Summary

KrakenScores is a water polo tournament management system built for Team Orlando Water Polo Club. This specification outlines a complete rebuild using Firebase as the backend (database + hosting + auth) and Vite + React + TypeScript for the frontend, optimized for low-cost operation, volunteer maintenance, and mobile-first access.

**Key Constraints:**
- Budget: Free tier only (Firebase Spark Plan)
- Traffic: <100 concurrent users, 2 weekends per year
- Maintenance: Volunteer-level technical skills
- Primary Device: Mobile phones (iOS/Android)

**Key Features:**
- Admin backend for tournament setup, scheduling, and scoring
- Public frontend for real-time scores, schedules, and standings
- Mobile-first responsive design
- Offline capability for score entry
- Real-time updates using Firebase Realtime Database or Firestore

---

## Technology Stack

### Core Technologies

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Backend** | Firebase (Firestore + Auth + Hosting + Functions) | Free tier, real-time updates, zero server maintenance |
| **Build Tool** | Vite | Lightning-fast HMR, optimized builds, native ESM |
| **Frontend Framework** | React 18 + TypeScript | Component-based, large ecosystem, volunteer-friendly |
| **UI Components** | shadcn/ui + Radix UI | Beautiful, accessible, customizable components |
| **Styling** | Tailwind CSS | Utility-first, mobile-first, fast development |
| **State Management** | React Context + Firebase hooks | Simple, built-in, real-time Firebase integration |
| **Authentication** | Firebase Authentication | Simple email/password, free tier |
| **Database** | Cloud Firestore | Real-time updates, offline support, free tier (50K reads/day) |
| **Hosting** | Firebase Hosting | Free tier, global CDN, free SSL, custom domains |
| **Functions** | Firebase Cloud Functions | Background tasks (optional, 125K invocations/month free) |

### Additional Libraries

| Component | Technology | Use Case |
|-----------|-----------|----------|
| **Firebase SDK** | react-firebase-hooks | React hooks for Firebase (real-time listeners) |
| **Forms** | React Hook Form | Performant form validation |
| **Date/Time** | date-fns | Lightweight date manipulation |
| **Routing** | React Router v6 | Client-side routing |
| **Testing** | Vitest + React Testing Library | Unit and component tests |
| **E2E Testing** | Playwright | End-to-end testing |
| **Analytics** | Firebase Analytics | Free usage tracking |

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│             Firebase Hosting (Global CDN)                    │
│         https://krakenscores.web.app (FREE)                  │
│    OR https://scores.teamorlando.org (Custom Domain)         │
│                                                               │
│  ✓ Free SSL Certificate (HTTPS)                             │
│  ✓ Global CDN (fast worldwide)                              │
│  ✓ 10 GB bandwidth/month (free tier)                        │
│  ✓ No separate webserver needed!                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         React SPA (Vite Build Output: dist/)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Public Pages │  │ Admin Pages  │  │ UI Components│     │
│  │              │  │              │  │              │     │
│  │ - Home       │  │ - Setup      │  │ - shadcn/ui  │     │
│  │ - Scores     │  │ - Schedule   │  │ - Radix UI   │     │
│  │ - Schedules  │  │ - Score Entry│  │ - Cards      │     │
│  │ - Brackets   │  │ - Brackets   │  │ - Tables     │     │
│  │ - Stats      │  │ - Archive    │  │ - Forms      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│         Built with: Vite + React 18 + TypeScript             │
│         Styled with: Tailwind CSS + shadcn/ui                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Firebase SDK (runs in browser)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Module  │  │ Firestore SDK│  │ Storage SDK  │     │
│  │              │  │              │  │              │     │
│  │ + React      │  │ + React      │  │ (logo        │     │
│  │   hooks      │  │   hooks      │  │  uploads)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Backend (FREE)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Firestore DB │  │ Auth Service │  │ Cloud Storage│     │
│  │              │  │              │  │              │     │
│  │ Collections: │  │ Email/Pass   │  │ Tournament   │     │
│  │ - tournaments│  │ Admin roles  │  │ logos        │     │
│  │ - clubs      │  │              │  │              │     │
│  │ - divisions  │  │ Real-time    │  │ 5 GB free    │     │
│  │ - teams      │  │ listeners    │  │              │     │
│  │ - games      │  │              │  │              │     │
│  │ - pools      │  │              │  │              │     │
│  │              │  │              │  │              │     │
│  │ 50K reads/day│  │              │  │              │     │
│  │ 20K writes   │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │      Cloud Functions (Optional - FREE tier)      │       │
│  │  - calculateStandings()                          │       │
│  │  - generateBrackets()                            │       │
│  │  - exportTournamentData()                        │       │
│  │  125K invocations/month free                     │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Application Flow

```
User Flow 1: Public Viewer
1. User visits krakenscores.web.app
2. Firebase Hosting serves static HTML/JS/CSS (React SPA)
3. React app loads and initializes Firebase SDK
4. Firestore listeners attach to active tournament
5. Real-time updates stream to UI (no page refresh)

User Flow 2: Admin Score Entry
1. Admin navigates to /admin/scores
2. Firebase Auth checks authentication (React context)
3. If not logged in → redirect to /login
4. Admin enters score for Game #42
5. Firestore write updates games/gameId
6. Firestore listener triggers on all connected clients
7. Public pages update automatically (React re-renders)
8. Cloud Function (optional) recalculates standings
```

### Hosting & URLs

#### Default Firebase URL (Free)
```
Production URL: https://krakenscores.web.app
Preview URL:    https://krakenscores--preview-abc123.web.app

✓ Automatically provisioned
✓ Free SSL certificate (HTTPS)
✓ Global CDN included
✓ No configuration required
```

#### Custom Domain (Optional)
```
Custom URL: https://scores.teamorlando.org
      OR:   https://krakenscores.teamorlandowaterpolo.com

Setup Steps:
1. Purchase domain from GoDaddy (or any registrar)
2. Add domain in Firebase Console (Hosting > Add custom domain)
3. Update DNS records:
   - A Record: @ → 151.101.1.195
   - A Record: @ → 151.101.65.195
4. Firebase automatically provisions SSL certificate
5. Domain active in ~24 hours

✓ Free SSL certificate
✓ Same CDN performance
✓ Only cost: domain registration (~$12/year)
```

#### Deployment Workflow
```bash
# Local development (http://localhost:5173)
npm run dev

# Build production bundle
npm run build
# Creates optimized files in dist/ folder

# Deploy to Firebase Hosting
firebase deploy --only hosting
# Uploads dist/ to Firebase CDN

# Your site is now live!
# https://krakenscores.web.app
```

#### What You Give Out to Users
```
During tournament weekend, share:
🏐 KrakenScores Live Scores
📱 https://krakenscores.web.app

Or with custom domain:
📱 https://scores.teamorlando.org

Works on all devices:
✓ iPhone/iPad (Safari)
✓ Android (Chrome)
✓ Desktop (any browser)
✓ No app installation needed
```

#### Cost Breakdown
| Component | Provider | Monthly Cost | Annual Cost |
|-----------|----------|--------------|-------------|
| Frontend Hosting | Firebase | $0 | $0 |
| Database (Firestore) | Firebase | $0 | $0 |
| Authentication | Firebase | $0 | $0 |
| SSL Certificate | Firebase | $0 | $0 |
| Global CDN | Firebase | $0 | $0 |
| **Custom Domain** (optional) | GoDaddy/etc | $1 | **$12** |
| **Total** | | **$0-1** | **$0-12** |

**Note:** GoDaddy webserver is NOT needed. Firebase Hosting replaces it entirely.

---

## Firebase Configuration

### Project Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Select features:
# ✓ Firestore
# ✓ Functions (optional)
# ✓ Hosting
# ✓ Storage
# ✓ Authentication
```

### Firebase Configuration File

**firebase.json**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### Environment Variables

**.env.local** (gitignored - for local development)
```bash
# Firebase configuration (public API keys are safe in frontend)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=krakenscores.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=krakenscores
VITE_FIREBASE_STORAGE_BUCKET=krakenscores.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**src/lib/firebase.ts** (Firebase initialization)
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
```

**Note:** Firebase API keys are safe to commit to public repos, but we use `.env.local` for better configuration management.

---

## Data Model

### Firestore Collection Structure

```
/tournaments/{tournamentId}
  - name: string
  - logoUrl: string (Storage download URL)
  - startDate: timestamp
  - endDate: timestamp
  - defaultGameLengthMin: number (default: 55)
  - isActive: boolean
  - createdAt: timestamp
  - createdBy: string (uid)

/clubs/{clubId}
  - tournamentId: string (reference)
  - name: string
  - abbreviation: string
  - createdAt: timestamp

/divisions/{divisionId}
  - tournamentId: string (reference)
  - name: string (e.g., "10U Boys", "14U Girls")
  - colorHex: string (e.g., "#8dd3c7")
  - sortOrder: number
  - createdAt: timestamp

/teams/{teamId}
  - clubId: string (reference)
  - divisionId: string (reference)
  - name: string
  - bracketAssignment: string (e.g., "A", "B", "Gold", "Silver")
  - createdAt: timestamp

/pools/{poolId}
  - tournamentId: string (reference)
  - name: string (e.g., "Pool 1", "Deep End")
  - locationInfo: string (optional)
  - startTime: string (e.g., "08:00")
  - createdAt: timestamp

/games/{gameId}
  - tournamentId: string (reference)
  - divisionId: string (reference)
  - poolId: string (reference)
  - gameNumber: number
  - scheduledDate: timestamp
  - scheduledTime: string (e.g., "09:15")
  - teamDarkId: string (reference)
  - teamLightId: string (reference)
  - scoreDark: number (null if not played)
  - scoreLight: number (null if not played)
  - isSemifinal: boolean
  - isFinal: boolean
  - gameType: string ("pool_play", "semifinal", "final", "placement")
  - status: string ("scheduled", "in_progress", "completed")
  - updatedAt: timestamp
  - updatedBy: string (uid)

/scheduleBreaks/{breakId}
  - poolId: string (reference)
  - breakTime: string (e.g., "12:00")
  - durationMin: number
  - description: string (e.g., "Lunch Break")

/announcements/{announcementId}
  - tournamentId: string (reference)
  - message: string
  - priority: string ("info", "warning", "urgent")
  - createdAt: timestamp
  - isActive: boolean

/standings/{standingId} (computed/cached)
  - tournamentId: string
  - divisionId: string
  - teamId: string
  - wins: number
  - losses: number
  - ties: number
  - goalsFor: number
  - goalsAgainst: number
  - goalDifferential: number
  - rank: number
  - updatedAt: timestamp
```

### Firestore Indexes

**firestore.indexes.json**
```json
{
  "indexes": [
    {
      "collectionGroup": "games",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tournamentId", "order": "ASCENDING" },
        { "fieldPath": "scheduledDate", "order": "ASCENDING" },
        { "fieldPath": "scheduledTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "games",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tournamentId", "order": "ASCENDING" },
        { "fieldPath": "divisionId", "order": "ASCENDING" },
        { "fieldPath": "scheduledDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "standings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tournamentId", "order": "ASCENDING" },
        { "fieldPath": "divisionId", "order": "ASCENDING" },
        { "fieldPath": "rank", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Security Rules

### Firestore Security Rules

**firestore.rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Public read for all tournament data
    match /tournaments/{tournamentId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /clubs/{clubId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /divisions/{divisionId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /teams/{teamId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /pools/{poolId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /games/{gameId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /scheduleBreaks/{breakId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /standings/{standingId} {
      allow read: if true;
      allow write: if isAdmin(); // Written by Cloud Functions or admin
    }

    // Admin list (only admins can read/write)
    match /admins/{userId} {
      allow read: if isAdmin();
      allow write: if false; // Manual setup only
    }
  }
}
```

### Storage Security Rules

**storage.rules**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Tournament logos
    match /logos/{fileName} {
      allow read: if true;
      allow write: if request.auth != null &&
                      request.resource.size < 5 * 1024 * 1024 && // 5MB max
                      request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## Application Structure

### File Structure

```
kraken-scores-web/                   # NEW Vite + React project
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .env.local                       # Firebase config (gitignored)
├── .gitignore
│
├── public/                          # Static assets (copied to dist/)
│   ├── favicon.ico
│   └── manifest.json                # PWA manifest
│
├── src/
│   ├── main.tsx                     # App entry point
│   ├── App.tsx                      # Root component + routing
│   ├── index.css                    # Tailwind imports
│   │
│   ├── lib/
│   │   ├── firebase.ts              # Firebase initialization
│   │   └── utils.ts                 # Utility functions (cn, etc.)
│   │
│   ├── hooks/
│   │   ├── useAuth.ts               # Authentication hook
│   │   ├── useTournament.ts         # Active tournament hook
│   │   └── useFirestore.ts          # Firestore query hooks
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Auth state provider
│   │   └── TournamentContext.tsx    # Active tournament provider
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── form.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── shared/
│   │       ├── GameCard.tsx
│   │       ├── StandingsTable.tsx
│   │       ├── ColorPicker.tsx
│   │       └── FilterBar.tsx
│   │
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Home.tsx             # Master schedule
│   │   │   ├── Scores.tsx           # Scores & standings
│   │   │   ├── Schedules.tsx        # Pocket schedules
│   │   │   ├── Brackets.tsx         # Bracket status
│   │   │   └── Stats.tsx            # Fun stats
│   │   │
│   │   ├── admin/
│   │   │   ├── Setup.tsx            # Tournament setup
│   │   │   ├── Schedule.tsx         # Schedule builder
│   │   │   ├── ScoreEntry.tsx       # Score entry
│   │   │   └── BracketManage.tsx    # Bracket management
│   │   │
│   │   └── Login.tsx                # Login page
│   │
│   ├── services/
│   │   ├── tournaments.ts           # Tournament CRUD
│   │   ├── clubs.ts                 # Club CRUD
│   │   ├── divisions.ts             # Division CRUD
│   │   ├── teams.ts                 # Team CRUD
│   │   ├── games.ts                 # Game CRUD
│   │   ├── standings.ts             # Standings calculations
│   │   └── announcements.ts         # Announcements CRUD
│   │
│   ├── types/
│   │   ├── tournament.ts            # TypeScript interfaces
│   │   ├── team.ts
│   │   ├── game.ts
│   │   └── index.ts
│   │
│   └── utils/
│       ├── colors.ts                # Color palettes
│       ├── validation.ts            # Input validation
│       ├── formatting.ts            # Date/time formatting
│       └── calculations.ts          # Standings calculations
│
├── dist/                            # Build output (gitignored)
│   └── (built files deployed to Firebase)
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .firebaserc
│
└── functions/                       # Optional Cloud Functions
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts
    │   ├── standings.ts             # Auto-calculate standings
    │   ├── brackets.ts              # Generate bracket games
    │   └── export.ts                # Export tournament data
    └── lib/                         # Compiled functions (gitignored)
```

---

## Feature Specifications

### Phase 1: Foundation & Admin Setup (Weeks 1-2)

#### F1.1: Firebase Project Setup
- Create Firebase project
- Enable Firestore, Authentication, Hosting, Storage
- Configure security rules
- Deploy initial hosting

**Acceptance Criteria:**
- Firebase project created
- `firebase deploy` works successfully
- Static HTML served at `https://krakenscores.web.app`

#### F1.2: Authentication System
- Email/password authentication
- Login page UI
- Protected admin routes
- Session persistence
- Logout functionality

**Acceptance Criteria:**
- Admin can log in with email/password
- Non-authenticated users redirected to login when accessing `/admin/*`
- Session persists on page refresh
- Logout clears session

#### F1.3: Tournament Setup (Admin)
- Create new tournament form
- Upload tournament logo (Firebase Storage)
- Set tournament dates
- Configure game length
- Set active tournament
- View all tournaments

**Acceptance Criteria:**
- Admin can create tournament with all fields
- Logo uploads to Firebase Storage and displays correctly
- Only one tournament can be active at a time
- All tournaments visible in list

#### F1.4: Club Management (Admin)
- Add/edit/delete clubs
- Assign clubs to tournament
- Club abbreviations

**Acceptance Criteria:**
- CRUD operations work
- Clubs associated with correct tournament
- Cannot delete club with existing teams

#### F1.5: Division Management (Admin)
- Add/edit/delete divisions
- Assign colorblind-safe colors
- Sort order

**Acceptance Criteria:**
- Color picker shows predefined palettes
- Division colors display throughout app
- Cannot delete division with existing teams

#### F1.6: Team Management (Admin)
- Add/edit/delete teams
- Assign team to club + division
- Bulk import via CSV

**Acceptance Criteria:**
- Teams correctly associated with club and division
- CSV import creates multiple teams
- Team list filterable by division

---

### Phase 2: Scheduling & Scoring (Weeks 3-4)

#### F2.1: Pool Management (Admin)
- Add/edit/delete pools
- Set pool start times
- Add schedule breaks

**Acceptance Criteria:**
- Pools associated with tournament
- Start times in HH:MM format
- Breaks display in schedule

#### F2.2: Game Scheduling (Admin)
- Manual game creation form
- Assign teams to time slots
- Select pool and division
- Assign game numbers
- Mark semi-finals/finals
- Real-time conflict validation

**Acceptance Criteria:**
- Cannot schedule team at overlapping times
- Game numbers auto-increment
- Semi-finals/finals visually distinct

#### F2.3: Score Entry (Admin)
- Game list with filters
- Enter scores (dark vs light)
- Update game status
- Real-time updates to public pages

**Acceptance Criteria:**
- Score entry takes <30 seconds
- Public pages update within 2 seconds
- Invalid scores rejected (negative numbers)

#### F2.4: Standings Calculation
- Auto-calculate on score entry
- Wins, losses, ties
- Goals for/against
- Goal differential
- Rank by division

**Acceptance Criteria:**
- Standings update automatically
- Ties handled correctly (equal points, sorted by differential)
- Rankings correct across divisions

---

### Phase 3: Public Pages (Weeks 5-6)

#### F3.1: Master Schedule (Public)
- Chronological game list
- Division color-coding
- Filter by division/pool/date
- Real-time score updates
- Auto-refresh every 30 seconds

**Acceptance Criteria:**
- Mobile-responsive layout
- Loads in <2 seconds
- Auto-refresh works without page reload
- Filters persist on refresh

#### F3.2: Scores & Standings (Public)
- Completed games with scores
- Standings table by division
- Search by team/club
- Sort by wins/differential

**Acceptance Criteria:**
- Standings accurate
- Search returns correct results
- Mobile table scrolls horizontally

#### F3.3: Pocket Schedule (Public)
- Search by club or team
- Filtered schedule view
- Printable format

**Acceptance Criteria:**
- Search finds teams correctly
- Printable view (CSS media query)
- Includes all team games

#### F3.4: Announcements (Public)
- Display active announcements
- Priority levels (info/warning/urgent)
- Schedule status indicator

**Acceptance Criteria:**
- Announcements display on all public pages
- Urgent announcements highlighted
- Inactive announcements hidden

---

### Phase 4: Advanced Features (Weeks 7-8)

#### F4.1: Bracket Management (Admin)
- Auto-generate semi-finals
- Auto-generate finals
- Placement games (3rd/4th, 5th/6th)
- Manual bracket adjustments

**Acceptance Criteria:**
- Semi-finals use top 4 teams from pool play
- Finals auto-populate after semi-finals
- Placement games created correctly

#### F4.2: Bracket Status (Public)
- Visual bracket display
- Team progression
- Rankings (Gold, Silver, Bronze, 4th, etc.)

**Acceptance Criteria:**
- Brackets display correctly
- Updates in real-time
- Mobile-friendly layout

#### F4.3: Fun Stats (Public)
- Total goals by division/pool/club
- Average goals per game
- Top 5 teams (various metrics)

**Acceptance Criteria:**
- Stats calculations correct
- Updates as games complete
- Mobile-friendly charts/tables

#### F4.4: Archive & Export (Admin)
- Export tournament to JSON
- Download Firestore backup
- Generate summary PDF (optional)

**Acceptance Criteria:**
- JSON export includes all data
- Data can be reimported
- PDF includes key stats

---

## UI/UX Design System

### Color Palettes (Colorblind-Safe)

**Pastel Palette (12 colors)**
```javascript
const PASTEL_COLORS = [
  '#8dd3c7', '#ffffb3', '#bebada', '#fb8072',
  '#80b1d3', '#fdb462', '#b3de69', '#fccde5',
  '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'
];
```

**Bold Palette (12 colors)**
```javascript
const BOLD_COLORS = [
  '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c',
  '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00',
  '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'
];
```

**Wong Palette (20 colors)**
```javascript
const WONG_COLORS = [
  '#000000', '#FFFFFF', '#E69F00', '#56B4E9',
  '#009E73', '#F0E442', '#0072B2', '#D55E00',
  '#CC79A7', '#C1E6E5', '#564F94', '#88A18C',
  '#96AAC1', '#B8B58D', '#57A559', '#E6B081',
  '#1BF7AA', '#34FEF2', '#6D5224', '#EE95A8'
];
```

### Typography

```css
/* Tailwind defaults via CDN */
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
```

### Component Library

**Button**
```html
<!-- Primary button -->
<button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
  Save
</button>

<!-- Secondary button -->
<button class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded">
  Cancel
</button>
```

**Card**
```html
<div class="bg-white rounded-lg shadow-md p-4 mb-4">
  <h3 class="text-lg font-semibold mb-2">Game #42</h3>
  <p class="text-gray-600">10U Boys - Pool 1 - 2:30 PM</p>
</div>
```

**Table (Mobile-Responsive)**
```html
<div class="overflow-x-auto">
  <table class="min-w-full bg-white border border-gray-300">
    <thead class="bg-gray-100">
      <tr>
        <th class="px-4 py-2 text-left">Team</th>
        <th class="px-4 py-2 text-center">W</th>
        <th class="px-4 py-2 text-center">L</th>
      </tr>
    </thead>
    <tbody>
      <!-- Rows here -->
    </tbody>
  </table>
</div>
```

---

## Deployment Strategy

### Development Workflow

```bash
# 1. Local development
firebase emulators:start

# 2. Preview before deploy
firebase hosting:channel:deploy preview

# 3. Deploy to production
firebase deploy

# 4. Deploy only hosting
firebase deploy --only hosting

# 5. Deploy only rules
firebase deploy --only firestore:rules
```

### Environment Management

| Environment | Firebase Project | URL | Purpose |
|-------------|------------------|-----|---------|
| **Development** | krakenscores-dev | http://localhost:5000 | Local emulators |
| **Staging** | krakenscores-staging | staging.krakenscores.web.app | Pre-production testing |
| **Production** | krakenscores-prod | krakenscores.web.app | Live tournaments |

### Custom Domain Setup (Optional)

```bash
# Add custom domain in Firebase Console
# Example: krakenscores.teamorlandowaterpolo.com

# Update DNS records at GoDaddy
# A Record: @ → 151.101.1.195
# A Record: @ → 151.101.65.195
```

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/teamorlando/kraken_scores.git
cd kraken_scores

# 2. Navigate to web app directory
cd kraken-scores-web

# 3. Install dependencies
npm install

# 4. Install Firebase CLI globally
npm install -g firebase-tools

# 5. Login to Firebase
firebase login

# 6. Select Firebase project
firebase use krakenscores-prod

# 7. Create .env.local file with Firebase config
cat > .env.local << EOF
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=krakenscores.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=krakenscores
VITE_FIREBASE_STORAGE_BUCKET=krakenscores.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
EOF

# 8. Start development server
npm run dev
# App runs at http://localhost:5173
```

### Development Commands

```bash
# Start Vite dev server (React app with HMR)
npm run dev
# Runs at http://localhost:5173

# Start Firebase emulators (Firestore + Auth + Functions)
# Run in separate terminal
firebase emulators:start

# Build for production
npm run build
# Creates optimized bundle in dist/

# Preview production build locally
npm run preview

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules only
firebase deploy --only firestore:rules

# Deploy everything (hosting + rules + functions)
firebase deploy

# View logs
firebase functions:log
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "deploy": "npm run build && firebase deploy --only hosting"
  }
}
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/bracket-management

# Commit changes
git add .
git commit -m "Add bracket auto-generation"

# Push to remote
git push origin feature/bracket-management

# Merge to main (after review)
git checkout main
git merge feature/bracket-management
git push origin main

# Deploy production
firebase deploy
```

---

## Testing Strategy

### Manual Testing Checklist

**Admin Features**
- [ ] Create tournament
- [ ] Upload logo
- [ ] Add clubs, divisions, teams
- [ ] Create schedule
- [ ] Enter scores
- [ ] Generate brackets
- [ ] Export data

**Public Features**
- [ ] View master schedule
- [ ] View scores and standings
- [ ] Search pocket schedule
- [ ] View brackets
- [ ] View fun stats
- [ ] Auto-refresh works

**Mobile Testing**
- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Portrait orientation
- [ ] Landscape orientation
- [ ] Touch interactions work

### Performance Testing

```javascript
// Lighthouse audit
npm install -g lighthouse
lighthouse https://krakenscores.web.app --view

// Target scores:
// Performance: >90
// Accessibility: >95
// Best Practices: >90
// SEO: >90
```

### Load Testing (Optional)

```javascript
// Simulate 100 concurrent users
// Tools: Artillery, k6, or manual script
// Target: <2s page load under load
```

---

## Migration & Data Import

### From Existing System

**Step 1: Export Google Sheets**
- Download current schedule as CSV
- Download team rosters as CSV

**Step 2: Create Import Script**
```javascript
// public/js/utils/import.js
async function importTeamsFromCSV(csvData, tournamentId) {
  const lines = csvData.split('\n');
  const teams = lines.slice(1).map(line => {
    const [clubName, divisionName, teamName] = line.split(',');
    return { clubName, divisionName, teamName };
  });

  for (const team of teams) {
    // Create club if not exists
    // Create division if not exists
    // Create team
  }
}
```

**Step 3: Manual Data Entry**
- First tournament: enter data manually
- Second tournament: use import scripts

---

## Free Tier Limits & Monitoring

### Firebase Spark Plan Limits

| Service | Limit | Usage Estimate |
|---------|-------|----------------|
| **Firestore Reads** | 50,000/day | ~5,000/tournament (100 users × 50 reads) |
| **Firestore Writes** | 20,000/day | ~500/tournament (score entries) |
| **Firestore Storage** | 1 GB | <10 MB (text data only) |
| **Hosting** | 10 GB/month | <1 GB (static files) |
| **Storage** | 5 GB | <100 MB (logos) |
| **Cloud Functions** | 125K invocations/month | ~1,000 (if used) |

**Monitoring Strategy:**
```javascript
// Check quota usage
firebase projects:list
firebase firestore:usage
```

---

## Success Criteria

### Pre-Launch
- [ ] All Phase 1 features complete
- [ ] Mobile-responsive on iOS and Android
- [ ] Firebase security rules configured
- [ ] Admin user created
- [ ] Custom domain configured (optional)

### Post-Launch (After First Tournament)
- [ ] Zero downtime during tournament
- [ ] <2 second page load times
- [ ] Zero critical bugs
- [ ] Positive user feedback
- [ ] Data exported for archive

---

## Appendix

### Reference Documents
- Original PRD: `PRD.md`
- Project overview: `project.md`
- Design mockups: `ref_images/`

### External Resources
- Firebase Documentation: https://firebase.google.com/docs
- Tailwind CSS: https://tailwindcss.com
- Firestore Data Modeling: https://firebase.google.com/docs/firestore/data-model

### Contact
- Project Lead: Team Orlando Water Polo Club
- Developer: Volunteer team
- Repository: https://github.com/teamorlando/kraken_scores

---

**Document Version History:**
- v2.1 (2025-10-13): Updated to Vite + React + TypeScript stack with detailed hosting/URL documentation
- v2.0 (2025-10-13): Firebase clean-sheet specification
- v1.0 (2025-10-10): Original Python/Streamlit specification
