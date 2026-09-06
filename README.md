# 🏴 CYBER_DEFENSE_CTF — Modern Capture-The-Flag Platform

A high-performance, dark-themed CTF (Capture-the-Flag) competition platform built with **Next.js 16 (App Router)**, **TypeScript**, **Drizzle ORM**, **Tailwind CSS v4**, and designed for seamless 1-click deployment on **Vercel** with **Vercel Postgres (Neon)**.

---

## ⚡ Key Features

### 🎮 Competitor Facing
- **Challenge Arena**: Categorized challenges with live dynamic point counters, solve counts, and completion status tags.
- **Dynamic Logarithmic Scoring**: Starting at max points, challenge values dynamically decay as more competitors solve them:
  $$\text{points} = \max(\text{minPoints}, \text{round}(\text{maxPoints} - \text{decayFactor} \times \ln(\text{solves} + 1)))$$
- **Global Scoreboard**: Ranked leaderboard with podium medals (🥇, 🥈, 🥉), solve counts, and tie-breaking by last solve timestamp.
- **Score Progression Timeline**: Interactive Recharts timeline showing cumulative scores over time for the top 10 competitors.
- **Live Telemetry Feed**: Real-time activity feed of flag captures across the grid, with **🩸 First Blood** achievements.
- **Operator Dossier (Profiles)**: Per-user performance statistics, vector proficiency breakdown, and solve history.

### 🛡️ Admin Facing
- **Overview Analytics**: Live KPI metrics (total competitors, active challenges, solve counts, submission success rates).
- **Challenge Management**: Full CRUD, static flag configuration, dynamic decay calibration, external attachments, and draft/published visibility toggle.
- **Category Directory**: Create and manage challenge categories with custom color palettes and ordering.
- **Operator Roster**: View all competitors, toggle account bans, promote/demote administrators, or remove users.
- **Cryptographic Audit Trail**: Full searchable log of every flag submission attempt (both valid and invalid).
- **Competition Window**: Set global start and end timestamps (or run in always-on mode).
- **Data Export Center**: One-click exports of Full Backup (JSON), Scoreboard (CSV), Solves (CSV), Submissions (CSV), and Challenges (CSV).

### 🔒 Anti-Cheat & Security
- **Rate Limiting**: Enforces a strict sliding-window rate limit (10 flag submissions per minute per challenge per operator) to prevent brute-force attacks.
- **Tamper-Resistant Storage**: Solves and submissions are immutably logged with timestamps.
- **Role-Based Access Control**: Server-side session verification with secure signed JWT cookies and route protection.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Setup
Create a `.env.local` file (or copy from `.env.example`):
```bash
cp .env.example .env.local
```

Default credentials seeded automatically on first startup:
- **Admin Email**: `admin@ctf.local`
- **Admin Password**: `AdminPassword123!`
- **Admin Username**: `admin`

*Note: For local development, if `DATABASE_URL` is left empty, the platform automatically utilizes an embedded high-performance PGlite WASM PostgreSQL engine in `.local_db/` without needing Docker or a local PostgreSQL server.*

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Verification Suite
```bash
pnpm tsx scripts/test-e2e.ts
```

### 5. Build for Production
```bash
pnpm build
pnpm start
```

---

## ☁️ Deployment on Vercel

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import the repository.
3. In the **Storage** tab, add **Vercel Postgres (Neon)** to your project. This will automatically inject `DATABASE_URL` and `POSTGRES_URL`.
4. Configure the Environment Variables in Vercel:
   - `AUTH_SECRET`: Set to a strong random string (e.g. `openssl rand -hex 32`).
   - `ADMIN_EMAIL`: Your initial administrator email address.
   - `ADMIN_PASSWORD`: Your secure initial administrator password.
   - `NEXT_PUBLIC_CTF_NAME`: Competition title (e.g. `"DEFCON CTF 2026"`).
   - `NEXT_PUBLIC_CTF_DESCRIPTION`: Tagline.
5. Click **Deploy**. Tables and starter categories/challenges will be automatically initialized on first startup!

---

## 📁 Project Architecture

```
├── scripts/
│   └── test-e2e.ts                 # Full integration test suite
├── src/
│   ├── app/
│   │   ├── (player routes)
│   │   │   ├── challenges/         # Challenge board and single challenge pages
│   │   │   ├── scoreboard/         # Global leaderboard & progression timeline
│   │   │   ├── feed/               # Live telemetry activity feed
│   │   │   ├── profile/[username]/ # Operator profile and dossier
│   │   │   ├── login/ & register/  # Authentication screens
│   │   ├── admin/                  # Protected Admin Control Center
│   │   │   ├── challenges/         # Challenge inventory & creation form
│   │   │   ├── categories/         # Category directory
│   │   │   ├── players/            # Competitor roster and moderation
│   │   │   ├── submissions/        # Audit trail logs
│   │   │   ├── settings/           # Competition lifecycle timing
│   │   │   └── export/             # Data Export center
│   │   ├── api/                    # RESTful endpoints for Auth, Submissions, Stats
│   │   ├── globals.css             # Cyberpunk theme styles & animations
│   │   └── layout.tsx              # Root layout with top nav & footer
│   ├── components/
│   │   └── shared/                 # Navbar, Footer
│   ├── db/
│   │   ├── schema.ts               # Drizzle PostgreSQL schema
│   │   ├── index.ts                # Database client with Neon & PGlite fallback
│   │   └── migrate.ts              # Automatic migration and seed runner
│   └── lib/
│       ├── auth.ts                 # Session and password security
│       ├── scoring.ts              # Logarithmic decay formula
│       ├── rate-limit.ts           # Anti-cheat submission limiter
│       ├── ctf.ts                  # Competition window validation
│       └── config.ts               # Branding configuration
```
