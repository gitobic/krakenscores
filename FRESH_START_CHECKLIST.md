# Fresh Start Checklist - KrakenScores Firebase Project

## What to Bring from Current Project

### 📄 Documentation Files (Copy These)
```bash
# Copy these files to your new project root:
TECHNICAL_SPEC_FIREBASE.md    # Complete technical specification
CLAUDE.md                      # Project instructions (update for Firebase/React)
project.md                     # Original project overview (if still relevant)
PRD.md                         # Product requirements document (if exists)
```

### 🎨 Reference Materials (Copy if they exist)
```bash
ref_images/                    # Design mockups and screenshots
  ├── 01-MobileFriendly.pdf
  ├── 02-Scores.pdf
  ├── 03-Bracket_Status.pdf
  ├── 04-FunStats.pdf
  ├── 05-Master.pdf
  ├── 06-PocketSchedule.pdf
  └── ...
```

### 🔑 Firebase Configuration (You Already Have)
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

---

## Fresh Project Setup Steps

### Step 1: Create New GitHub Repository
```bash
# On GitHub:
# 1. Create new repo: "krakenscores"
# 2. Initialize with README
# 3. Add .gitignore for Node
# 4. Clone locally

git clone https://github.com/[your-username]/krakenscores.git
cd krakenscores
```

### Step 2: Copy Documentation Files
```bash
# Copy from old project to new project root
cp /Users/tobic/Projects/krakenscores/TECHNICAL_SPEC_FIREBASE.md .
cp /Users/tobic/Projects/krakenscores/CLAUDE.md .
cp -r /Users/tobic/Projects/krakenscores/ref_images .

# Optional: copy other docs if needed
# cp /Users/tobic/Projects/krakenscores/project.md .
# cp /Users/tobic/Projects/krakenscores/PRD.md .
```

### Step 3: Initialize Firebase in Project Root
```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login
# Use: digitalkraken@teamorlandowpc.com

# Initialize Firebase project
firebase init

# Select:
# ✓ Firestore (rules and indexes)
# ✓ Hosting (configure files)
# ? Use existing project
# Select: krakenscores-xxxxx (your project)
#
# Firestore setup:
#   Rules file: firestore.rules (default)
#   Indexes file: firestore.indexes.json (default)
#
# Hosting setup:
#   Public directory: dist (IMPORTANT: not "public")
#   Single-page app: Yes
#   Set up automatic builds: No
#   Overwrites: No
```

### Step 4: Create Firestore Security Rules
**File: `firestore.rules`** (created by firebase init)

Replace contents with:
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

    // Public read, admin write for all collections
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
      allow write: if isAdmin();
    }

    // Admin list - protected
    match /admins/{userId} {
      allow read: if isAdmin();
      allow write: if false;
    }
  }
}
```

### Step 5: Create Firestore Indexes
**File: `firestore.indexes.json`** (created by firebase init)

Replace contents with:
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

### Step 6: Update firebase.json
**File: `firebase.json`** (created by firebase init)

Update to include emulator config:
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

### Step 7: Create Vite + React + TypeScript App
```bash
# Create Vite project
npm create vite@latest krakenscores-web -- --template react-ts

# Navigate into project
cd krakenscores-web

# Install dependencies
npm install

# Install Firebase SDK
npm install firebase

# Install React Router
npm install react-router-dom
npm install -D @types/react-router-dom

# Install Firebase React hooks
npm install react-firebase-hooks

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install React Hook Form (for forms)
npm install react-hook-form

# Install date-fns (date formatting)
npm install date-fns
```

### Step 8: Configure Tailwind CSS
**File: `krakenscores-web/tailwind.config.js`**

Update content paths:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**File: `krakenscores-web/src/index.css`**

Replace contents with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 9: Create .env.local for Firebase Config
**File: `krakenscores-web/.env.local`** (CREATE THIS - gitignored by default)

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=krakenscores-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=krakenscores-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=krakenscores-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 10: Create Firebase Initialization File
**File: `krakenscores-web/src/lib/firebase.ts`** (CREATE THIS)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export default app;
```

### Step 11: Update .gitignore
**File: `krakenscores-web/.gitignore`**

Add these lines if not already present:
```
# Environment variables
.env.local
.env.*.local

# Build output
dist/
dist-ssr/

# Firebase cache
.firebase/

# macOS
.DS_Store
```

### Step 12: Test the Setup
```bash
# From krakenscores-web/ directory
npm run dev

# Should open browser at http://localhost:5173
# You should see the default Vite + React page
```

### Step 13: Deploy Firebase Rules
```bash
# From project root (krakenscores/)
firebase deploy --only firestore:rules,firestore:indexes

# Verify in Firebase Console:
# Firestore Database > Rules (should show your custom rules)
```

### Step 14: Initial Git Commit
```bash
# From project root
git add .
git commit -m "Initial setup: Vite + React + TypeScript + Firebase"
git push origin main
```

---

## Project Structure After Setup

```
krakenscores/                         # Git repo root
├── README.md
├── TECHNICAL_SPEC_FIREBASE.md         # ← Copied from old project
├── CLAUDE.md                          # ← Copied and updated
├── ref_images/                        # ← Copied from old project
│
├── firebase.json                      # ← Created by firebase init
├── firestore.rules                    # ← Created, then customized
├── firestore.indexes.json             # ← Created, then customized
├── .firebaserc                        # ← Created by firebase init
│
└── krakenscores-web/                 # Vite + React app
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.local                     # ← Your Firebase config (gitignored)
    │
    ├── public/
    │   └── favicon.ico
    │
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css                  # ← Tailwind imports
    │   │
    │   └── lib/
    │       └── firebase.ts            # ← Firebase initialization
    │
    └── dist/                          # ← Build output (gitignored)
```

---

## Quick Start Commands Summary

```bash
# One-time setup after creating new repo
git clone https://github.com/[username]/krakenscores.git
cd krakenscores

# Copy docs from old project
cp /path/to/old/TECHNICAL_SPEC_FIREBASE.md .
cp /path/to/old/CLAUDE.md .
cp -r /path/to/old/ref_images .

# Initialize Firebase
firebase login
firebase init  # Select Firestore + Hosting

# Create Vite app
npm create vite@latest krakenscores-web -- --template react-ts
cd krakenscores-web

# Install all dependencies
npm install
npm install firebase react-router-dom react-firebase-hooks react-hook-form date-fns
npm install -D @types/react-router-dom tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Create firebase config file
mkdir -p src/lib
# (Create src/lib/firebase.ts with content above)

# Create .env.local with your API keys
# (Add your Firebase config)

# Test dev server
npm run dev

# Deploy Firebase rules
cd ..
firebase deploy --only firestore:rules,firestore:indexes

# Commit and push
git add .
git commit -m "Initial setup: Vite + React + TypeScript + Firebase"
git push
```

---

## Files You MUST Create/Customize

1. ✅ `.env.local` - Your Firebase API keys
2. ✅ `src/lib/firebase.ts` - Firebase initialization
3. ✅ `firestore.rules` - Security rules (customize after init)
4. ✅ `firestore.indexes.json` - Database indexes (customize after init)
5. ✅ `firebase.json` - Add emulator config
6. ✅ `tailwind.config.js` - Update content paths
7. ✅ `src/index.css` - Add Tailwind directives

---

## What NOT to Copy from Old Project

❌ `database/` - Old SQLite code (not needed)
❌ `pages/` - Old Streamlit pages (rebuilding in React)
❌ `components/` - Old Streamlit components (rebuilding)
❌ `utils/` - Old Python utilities (rewriting in TypeScript)
❌ `tests/` - Old database tests (will write new ones)
❌ `tournament_data.db` - SQLite database (using Firestore now)
❌ `backups/` - Old backups (not needed)
❌ `.streamlit/` - Streamlit config (not needed)
❌ `pyproject.toml` - Python config (not needed)
❌ `uv.lock` - Python lock file (not needed)

---

## Ready to Start Fresh?

Once you complete these steps, you'll have:
- ✅ Clean git repository
- ✅ Firebase connected and configured
- ✅ Vite + React + TypeScript running
- ✅ Tailwind CSS configured
- ✅ Firebase SDK initialized
- ✅ Security rules deployed
- ✅ All documentation preserved

**Next step after setup:** Start building React components! 🚀

--- 

REcommended MCP Servers:
before we shut down - what MCP servers would you recommend to assist? 

⏺ Great question! Here are the MCP servers I'd recommend for your KrakenScores project:

  🔥 Highly Recommended

  1. @modelcontextprotocol/server-brave-search or @modelcontextprotocol/server-fetch

  - Why: Look up Firebase/React documentation, troubleshoot errors
  - Use case: "Search for React Hook Form validation examples"
  - Install: npx @modelcontextprotocol/create-server brave-search

  2. @modelcontextprotocol/server-github

  - Why: Create issues, manage PRs, check commits
  - Use case: "Create GitHub issue for bug found during testing"
  - Install: npx @modelcontextprotocol/create-server github

  📦 Nice to Have

  3. Firebase MCP Server (if it exists)

  - Check https://github.com/modelcontextprotocol/servers for Firebase-specific tools
  - As of now, there's no official Firebase MCP server, but you can use the built-in tools

  6. @modelcontextprotocol/server-puppeteer (You already have Playwright)

  - You already have Playwright MCP installed - keep using that!
  - Perfect for testing your React app in the browser

  7. @modelcontextprotocol/server-memory

  - Why: Remember context across sessions (tournament setup patterns, common bugs)
  - Use case: "Remember this team structure for future reference"

  🎯 My Top 3 Recommendations for You:

  1. Keep Playwright (already installed) - for browser testing
  2. Add Brave Search/Fetch - for documentation lookup
  3. Add GitHub - for issue/PR management

  ❌ Skip These:

  - Database servers (postgres/sqlite) - not needed with Firestore
  - Slack/Discord - not needed for solo dev
  - Google Drive/Sheets - not needed unless importing data

  Quick Install Commands

  # Add to your MCP settings (~/.config/claude/config.json or similar)

  # Brave Search (for docs lookup)
  npx @modelcontextprotocol/create-server brave-search

  # GitHub integration
  npx @modelcontextprotocol/create-server github

  # Memory (for cross-session context)
  npx @modelcontextprotocol/create-server memory

  ---
  For your specific project, I'd say:
  - ✅ Playwright (already have) - essential for testing React app
  - ✅ Brave Search - super helpful for Firebase/React docs
  - ✅ GitHub - if you're managing project on GitHub
  - ⚠️ Memory - nice but not essential for this project size

  Bottom line: You're already well-equipped with Playwright. Just add Brave Search for documentation lookups and you're golden! 🚀
---
##