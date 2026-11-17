# 🎵 Matiks Beats — Speed Artist Quiz (Monorepo)

An adrenaline-pumping, speed-based artist quiz app inspired by the fast, sleek mental math UI of **Matiks**. Built as a high-performance **Monorepo** ready for instant deployment to **Vercel** with **PostgreSQL**, **Prisma ORM**, **Express Serverless**, **Bun**, and **Vite + Tailwind CSS v4**.

---

## ⚡ Core Features

- **🎮 Matiks-Inspired UI & Sound Design**:
  - Crisp arcade aesthetic with dynamic neon accents and mobile single-screen viewport lock (`100dvh`).
  - Tactile procedural sound effects synthesized in real-time via the Web Audio API.
  - Keyboard shortcuts (`[1]`, `[2]`, `[3]`) and streak multipliers (`🔥 1.2x`, `1.5x`, `2.0x`).
  - Per-question countdown bar with color transitions and total match speed clock.
  - High-res album covers displayed directly inside each of the 3 option cards.

- **📊 Database Cache Index Service for Analytics**:
  - Pre-computed database cache indexes stored in PostgreSQL (`AnalyticsCache` & `AnalyticsEvent`).
  - Sub-millisecond analytical aggregations for total games, global accuracy, play time, and artist trends.
  - **On-demand Index Rebuild**: Manual and automated cache index rebuilding accessible from the Admin Console.

- **📈 Google Analytics (GA4)**:
  - Configurable via `VITE_GA_MEASUREMENT_ID` environment variable.
  - Full tracking for page views, quiz starts, quiz completions, artist searches, and user logins.

- **🔒 Proper User Authentication & Roles**:
  - Secure email & password registration and login with `bcrypt` password hashing.
  - Role-based authorization (`USER` vs `ADMIN`).
  - Protected endpoints with JWT and cookie authentication.
  - Spotify OAuth 2.0 account linking + 1-click guest play.

- **🛡️ Comprehensive Admin Panel**:
  - Accessible to `ADMIN` users via the top header badge.
  - Real-time Analytics Dashboard powered by the Database Cache Index service.
  - User Directory Management: view players, delete, or promote/demote admin roles.
  - Live Game Sessions Feed.
  - System diagnostics: PostgreSQL latency, Spotify connection, and Google Analytics status.
  - **Default Seed Admin**: `admin@matiks.beats` / `AdminPass123!`

- **🚀 Vercel-Ready Monorepo Architecture**:
  - Root `vercel.json` and `api/index.ts` serverless handler.
  - Single deployment delivers both the Vite SPA and the Express/Prisma API.

---

## 📁 Monorepo Structure

```
artist-quiz/
├── api/
│   └── index.ts                 # Vercel Serverless Function entry point
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # PostgreSQL Schema (User, GameSession, AnalyticsCache, etc.)
│   ├── src/
│   │   ├── index.ts             # Express server entry point
│   │   ├── middleware/auth.ts   # JWT & Admin authorization middleware
│   │   ├── routes/
│   │   │   ├── admin.ts         # Admin panel & cache rebuild APIs
│   │   │   ├── auth.ts          # Register, Login, Spotify OAuth
│   │   │   ├── quiz.ts          # 10-song quiz generator with verified previews
│   │   │   ├── leaderboard.ts   # Global & artist rankings
│   │   │   └── spotify.ts       # Artist search & catalog
│   │   └── services/
│   │       ├── analyticsCacheService.ts # Database Cache Index Service
│   │       ├── spotifyService.ts        # Spotify Web API & preview resolver
│   │       └── fallbackMusicService.ts  # Verified iTunes artist lookup
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminPanel.tsx   # Admin Control Center & Analytics Dashboard
│   │   │   ├── AuthModal.tsx    # Sign In, Register, Spotify, Guest Modal
│   │   │   ├── GameStage.tsx    # Mobile-optimized 1-screen quiz stage
│   │   │   ├── GameSummary.tsx  # Match report card & question review
│   │   │   ├── Header.tsx       # Navigation & role badge
│   │   │   └── LeaderboardView.tsx # Hall of fame & champion podiums
│   │   └── utils/
│   │       ├── analytics.ts     # Google Analytics (GA4) integration
│   │       └── audioSynth.ts    # Web Audio API sound synthesizer
├── vercel.json                  # Vercel deployment build & route configuration
└── package.json                 # Monorepo workspaces & root scripts
```

---

## 🛠️ Quick Start (Running Locally with Bun)

### 1. Database Setup (PostgreSQL)

If using Docker:
```bash
docker run -d --name artist-quiz-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=artistquiz \
  -p 5432:5432 postgres:16-alpine
```

### 2. Environment Variables

Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/artistquiz?schema=public"
PORT=3001
FRONTEND_URL="http://localhost:5173"
JWT_SECRET="artist-quiz-super-secret-jwt-key-matiks-2025"

# Optional: Spotify Developer Credentials
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""
SPOTIFY_REDIRECT_URI="http://localhost:3001/api/auth/spotify/callback"
# Note: In Spotify Development Mode, add your Spotify email under 'User Management' in the Spotify Dashboard to avoid 403 errors during OAuth.

# Optional: Google Analytics GA4 Measurement ID
GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

Create `frontend/.env`:
```env
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### 3. Install & Synchronize Database

```bash
# Push schema to PostgreSQL and generate Prisma client
bun run db:push
```

### 4. Run Both Servers

```bash
# Terminal 1: Backend
bun run dev:backend

# Terminal 2: Frontend
bun run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Default Credentials

- **Admin Account**:
  - **Email**: `admin@matiks.beats`
  - **Password**: `AdminPass123!`
  - Once signed in, click the **"Admin"** button in the top navigation header to view the Analytics Dashboard and rebuild database cache indexes.

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub or GitLab.
2. In the Vercel Dashboard, import the repository.
3. Add the following **Environment Variables** in Vercel Project Settings:
   - `DATABASE_URL`: Your PostgreSQL connection string (Vercel Postgres, Neon, or Supabase).
   - `JWT_SECRET`: A secure random secret key.
   - `VITE_GA_MEASUREMENT_ID`: (Optional) Your Google Analytics GA4 ID.
   - `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`: (Optional) For real Spotify OAuth login.
4. Click **Deploy**. Vercel will automatically build the Prisma engine, bundle the Vite frontend, and serve the API as serverless functions.
