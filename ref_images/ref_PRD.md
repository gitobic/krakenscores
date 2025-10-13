# Product Requirements Document (PRD)
# KrakenScores - Water Polo Tournament Management System

**Version:** 1.0
**Last Updated:** 2025-10-10
**Project Start:** 2025-10-10
**Target Launch:** 2026-04-10 (6 months, before next tournament)

---

## Executive Summary

KrakenScores is a water polo tournament scoring and tracking application that replaces Team Orlando Water Polo Club's manual Google Sheets system with a dedicated web application. Built with Python/Streamlit, it provides tournament administrators with tools to manage tournaments, schedules, and scores while offering fans real-time access to game information.

---

## Technical Stack

- **Framework:** Streamlit (Python)
- **Database:** SQLite3 (built-in Python)
- **Hosting:** Render.com (free tier, optional $7/month during tournaments)
- **Environment:** uv (Python package manager)
- **Version Control:** Git/GitHub
- **Python Version:** 3.11

---

## Product Goals

### Primary Goal
Create a robust, user-friendly application that automates tournament management, reduces manual effort, and improves the tournament experience.

### Success Metrics
- Zero manual data entry errors during tournament
- <2 second page load times for public pages
- 100% score entry accuracy
- Mobile-friendly (responsive design for <768px screens)
- Export tournament data for archival

---

## User Personas

### 1. Tournament Administrator (Primary User)
- **Name:** Tournament Admin
- **Role:** Sets up tournaments, enters scores
- **Tech Level:** Basic to intermediate
- **Needs:** Simple interface, no errors, quick score entry
- **Usage:** 2-3 days before tournament + 3 days during tournament (2x per year)

### 2. Head Coach
- **Name:** Coach
- **Role:** Creates game schedules
- **Tech Level:** Basic (currently uses Excel)
- **Needs:** Visual schedule builder, conflict detection
- **Usage:** 1-2 weeks before tournament

### 3. Parents/Fans (Secondary Users)
- **Name:** Fan
- **Role:** Views scores, schedules, standings
- **Tech Level:** Varies (assume low)
- **Device:** Primarily mobile phones
- **Needs:** Easy-to-read schedules, real-time scores, find "my team" quickly
- **Usage:** Throughout tournament weekend (20-30 concurrent users)

---

## Functional Requirements

### Phase 1: Core MVP (Weeks 1-4)

#### FR-1: Database Setup
- [x] Initialize SQLite database
- [ ] Create schema for tournaments, clubs, divisions, teams, pools, games
- [ ] Implement database connection pooling
- [ ] Add database backup mechanism (auto-backup after score entry)

#### FR-2: Admin Authentication
- [ ] Simple password authentication (stored in Streamlit secrets)
- [ ] Login page for admin sections
- [ ] Session state management
- [ ] Logout functionality

#### FR-3: Tournament Setup (Admin)
- [ ] Create tournament form (name, dates, logo upload, game length)
- [ ] Add/edit/delete clubs
- [ ] Add/edit/delete divisions (with color assignment from preset palettes)
- [ ] Add/edit/delete teams (assign to club + division + bracket)
- [ ] Add/edit/delete pools (physical locations)

#### FR-4: Basic Schedule Creation (Admin)
- [ ] Manual schedule entry form
- [ ] Assign teams to time slots
- [ ] Select pool for each game
- [ ] Validation: no team double-booked at same time
- [ ] Mark games as semifinal/final

#### FR-5: Score Entry (Admin)
- [ ] Game list view with filters (by division, date, pool)
- [ ] Score entry form (dark team score + light team score)
- [ ] Update game status (scheduled → in_progress → completed)
- [ ] Auto-calculate standings on score save

#### FR-6: Public Master Schedule
- [ ] Display all games in chronological order
- [ ] Show: game #, division (color-coded), date, time, pool, teams, scores
- [ ] Filter by division
- [ ] Auto-refresh every 30 seconds
- [ ] Manual refresh button

#### FR-7: Public Scores & Standings
- [ ] Display completed games with scores
- [ ] Show standings by division (wins, losses, goals for/against, differential)
- [ ] Real-time updates
- [ ] Search by team or club name

### Phase 2: Enhanced Features (Weeks 5-8)

#### FR-8: Advanced Schedule Builder (Admin)
- [ ] Calendar/grid view of schedule
- [ ] Drag-and-drop team assignment
- [ ] Visual conflict highlighting
- [ ] Schedule breaks configuration per pool
- [ ] Bulk game creation

#### FR-9: Bracket Management (Admin)
- [ ] Auto-create bracket games based on pool play results
- [ ] Semifinal automatic seeding
- [ ] Final placement games (3rd/4th, 5th/6th, etc.)
- [ ] Visual bracket display

#### FR-10: Pocket Schedule (Public)
- [ ] Search by club or team name
- [ ] Display filtered schedule for selected team
- [ ] Downloadable/printable view

#### FR-11: Bracket Status (Public)
- [ ] Display bracket standings
- [ ] Show playoff progression
- [ ] Rankings: Gold, Silver, Bronze, 4th, 5th, etc.

#### FR-12: Fun Stats (Public)
- [ ] Total points scored by division, pool, club
- [ ] Average points per game by division, pool, club
- [ ] Top 5 teams (most goals, best differential, etc.)
- [ ] Tournament-wide statistics

#### FR-13: Announcements (Admin + Public)
- [ ] Admin: Create/edit/delete announcements
- [ ] Public: Display active announcements with priority levels
- [ ] Schedule status (on time / behind schedule)

### Phase 3: Polish & Deployment (Weeks 9-12)

#### FR-14: Export & Archive
- [ ] Export tournament to static HTML files
- [ ] Download SQLite database file
- [ ] Generate PDF summary report

#### FR-15: Mobile Optimization
- [ ] Responsive design testing (<768px)
- [ ] Touch-friendly controls
- [ ] Optimized table layouts for mobile

#### FR-16: Deployment
- [ ] Render.com deployment configuration
- [ ] Environment variables setup
- [ ] SSL certificate (via Render)
- [ ] Custom domain configuration (if using GoDaddy domain)

#### FR-17: Testing & Documentation
- [ ] Admin user guide
- [ ] Public user FAQ
- [ ] Bug testing and fixes

---

## Non-Functional Requirements

### Performance
- **Response Time:** <2 seconds for page loads
- **Concurrent Users:** Support 20-30 concurrent viewers
- **Database:** Handle 100-150 games per tournament
- **Auto-refresh:** Public pages refresh every 30 seconds

### Security
- **Admin Access:** Password-protected admin pages
- **Secrets Management:** Use Streamlit secrets for sensitive data
- **SQL Injection:** Use parameterized queries
- **HTTPS:** Enabled via Render.com

### Usability
- **Mobile-First:** Optimized for phones (primary viewing device)
- **Accessibility:** Colorblind-safe color palettes
- **Error Messages:** Clear, actionable error messages
- **Loading States:** Show spinners during database operations

### Reliability
- **Data Backup:** Auto-backup after each score entry
- **Error Handling:** Graceful error handling with user-friendly messages
- **Database Integrity:** Foreign key constraints, validation

### Maintainability
- **Code Quality:** Modular Python code, type hints
- **Documentation:** Inline comments, docstrings
- **Git Workflow:** Feature branches, meaningful commit messages

---

## Technical Architecture

### Application Structure
```
kraken_scores/
├── app.py                    # Main entry point
├── pyproject.toml            # uv dependencies
├── .streamlit/
│   └── config.toml           # Streamlit config
├── database/
│   ├── db.py                 # DB connection & init
│   ├── models.py             # Schema definitions
│   └── queries.py            # CRUD operations
├── pages/
│   ├── home.py               # Public: Master schedule
│   ├── scores.py             # Public: Scores & standings
│   ├── schedules.py          # Public: Pocket schedules
│   ├── brackets.py           # Public: Bracket status
│   ├── stats.py              # Public: Fun stats
│   └── admin/
│       ├── setup.py          # Admin: Tournament setup
│       ├── schedule.py       # Admin: Schedule builder
│       └── score_entry.py    # Admin: Score entry
├── components/
│   ├── auth.py               # Authentication
│   ├── filters.py            # Search/filter UI
│   └── mobile.py             # Mobile-specific UI
├── utils/
│   ├── export.py             # Export functionality
│   ├── colors.py             # Color palettes
│   ├── calculations.py       # Standings calculations
│   └── validation.py         # Input validation
└── tests/
    └── test_calculations.py  # Unit tests
```

### Database Schema
See PRD.md "Database Tables" section below for full schema.

---

## Database Tables

### tournaments
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| logo_url | TEXT | |
| start_date | DATE | NOT NULL |
| end_date | DATE | NOT NULL |
| default_game_length_min | INTEGER | DEFAULT 55 |
| is_active | BOOLEAN | DEFAULT 1 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### clubs
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| tournament_id | INTEGER | FOREIGN KEY → tournaments.id |
| name | TEXT | NOT NULL |
| abbreviation | TEXT | |

### divisions
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| tournament_id | INTEGER | FOREIGN KEY → tournaments.id |
| name | TEXT | NOT NULL |
| color_hex | TEXT | NOT NULL |
| sort_order | INTEGER | |

### teams
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| club_id | INTEGER | FOREIGN KEY → clubs.id |
| division_id | INTEGER | FOREIGN KEY → divisions.id |
| name | TEXT | NOT NULL |
| bracket_assignment | TEXT | |

### pools
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| tournament_id | INTEGER | FOREIGN KEY → tournaments.id |
| name | TEXT | NOT NULL |
| location_info | TEXT | |

### games
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| tournament_id | INTEGER | FOREIGN KEY → tournaments.id |
| division_id | INTEGER | FOREIGN KEY → divisions.id |
| pool_id | INTEGER | FOREIGN KEY → pools.id |
| game_number | INTEGER | NOT NULL |
| scheduled_date | DATE | NOT NULL |
| scheduled_time | TIME | NOT NULL |
| team_dark_id | INTEGER | FOREIGN KEY → teams.id |
| team_light_id | INTEGER | FOREIGN KEY → teams.id |
| score_dark | INTEGER | |
| score_light | INTEGER | |
| is_semifinal | BOOLEAN | DEFAULT 0 |
| is_final | BOOLEAN | DEFAULT 0 |
| game_type | TEXT | DEFAULT 'pool_play' |
| status | TEXT | DEFAULT 'scheduled' |

### schedule_breaks
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| pool_id | INTEGER | FOREIGN KEY → pools.id |
| break_time | TIME | NOT NULL |
| duration_min | INTEGER | NOT NULL |
| description | TEXT | |

### announcements
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| tournament_id | INTEGER | FOREIGN KEY → tournaments.id |
| message | TEXT | NOT NULL |
| priority | TEXT | DEFAULT 'info' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| is_active | BOOLEAN | DEFAULT 1 |

---

## Implementation Roadmap

### Week 1-2: Foundation
- [x] Initialize uv environment
- [ ] Set up project structure
- [ ] Create database schema and connection
- [ ] Implement admin authentication
- [ ] Basic tournament setup page

### Week 3-4: Core Admin Features
- [ ] Club/division/team management
- [ ] Basic schedule creation
- [ ] Score entry page
- [ ] Standings calculation logic

### Week 5-6: Public Pages
- [ ] Master schedule page
- [ ] Scores & standings page
- [ ] Real-time refresh functionality
- [ ] Mobile responsive design

### Week 7-8: Advanced Features
- [ ] Pocket schedule
- [ ] Bracket management
- [ ] Fun stats page
- [ ] Announcements

### Week 9-10: Polish
- [ ] Export functionality
- [ ] Mobile optimization
- [ ] Error handling
- [ ] Performance optimization

### Week 11-12: Deployment & Testing
- [ ] Deploy to Render.com
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Documentation

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Render free tier sleeps after 15 min | High | High | Upgrade to $7/month during tournaments |
| SQLite file corruption | High | Low | Auto-backup after each score entry |
| Mobile UI not usable | High | Medium | Test on actual devices early |
| Schedule conflicts not caught | Medium | Medium | Extensive validation logic + testing |
| Learning curve for admin | Medium | Low | Simple UI + documentation |

---

## Future Enhancements (Post-MVP)

- User accounts (fans can follow teams)
- Email/SMS notifications
- Live streaming integration
- Advanced player statistics
- Google OAuth for admin
- Offline mode for score entry
- Multi-tournament support (manage multiple tournaments simultaneously)
- Team roster management
- Referee scheduling

---

## Success Criteria

### Launch Readiness
- [ ] All Phase 1 features complete and tested
- [ ] Admin can set up full tournament in <1 hour
- [ ] Score entry takes <30 seconds per game
- [ ] Public pages load in <2 seconds
- [ ] Mobile-responsive on iPhone and Android
- [ ] Deployed to Render with custom domain

### Post-Launch (After First Tournament)
- Zero critical bugs during tournament
- Positive feedback from admin and coaches
- 80%+ of attendees use the system to check scores
- Export generates complete tournament archive

---

## Appendix

### Color Palettes (Colorblind-Safe)

**Pastel Palette (12 colors)**
```
#8dd3c7, #ffffb3, #bebada, #fb8072, #80b1d3, #fdb462,
#b3de69, #fccde5, #d9d9d9, #bc80bd, #ccebc5, #ffed6f
```

**Bold Palette (12 colors)**
```
#a6cee3, #1f78b4, #b2df8a, #33a02c, #fb9a99, #e31a1c,
#fdbf6f, #ff7f00, #cab2d6, #6a3d9a, #ffff99, #b15928
```

**Wong Palette (20 colors)**
```
#000000, #FFFFFF, #E69F00, #56B4E9, #009E73, #F0E442,
#0072B2, #D55E00, #CC79A7, #C1E6E5, #564F94, #88A18C,
#96AAC1, #B8B58D, #57A559, #E6B081, #1BF7AA, #34FEF2,
#6D5224, #EE95A8
```

### Reference Documents
- `project.md` - Original project requirements
- `ref_images/` - Design mockups and current system examples
- `CLAUDE.md` - Claude Code guidance document
