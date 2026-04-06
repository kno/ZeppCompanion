# ZeppCompanion

A training companion app with a virtual pet mascot for Amazfit Balance smartwatch, powered by Zepp OS 3.0+ and AI-driven real-time coaching.

## Overview

ZeppCompanion is a multi-component fitness system that combines:

- **Wearable App (Zepp OS)** — Real-time training UI with heart rate, GPS pace tracking, and an animated virtual pet companion that provides motivational coaching
- **Backend API + Web Dashboard (Next.js)** — Training configuration, session history, charts, and user management
- **LLM Integration** — Flexible AI provider (OpenAI/Anthropic/custom) generates personalized coaching messages during workouts

## Architecture

```
┌──────────────────┐       BLE         ┌───────────────┐      HTTPS      ┌─────────────────┐
│   Amazfit Watch  │ ◄──────────────►  │ Side Service  │ ◄────────────►  │ Backend (Next)  │
│   (Zepp OS App)  │   MessageBuilder  │ (Phone/Zepp)  │    fetch()      │ + Prisma + LLM  │
└──────────────────┘                   └───────────────┘                 └─────────────────┘
                                                                              │
                                                                       ┌──────┴─────────┐
                                                                       │  Web Dashboard │
                                                                       │  (React/TW)    │
                                                                       └────────────────┘
```

## Tech Stack

| Component     | Technology                                         |
|---------------|-----------------------------------------------------|
| Wearable      | Zepp OS 3.0+, JavaScript, @zeppos/zml MessageBuilder |
| Backend       | Next.js 15, TypeScript, Prisma, PostgreSQL/SQLite |
| Frontend      | React, Tailwind CSS, Recharts, React Hook Form, Zod |
| LLM           | Flexible — OpenAI, Anthropic, or any OpenAI-compatible API |
| Auth          | JWT (access + refresh tokens), bcrypt               |
| Target Device | Amazfit Balance (480×480 round, API 3.7)           |

## Project Structure

```
ZeppCompanion/
├── app.js                          # Zepp OS app entry point
├── app.json                        # Zepp OS config (pages, permissions, targets)
├── page/
│   ├── home/index.js               # Main menu
│   ├── training-select/index.js    # Training list from backend
│   ├── pre-training/index.js       # Training summary + start
│   ├── active-training/index.js    # Live training with sensors + mascot
│   ├── training-summary/index.js   # Post-training results
│   ├── settings/index.js           # App configuration
│   └── i18n/                       # Localization (en-US, es-ES)
├── app-side/index.js               # Side Service (phone) — BLE ↔ HTTP bridge
├── app-service/index.js            # Background service (watch)
├── shared/
│   ├── protocol.js                 # BLE message type constants
│   ├── message.js                  # Device MessageBuilder
│   ├── message-side.js             # Side Service MessageBuilder
│   └── device-polyfill.js          # setTimeout/setInterval polyfill
├── utils/
│   ├── constants.js                # Layout, colors, screen dimensions
│   ├── format.js                   # Time/pace/distance formatting + haversine
│   ├── companion-engine.js         # Local coaching rules + fallback messages
│   ├── sensor-manager.js           # HR + GPS sensor lifecycle
│   └── mascot.js                   # Mascot animation state machine
├── assets/amazfit-balance.r/
│   └── mascot/                     # Sprite frames (idle, talk, celebrate, worried)
└── backend/
    ├── package.json
    ├── prisma/schema.prisma        # Database schema
    ├── src/
    │   ├── app/                    # Next.js App Router
    │   │   ├── api/                # REST API routes
    │   │   │   ├── auth/           # register, login, me, refresh
    │   │   │   ├── trainings/      # CRUD
    │   │   │   ├── sessions/       # Start, complete, list
    │   │   │   ├── companion/      # LLM coaching endpoint
    │   │   │   └── stats/          # Aggregate stats
    │   │   ├── dashboard/          # Training list + stats
    │   │   ├── trainings/          # Create/edit/detail
    │   │   └── history/            # Session history + charts
    │   ├── lib/
    │   │   ├── auth.ts             # JWT helpers
    │   │   ├── llm.ts              # Flexible LLM provider
    │   │   ├── prompts.ts          # Coaching prompt templates
    │   │   └── validation.ts       # Zod schemas
    │   └── components/             # React UI components
    └── .env.example
```

## Companion Engine

The companion engine powers personalized coaching during training with both local intelligence and optional LLM enrichment.

**How It Works:**

1. **Local Rules Fire First** — Safety and baseline decisions happen instantly on-device:
   - HR zone enforcement (warn if exceeding safe limits)
   - Pace correction (suggest slowdown if too fast)
   - Milestone detection (distance, time, or zone achievements)

2. **LLM Provides Richer Messages** — When backend connectivity is available, the LLM generates personalized, contextual coaching messages based on:
   - Current HR zone and trend
   - Pace vs. goal
   - Training progress
   - User personality preference

3. **60+ Fallback Messages in Spanish** — Complete offline support with pre-crafted messages for all scenarios, ensuring the watch app works standalone

4. **Companion Styles** — Three personality modes:
   - **Motivational** — Energetic, encouraging ("You're crushing it!")
   - **Strict** — Focused, directive ("Maintain your pace. No excuses.")
   - **Neutral** — Informational, matter-of-fact ("Current HR: 165 bpm. Zone: Threshold.")

5. **Configurable Frequency** — Users set message cadence:
   - **60s** — Frequent check-ins (aggressive)
   - **90s** — Balanced (recommended)
   - **120s** — Minimal interruption

## Mascot States

The animated mascot responds visually to training conditions using a sprite-based state machine.

| State       | When                                  | Animation          |
|-------------|---------------------------------------|--------------------|
| **IDLE**    | Default state, normal training pace  | Relaxed, breathing |
| **TALKING** | Delivering a coaching message        | Mouth open, gesturing |
| **CELEBRATING** | Milestone achieved or exceptional performance | Jumping, celebratory |
| **WORRIED** | HR exceeding safe zone or pace warning triggered | Concerned expression |

## Prerequisites

- Node.js >= 18
- npm >= 9
- Zeus CLI >= 1.8 — Zepp OS build tool (`npm install -g @nicogp/zeus-cli`)
- Zepp OS Simulator or physical Amazfit Balance device

## Running Locally

### 1. Clone and Install

```bash
git clone <repo-url>
cd ZeppCompanion
npm install
```

### 2. Start the Backend

```bash
cd backend
npm install

# Set up environment
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```
DATABASE_URL=file:./dev.db        # SQLite for local dev
JWT_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>
LLM_PROVIDER=openai               # openai | anthropic | custom
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run migrations and start the server:

```bash
# Run database migrations
npx prisma migrate dev

# (Optional) Seed sample data
npx prisma db seed

# Start the dev server
npm run dev
```

The web dashboard is available at **http://localhost:3000**.

**Test Credentials (from seed):**
- Email: `test@ZeppCompanion.com`
- Password: `password123`

### 3. Run the Wearable App

From the project root (not `backend/`):

```bash
cd /path/to/ZeppCompanion

# Build for simulator
zeus dev

# Or build a .zab package for device install
zeus build
```

The Zeus dev server launches the Zepp OS simulator. Use the simulator to test navigation, sensor data, and companion messages.

### 4. Configure Watch ↔ Backend

1. Open the backend web dashboard and create an account
2. Create a training configuration
3. In the wearable Settings page, set the backend URL to your local server (e.g., `http://<your-ip>:3000`)
4. The Side Service on your phone bridges BLE messages from the watch to HTTP calls to the backend

**Note:** For local development without a physical watch, the wearable app uses mock training data. Backend connectivity is optional until Sprint 2+.

## Environment Variables

| Variable            | Required | Description                                    |
|---------------------|----------|------------------------------------------------|
| `DATABASE_URL`      | Yes      | Prisma connection string (file:./dev.db for SQLite) |
| `JWT_SECRET`        | Yes      | Secret for signing access tokens              |
| `JWT_REFRESH_SECRET` | Yes      | Secret for signing refresh tokens             |
| `LLM_PROVIDER`      | Yes      | openai, anthropic, or custom                  |
| `LLM_API_KEY`       | Yes      | API key for the chosen LLM provider           |
| `LLM_MODEL`         | No       | Model ID (default: gpt-4o-mini)               |
| `LLM_BASE_URL`      | No       | Custom base URL for self-hosted LLM endpoints |
| `NEXT_PUBLIC_APP_URL` | No     | Public app URL (default: http://localhost:3000) |

## User Flows

### Wearable (Watch)

1. **Home** → Select "Start Training"
2. **Training Selection** → Pick from list synced with backend
3. **Pre-Training** → Review goals, tap "Start"
4. **Active Training** → Live HR, pace, progress ring, animated mascot delivers coaching messages every 60–120s
5. **Summary** → Results vs. goals, final companion message

### Web Dashboard

1. **Register/Login** → Email + password
2. **Dashboard** → View trainings and aggregate stats
3. **Create Training** → Set type, duration, goals, companion personality and frequency
4. **History** → Browse past sessions with pace/HR charts

## API Endpoints

| Method | Path                        | Description                  |
|--------|----------------------------|------------------------------|
| POST   | `/api/auth/register`        | Create account               |
| POST   | `/api/auth/login`           | Login → JWT                  |
| GET    | `/api/auth/me`              | Current user                 |
| GET/POST | `/api/trainings`            | List / Create training       |
| GET/PUT/DELETE | `/api/trainings/[id]`       | Training detail / update / delete |
| POST   | `/api/sessions`             | Start training session       |
| POST   | `/api/sessions/[id]/complete` | Complete session             |
| POST   | `/api/companion/message`    | Get AI coaching message      |
| GET    | `/api/stats`                | Aggregate user stats         |

## Deployment

ZeppCompanion is containerized and ready for cloud deployment.

### Docker

A production-ready Docker setup is included:

```bash
# Build the image
docker build -t ZeppCompanion .

# Run locally
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@db:5432/ZeppCompanion" \
  -e JWT_SECRET="your-secret" \
  -e LLM_PROVIDER="openai" \
  -e LLM_API_KEY="sk-..." \
  ZeppCompanion
```

### Docker Compose

For local development with PostgreSQL:

```bash
docker-compose up
```

### Cloud Hosting

The application is compatible with:

- **Railway** — Zero-config PostgreSQL + Node.js hosting
  ```bash
  railway link
  railway up
  ```

- **Vercel** — Next.js frontend and API routes
  - Deploy the `backend/` directory as a Vercel project
  - Set environment variables in project settings
  - PostgreSQL via Vercel's PostgreSQL add-on

### Production Database

For production deployments, configure PostgreSQL:

```bash
# Update DATABASE_URL in .env.local or deployment platform
DATABASE_URL="postgresql://user:password@host:5432/ZeppCompanion"

# Run migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

Replace `user`, `password`, `host`, and database name with your PostgreSQL credentials.

## License

MIT
