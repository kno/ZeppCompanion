<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Backend — Next.js + Prisma API & Dashboard

Web dashboard and REST API for ZeppCompanion. Manages trainings, sessions, companion messages, and user accounts.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript
- **Database**: SQLite via Prisma + libsql adapter
- **Auth**: JWT (bcryptjs + jsonwebtoken, cookie-based)
- **Styling**: Tailwind CSS 4
- **Forms**: react-hook-form + zod validation
- **Charts**: Recharts
- **TTS**: kokoro-js (local text-to-speech for companion messages)
- **Package manager**: pnpm

## File Structure

```
backend/src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind globals
│   ├── global-error.tsx        # Error boundary
│   ├── (auth)/
│   │   ├── login/page.tsx      # Login form
│   │   └── register/page.tsx   # Registration form
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard shell (auth-protected)
│   │   └── page.tsx            # Dashboard with stats
│   ├── history/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Session history list
│   ├── trainings/
│   │   ├── new/page.tsx        # Create training form
│   │   └── [id]/page.tsx       # Training detail/edit
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   ├── refresh/route.ts
│       │   └── me/route.ts
│       ├── trainings/
│       │   ├── route.ts        # GET list, POST create
│       │   └── [id]/route.ts   # GET, PUT, DELETE
│       ├── sessions/
│       │   ├── route.ts        # GET list, POST create
│       │   ├── [id]/route.ts   # GET detail
│       │   └── [id]/complete/route.ts  # POST complete session
│       ├── companion/
│       │   └── message/route.ts  # POST generate companion message
│       ├── stats/route.ts        # GET user stats
│       └── llm-test/route.ts     # LLM test endpoint
├── hooks/
│   └── useAuth.ts              # Client-side auth hook
└── lib/
    ├── auth.ts                 # JWT token helpers, middleware
    ├── db.ts                   # Prisma client singleton
    ├── llm.ts                  # LLM integration for companion messages
    ├── prompts.ts              # Prompt templates for companion AI
    ├── tts.ts                  # Text-to-speech via kokoro-js
    ├── types.ts                # Shared TypeScript types
    └── validation.ts           # Zod schemas for API validation
```

## Data Models (Prisma)

| Model | Purpose |
|-------|---------|
| `User` | Auth accounts (email, password hash) |
| `Training` | Training templates (type, duration, HR zones, intervals, companion style) |
| `TrainingSession` | Active/completed sessions (metrics: duration, distance, HR, pace, steps) |
| `SessionDataPoint` | Time-series metrics during session (HR, pace, distance) |
| `CompanionMessage` | AI-generated motivational messages (tone, mascot state) |

Training types: `cardio_continuous`, `intervals`, `free`

## Commands (run from `backend/` directory)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `npx prisma migrate dev` | Run DB migrations |
| `npx prisma studio` | Open DB browser |
| `npx tsx prisma/seed.ts` | Seed database |

## API Endpoints

All API routes under `/api/`. Auth endpoints return JWT tokens; protected endpoints expect `Authorization: Bearer <token>` or auth cookie.

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login, returns tokens
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/auth/me` — Current user info

### Trainings
- `GET /api/trainings` — List user's trainings
- `POST /api/trainings` — Create training
- `GET /api/trainings/:id` — Training detail
- `PUT /api/trainings/:id` — Update training
- `DELETE /api/trainings/:id` — Delete training

### Sessions
- `GET /api/sessions` — List sessions
- `POST /api/sessions` — Start new session
- `GET /api/sessions/:id` — Session detail with data points
- `POST /api/sessions/:id/complete` — Complete session with final metrics

### Companion
- `POST /api/companion/message` — Generate AI companion message based on session state

### Stats
- `GET /api/stats` — Aggregated user training statistics

## Agent Notes

- DB file is `dev.db` in backend root — do not commit it
- Prisma schema at `prisma/schema.prisma` — run `npx prisma migrate dev` after changes
- The wearable app calls these API endpoints via its Side Service (`app-side/`)
- TTS generates audio files locally using kokoro-js for companion voice messages
