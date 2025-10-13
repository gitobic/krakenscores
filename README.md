# KrakenScores

A water polo tournament scoring and tracking application for Team Orlando Water Polo Club.

## Overview

KrakenScores replaces a manual Google Sheets-based system with a dedicated web application for managing tournaments, scores, schedules, and team information. The application provides real-time score updates, mobile-first design, and automated standings calculations.

## Key Features

- **Admin Backend** - Tournament setup, scheduling, score entry, and bracket management
- **Public Frontend** - Real-time scores, mobile-optimized schedules, standings, and statistics
- **Real-time Updates** - Scores update across all devices instantly
- **Mobile-First Design** - Optimized for viewing at poolside on smartphones
- **Automated Calculations** - Standings, rankings, and bracket progression calculated automatically

## Technology Stack

- **Backend & Hosting:** Firebase (Firestore, Auth, Hosting, Functions)
- **Frontend:** Vite + React 18 + TypeScript
- **UI/Styling:** Tailwind CSS + shadcn/ui + Radix UI
- **State Management:** React Context + Firebase Hooks

## Project Status

**Current Phase:** Pre-implementation / Planning

The project is currently in the planning phase with comprehensive documentation completed:
- ✅ Product Requirements Document (PRD)
- ✅ Technical Specification
- ✅ Setup Instructions
- ✅ Design Mockups

**Next Steps:** Initial Firebase setup and Phase 1 implementation (Tournament & Team Management)

## Documentation

- **[PRD.md](PRD.md)** - Complete product requirements with user stories
- **[TECHNICAL_SPEC_FIREBASE.md](TECHNICAL_SPEC_FIREBASE.md)** - Technical architecture and implementation details
- **[CLAUDE.md](CLAUDE.md)** - Developer onboarding and commands
- **[FRESH_START_CHECKLIST.md](FRESH_START_CHECKLIST.md)** - Step-by-step setup guide
- **[ref_images/](ref_images/)** - Design mockups and reference materials

## Development

This project uses Firebase's free tier (Spark Plan) to keep costs at zero while supporting tournaments with <100 concurrent users.

### Quick Start

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init

# Create React app
npm create vite@latest krakenscores-web -- --template react-ts

# Install dependencies
cd krakenscores-web
npm install

# Start development server
npm run dev
```

See [FRESH_START_CHECKLIST.md](FRESH_START_CHECKLIST.md) for detailed setup instructions.

## Contributing

This is a volunteer-maintained project for Team Orlando Water Polo Club. For questions or contributions, please open an issue.

## License

Private project for Team Orlando Water Polo Club.

---

**Repository:** https://github.com/gitobic/krakenscores
