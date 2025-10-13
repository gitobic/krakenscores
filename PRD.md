# Product Requirements Document (PRD)
## KrakenScores - Water Polo Tournament Management System

**Version:** 1.0
**Last Updated:** 2025-10-13
**Product Owner:** Team Orlando Water Polo Club
**Target Launch:** Before next tournament season

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Goals & Success Metrics](#goals--success-metrics)
4. [User Personas](#user-personas)
5. [User Stories](#user-stories)
6. [Feature Requirements](#feature-requirements)
7. [Non-Functional Requirements](#non-functional-requirements)
8. [Technical Constraints](#technical-constraints)
9. [Release Phases](#release-phases)
10. [Dependencies & Risks](#dependencies--risks)

---

## Executive Summary

KrakenScores is a water polo tournament management system that replaces the current manual Google Sheets process with a dedicated web application. The system provides tournament administrators with tools to manage schedules, teams, and scores, while offering the public real-time access to schedules, scores, and standings via mobile-friendly pages.

**Key Benefits:**
- ✅ Real-time score updates (no manual sheet refresh)
- ✅ Mobile-first design for on-site viewing
- ✅ Automated standings calculations
- ✅ Bracket management and progression
- ✅ Zero hosting costs (Firebase free tier)
- ✅ Volunteer-maintainable codebase

---

## Problem Statement

### Current State
Team Orlando Water Polo Club currently manages tournament scoring using a manually-updated Google Sheet. This approach has several limitations:

**Problems:**
1. **Manual Updates** - Scores must be manually entered and formulas maintained
2. **No Real-Time Updates** - Users must refresh the sheet to see new scores
3. **Poor Mobile Experience** - Google Sheets are difficult to navigate on phones
4. **Error-Prone** - Manual data entry leads to mistakes in standings
5. **Limited Features** - No bracket management, pocket schedules, or advanced stats
6. **Accessibility** - Finding specific team schedules requires scrolling through entire sheet

### Target State
A dedicated web application that:
- Updates in real-time across all devices
- Provides mobile-optimized views for on-site spectators
- Automatically calculates standings and rankings
- Offers search and filter capabilities
- Manages bracket progression automatically
- Runs on free infrastructure

---

## Goals & Success Metrics

### Primary Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Real-time Updates** | Time from score entry to public display | < 2 seconds |
| **Mobile Performance** | Page load time on mobile | < 2 seconds |
| **Uptime** | System availability during tournament | 99.9% |
| **Cost** | Monthly hosting cost | $0 (free tier) |
| **User Adoption** | Percentage of spectators using app vs. sheets | > 80% |

### Secondary Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Score Entry Speed** | Time to enter one game score | < 30 seconds |
| **Search Functionality** | Time to find team schedule | < 10 seconds |
| **Data Accuracy** | Errors in standings calculation | 0% |
| **Volunteer Handoff** | Time to train new admin | < 2 hours |

---

## User Personas

### Persona 1: Tournament Administrator (Sarah)
**Role:** Head Coach / Tournament Organizer
**Tech Level:** Moderate (Google Sheets, email, basic web apps)
**Goals:**
- Set up tournament quickly (< 1 hour)
- Enter scores rapidly during games
- Ensure standings are accurate
- Make schedule adjustments on the fly

**Pain Points:**
- Limited time on tournament day
- Needs simple, error-proof interface
- Must handle last-minute changes
- Responsible if standings are wrong

**Frequency:** 2 tournament weekends per year

---

### Persona 2: Parent Spectator (Mike)
**Role:** Parent of player
**Tech Level:** Basic (smartphone user)
**Goals:**
- Check when his son's team plays next
- See current scores and standings
- Find out bracket placement
- Share schedule with other parents

**Pain Points:**
- Hard to read Google Sheets on phone
- Has to scroll through many divisions
- Doesn't know when scores are updated
- Wants printable team schedule

**Frequency:** Checks 10-20 times per tournament day

---

### Persona 3: Coach (Jennifer)
**Role:** Visiting team coach
**Tech Level:** Moderate
**Goals:**
- Track team's standings in real-time
- Know upcoming game times
- Check bracket status for playoff seeding
- Monitor competing teams' scores

**Pain Points:**
- Needs quick access between games
- Limited time to find information
- Must plan warmup timing around schedule
- Needs to communicate schedule to players

**Frequency:** Constant checking throughout tournament

---

### Persona 4: Referee (Carlos)
**Role:** Tournament referee
**Tech Level:** Moderate
**Goals:**
- Know which game is next
- Verify game time and pool assignment
- See schedule at a glance

**Pain Points:**
- Needs to check between games
- Cannot have confusion about game times
- Phone is primary device at poolside

**Frequency:** Checks before every game

---

## User Stories

### Epic 1: Tournament Setup (Admin)

**US-1.1: Create Tournament**
As a tournament administrator, I want to create a new tournament with name, dates, and logo, so that I can begin setting up the event.

**Acceptance Criteria:**
- [ ] Can enter tournament name (required)
- [ ] Can set start and end dates (required)
- [ ] Can upload tournament logo (optional, max 5MB)
- [ ] Can set default game length in minutes (default: 55)
- [ ] System saves tournament and assigns unique ID
- [ ] Logo displays throughout application

---

**US-1.2: Manage Clubs**
As a tournament administrator, I want to add participating clubs, so that I can organize teams by their club affiliation.

**Acceptance Criteria:**
- [ ] Can add club with name and abbreviation
- [ ] Can edit club information
- [ ] Can view list of all clubs
- [ ] Cannot delete club if teams are assigned to it
- [ ] Club abbreviation limited to 4-6 characters

---

**US-1.3: Manage Divisions**
As a tournament administrator, I want to create divisions with assigned colors, so that users can visually distinguish between age groups.

**Acceptance Criteria:**
- [ ] Can add division with name (e.g., "12u CoEd")
- [ ] Can select from predefined colorblind-safe color palette
- [ ] Can set sort order for display
- [ ] Color appears consistently across all interfaces
- [ ] Can edit division information
- [ ] Cannot delete division if teams are assigned to it

---

**US-1.4: Manage Teams**
As a tournament administrator, I want to add teams and assign them to clubs and divisions, so that they can participate in the tournament.

**Acceptance Criteria:**
- [ ] Can add team with name
- [ ] Must assign team to club (dropdown)
- [ ] Must assign team to division (dropdown)
- [ ] Can assign bracket designation (A, B, Gold, Silver, etc.)
- [ ] Can view list of all teams filtered by division
- [ ] Can edit team information
- [ ] Can delete teams
- [ ] Bonus: Can bulk import teams via CSV

---

### Epic 2: Scheduling (Admin)

**US-2.1: Manage Pools**
As a tournament administrator, I want to define pool locations and start times, so that games can be scheduled appropriately.

**Acceptance Criteria:**
- [ ] Can add pool with name (e.g., "Pool 1", "Deep End")
- [ ] Can set default start time (HH:MM format)
- [ ] Can add optional location info
- [ ] Can edit pool information
- [ ] Can delete pools if no games assigned

---

**US-2.2: Create Schedule**
As a tournament administrator, I want to schedule games by assigning teams to time slots, so that the tournament schedule is complete.

**Acceptance Criteria:**
- [ ] Can create game with:
  - Game number (auto-increment suggested)
  - Division (dropdown)
  - Pool (dropdown)
  - Date (date picker)
  - Time (time picker)
  - Dark caps team (dropdown)
  - Light caps team (dropdown)
- [ ] System validates no team conflicts (same team, overlapping times)
- [ ] Can mark game as semi-final or final
- [ ] Can edit game details
- [ ] Can delete games

---

**US-2.3: Schedule Breaks**
As a tournament administrator, I want to add breaks to the schedule (lunch, pool maintenance), so that they appear in the master schedule.

**Acceptance Criteria:**
- [ ] Can add break with time, duration, and description
- [ ] Must assign break to specific pool
- [ ] Breaks display in master schedule
- [ ] Can edit or delete breaks

---

### Epic 3: Score Entry & Standings (Admin)

**US-3.1: Enter Scores**
As a tournament administrator, I want to enter game scores quickly, so that standings update in real-time.

**Acceptance Criteria:**
- [ ] Can view list of games (filterable by division, pool, date)
- [ ] Can click game to enter score
- [ ] Form shows: game #, teams, division, time
- [ ] Can enter score for dark caps team (integer)
- [ ] Can enter score for light caps team (integer)
- [ ] Can mark game status (scheduled, in progress, completed)
- [ ] Save button triggers immediate update
- [ ] Public pages update within 2 seconds
- [ ] Can edit scores after entry

---

**US-3.2: View Standings**
As a tournament administrator, I want to see automatically calculated standings, so that I can verify accuracy and answer questions.

**Acceptance Criteria:**
- [ ] Standings calculate automatically on score entry
- [ ] Display per division:
  - Team name
  - Wins, losses, ties
  - Goals for, goals against
  - Goal differential
  - Rank/position
- [ ] Ranking logic: wins first, then goal differential
- [ ] Ties handled correctly (equal points, sorted by differential)
- [ ] Can view standings for all divisions

---

### Epic 4: Bracket Management (Admin)

**US-4.1: Generate Brackets**
As a tournament administrator, I want to automatically generate semi-final and final games based on pool play results, so that playoff games are set up correctly.

**Acceptance Criteria:**
- [ ] Can trigger "Generate Semi-Finals" action
- [ ] System uses top 4 teams from standings
- [ ] Creates 2 semi-final games (1st vs 4th, 2nd vs 3rd)
- [ ] Can manually adjust seeding if needed
- [ ] Can trigger "Generate Finals" action after semi-finals complete
- [ ] System creates championship game from semi-final winners
- [ ] System creates 3rd place game from semi-final losers
- [ ] Can create additional placement games (5th/6th, etc.)

---

### Epic 5: Public Viewing

**US-5.1: View Master Schedule**
As a spectator, I want to view the complete tournament schedule on my phone, so that I know when and where games are happening.

**Acceptance Criteria:**
- [ ] Displays all games in chronological order
- [ ] Shows: game #, division (with color), teams (dark vs light), pool, time, score
- [ ] Mobile-responsive layout (primary view)
- [ ] Can filter by:
  - Division (multi-select)
  - Pool (multi-select)
  - Date (if multi-day tournament)
- [ ] Filter selections persist on refresh
- [ ] Auto-refreshes scores every 30 seconds
- [ ] Displays schedule breaks in timeline
- [ ] Semi-finals and finals visually highlighted

---

**US-5.2: View Scores & Standings**
As a spectator, I want to see current scores and standings, so that I can track my team's progress.

**Acceptance Criteria:**
- [ ] Displays completed games with scores
- [ ] Displays standings by division:
  - Team name, club, W-L-T, GF, GA, GD, rank
- [ ] Can search by team name or club
- [ ] Can sort by various columns (wins, differential, etc.)
- [ ] Updates in real-time (no refresh needed)
- [ ] Mobile-friendly table (horizontal scroll if needed)

---

**US-5.3: Pocket Schedule (Search)**
As a parent, I want to search for my child's team and see only their games, so that I can print or save their personal schedule.

**Acceptance Criteria:**
- [ ] Search bar prominently displayed
- [ ] Can search by:
  - Team name (autocomplete)
  - Club name (shows all club teams)
- [ ] Results show filtered schedule with only matching games
- [ ] Shows: game #, time, opponent, pool
- [ ] Includes bracket games if applicable
- [ ] Printable view (CSS print media query)
- [ ] Share-friendly URL

---

**US-5.4: View Brackets**
As a spectator, I want to see bracket status and playoff progression, so that I know which teams are advancing.

**Acceptance Criteria:**
- [ ] Visual bracket display (tree/tournament style)
- [ ] Shows team progression from semi-finals to finals
- [ ] Displays final rankings:
  - Gold (1st place)
  - Silver (2nd place)
  - Bronze (3rd place)
  - 4th, 5th, etc. as applicable
- [ ] Updates in real-time as playoff games complete
- [ ] Mobile-friendly layout
- [ ] Division color-coded

---

**US-5.5: View Fun Stats**
As a spectator, I want to see interesting statistics about the tournament, so that I can engage with the event.

**Acceptance Criteria:**
- [ ] Total goals scored (overall and by division)
- [ ] Average goals per game (by division, pool, etc.)
- [ ] Highest-scoring game
- [ ] Top 5 teams by goal differential
- [ ] Other interesting metrics
- [ ] Updates as games complete
- [ ] Mobile-friendly display

---

**US-5.6: View Announcements**
As a spectator, I want to see important announcements about schedule changes, so that I don't miss my team's game.

**Acceptance Criteria:**
- [ ] Announcements display at top of all public pages
- [ ] Shows message text and timestamp
- [ ] Priority levels:
  - Info (blue background)
  - Warning (yellow background)
  - Urgent (red background)
- [ ] Admin can create/edit/delete announcements
- [ ] Admin can mark announcements as active/inactive
- [ ] Inactive announcements hidden from public view

---

### Epic 6: Data Management (Admin)

**US-6.1: Archive Tournament**
As a tournament administrator, I want to archive a tournament after completion, so that I can start fresh for the next event.

**Acceptance Criteria:**
- [ ] Can mark tournament as archived
- [ ] Archived tournaments don't appear in active list
- [ ] Can view archived tournament data (read-only)
- [ ] Only one tournament can be active at a time

---

**US-6.2: Export Data**
As a tournament administrator, I want to export tournament data, so that I can save records or share with others.

**Acceptance Criteria:**
- [ ] Can export tournament to JSON file
- [ ] Export includes: tournament info, clubs, divisions, teams, games, scores, standings
- [ ] Can download to local device
- [ ] Bonus: Generate PDF summary report

---

## Feature Requirements

### MVP Features (Phase 1 & 2)

| Feature | Priority | Complexity | Phase |
|---------|----------|------------|-------|
| Authentication (email/password) | Must Have | Medium | 1 |
| Tournament CRUD | Must Have | Low | 1 |
| Club CRUD | Must Have | Low | 1 |
| Division CRUD with colors | Must Have | Medium | 1 |
| Team CRUD | Must Have | Low | 1 |
| Pool CRUD | Must Have | Low | 2 |
| Game scheduling | Must Have | High | 2 |
| Schedule conflict validation | Must Have | High | 2 |
| Score entry | Must Have | Medium | 2 |
| Automatic standings calculation | Must Have | High | 2 |
| Master schedule (public) | Must Have | Medium | 3 |
| Scores & standings (public) | Must Have | Medium | 3 |

### Post-MVP Features (Phase 3 & 4)

| Feature | Priority | Complexity | Phase |
|---------|----------|------------|-------|
| Pocket schedule search | Should Have | Medium | 3 |
| Announcements | Should Have | Low | 3 |
| Bracket auto-generation | Should Have | High | 4 |
| Bracket status display | Should Have | Medium | 4 |
| Fun stats page | Nice to Have | Medium | 4 |
| Tournament archive | Should Have | Low | 4 |
| Data export (JSON) | Should Have | Low | 4 |
| CSV team import | Nice to Have | Medium | Future |
| PDF report generation | Nice to Have | High | Future |

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Page Load Time | < 2 seconds | Lighthouse, real device testing |
| Real-time Update Latency | < 2 seconds | Manual testing during load |
| Score Entry Time | < 30 seconds | User testing |
| Mobile Performance Score | > 90 | Lighthouse mobile audit |
| API Response Time | < 500ms | Firebase monitoring |

### Scalability

| Requirement | Target |
|-------------|--------|
| Concurrent Users | Support 100 users |
| Games per Tournament | Support 200+ games |
| Teams per Tournament | Support 50+ teams |
| Daily Firestore Reads | Stay under 50,000 (free tier) |
| Daily Firestore Writes | Stay under 20,000 (free tier) |

### Availability

| Requirement | Target |
|-------------|--------|
| Uptime during tournament | 99.9% |
| Planned maintenance window | Outside tournament weekends |
| Backup frequency | After each tournament |

### Security

| Requirement | Implementation |
|-------------|----------------|
| Admin authentication | Firebase email/password auth |
| Public read access | All tournament data |
| Admin write access | Authenticated admins only |
| Admin authorization | Firestore security rules with /admins collection |
| HTTPS | Firebase Hosting auto-provisioned SSL |
| API key management | Environment variables (.env.local) |

### Accessibility

| Requirement | Standard |
|-------------|----------|
| Color contrast | WCAG 2.1 AA (colorblind-safe palette) |
| Mobile-first design | Primary viewing device is smartphone |
| Touch targets | Minimum 44x44px |
| Keyboard navigation | All admin functions keyboard-accessible |
| Screen reader support | Semantic HTML, ARIA labels where needed |

### Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome (Android) | Last 2 versions |
| Safari (iOS) | Last 2 versions |
| Chrome (Desktop) | Last 2 versions |
| Safari (macOS) | Last 2 versions |
| Edge | Last 2 versions |

---

## Technical Constraints

### Budget
- **Hard Constraint:** Must operate on Firebase Spark (free) tier
- **Firebase Limits:**
  - 50,000 Firestore reads/day
  - 20,000 Firestore writes/day
  - 10 GB hosting bandwidth/month
  - 5 GB storage
- **Strategy:** Optimize queries, use real-time listeners efficiently, cache aggressively

### Infrastructure
- **Required:** Firebase (Firestore, Auth, Hosting)
- **Prohibited:** Paid hosting services, separate backend servers
- **Rationale:** Minimize cost and maintenance burden

### Technical Debt
- **Existing System:** Google Sheets (manual process)
- **Migration:** No automated migration needed (clean start each tournament)
- **Training:** Must train volunteers on new system

### Team Constraints
- **Team Size:** 1-2 volunteer developers
- **Skill Level:** Intermediate (comfortable with React, basic Firebase)
- **Availability:** Part-time, evenings/weekends
- **Timeline:** Ideally ready before next tournament (flexible)

---

## Release Phases

### Phase 1: Foundation & Admin Setup (Weeks 1-2)
**Goal:** Admin can set up tournament structure

**Features:**
- ✅ Firebase project setup and deployment
- ✅ Authentication system
- ✅ Tournament CRUD
- ✅ Club CRUD
- ✅ Division CRUD with colors
- ✅ Team CRUD

**Deliverable:** Admin can create tournament and add all teams

---

### Phase 2: Scheduling & Scoring (Weeks 3-4)
**Goal:** Admin can schedule games and enter scores

**Features:**
- ✅ Pool CRUD
- ✅ Game scheduling
- ✅ Conflict validation
- ✅ Score entry
- ✅ Automatic standings

**Deliverable:** Complete admin backend functional

---

### Phase 3: Public Pages (Weeks 5-6)
**Goal:** Public can view tournament information

**Features:**
- ✅ Master schedule
- ✅ Scores & standings
- ✅ Pocket schedule search
- ✅ Announcements

**Deliverable:** MVP ready for tournament use

---

### Phase 4: Advanced Features (Weeks 7-8)
**Goal:** Enhanced functionality for better experience

**Features:**
- ✅ Bracket management
- ✅ Bracket display
- ✅ Fun stats
- ✅ Archive & export

**Deliverable:** Full-featured v1.0

---

## Dependencies & Risks

### Technical Dependencies

| Dependency | Risk Level | Mitigation |
|------------|------------|------------|
| Firebase availability | Low | Firebase has 99.95% SLA; use emulators for dev |
| Internet connectivity at venue | Medium | Ensure venue has reliable Wi-Fi |
| Browser compatibility | Low | Test on iOS Safari and Chrome Android |
| Firebase free tier limits | Medium | Monitor usage, optimize queries |

### User Dependencies

| Dependency | Risk Level | Mitigation |
|------------|------------|------------|
| Admin learns new system | Medium | Provide training session, documentation |
| Users adopt new system | Low | Better UX than Google Sheets |
| Volunteer availability | Medium | Document everything, simple codebase |

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Firebase costs exceed free tier | High | Low | Monitor usage dashboard, set alerts |
| Slow performance with many users | Medium | Low | Load test before tournament, optimize queries |
| Score entry errors | High | Low | Validation, confirmation prompts |
| Admin can't use system on tournament day | High | Low | Extensive testing, user training |
| Internet outage at venue | High | Low | Discuss with venue in advance |
| Browser compatibility issues | Medium | Low | Test on multiple devices before launch |

---

## Acceptance Criteria for Launch

### Pre-Launch Checklist

- [ ] All Phase 1-3 features complete
- [ ] Tested on iPhone (Safari) and Android (Chrome)
- [ ] Firebase security rules deployed and tested
- [ ] At least one admin user created and trained
- [ ] Custom domain configured (optional)
- [ ] Lighthouse scores meet targets (>90 performance, accessibility)
- [ ] Load testing completed (100 concurrent users)
- [ ] Backup/export functionality verified
- [ ] Documentation complete (admin guide)

### Post-Launch Success Criteria

- [ ] Zero critical bugs during first tournament
- [ ] <2 second page load times maintained
- [ ] 99.9% uptime during tournament weekend
- [ ] Positive feedback from users (survey)
- [ ] Firebase usage stays within free tier
- [ ] Tournament data successfully exported/archived

---

## Appendix

### Related Documents
- **CLAUDE.md** - Developer onboarding and commands
- **TECHNICAL_SPEC_FIREBASE.md** - Complete technical architecture
- **FRESH_START_CHECKLIST.md** - Setup instructions

### Contact
- **Product Owner:** Team Orlando Water Polo Club
- **Development Team:** Volunteer developers
- **Repository:** https://github.com/gitobic/krakenscores

---

**Document History:**
- v1.0 (2025-10-13): Initial PRD created
