# KrakenScores

A water polo tournament scoring and tracking application for Team Orlando Water Polo Club.

## Live App

**https://krakenscores-prod.web.app**

## Overview

KrakenScores replaces a manual Google Sheets-based system with a dedicated web application for managing tournaments, scores, schedules, and team information. It provides real-time score updates, a mobile-first public interface, and an admin backend for tournament staff.

## Features

- **Admin Backend** — Tournament setup, club/team/pool management, match scheduling with conflict detection, score entry, standings, and announcements
- **Public Frontend** — Mobile-optimized schedule, live scores, standings, team schedule, announcements, and bracket views
- **Real-time Updates** — Firestore listeners push score and schedule changes instantly to all viewers
- **Automated Standings** — Win/loss points, goal differential, and multi-level tie-breakers calculated automatically

## Technology Stack

- **Backend & Hosting:** Firebase (Firestore, Auth, Hosting)
- **Frontend:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + inline styles
- **State:** React Context + react-firebase-hooks

## Project Status

**Current Phase: Phase 3D Complete**

- ✅ Full admin CRUD (tournaments, clubs, divisions, teams, pools, matches, schedule breaks, standings, announcements)
- ✅ Public pages (schedule, standings, team schedule, announcements, brackets)
- ✅ Admin sidebar layout
- ✅ Match conflict validation
- ✅ Deployed to Firebase Hosting

**Up Next (Phase 4):** Bracket visualization, fun stats, drag-and-drop scheduling, CSV export

## Local Development

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`

### Setup

1. **Clone the repo**
   ```bash
   git clone git@github.com:gitobic/krakenscores.git
   cd krakenscores
   ```

2. **Create Firebase config file** — this file is gitignored and must be created manually:
   ```bash
   # krakenscores-web/.env.local
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```
   Get these values from the [Firebase Console](https://console.firebase.google.com) under Project Settings → Your Apps.

3. **Install dependencies and start dev server**
   ```bash
   cd krakenscores-web
   npm install
   npm run dev
   ```
   App runs at http://localhost:5173

### Deploy

```bash
# Re-authenticate if needed
firebase login --reauth

# Build and deploy
cd krakenscores-web && npm run build
cd .. && firebase deploy --only hosting
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — Full developer guide: architecture, design system, data model, commands
- **[PRD.md](PRD.md)** — Product requirements and user stories
- **[TECHNICAL_SPEC_FIREBASE.md](TECHNICAL_SPEC_FIREBASE.md)** — Technical architecture details

## License

Private project for Team Orlando Water Polo Club.
