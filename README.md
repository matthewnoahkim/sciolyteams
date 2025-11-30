# Teamy

Team management platform for Science Olympiad. Built with Next.js 14, TypeScript, PostgreSQL.

## Features

### Core
- **Clubs & Teams** — Division B/C clubs with multiple teams, dual-role system (Admin/Member), invite codes & links
- **Event Roster** — 2026 SO events, conflict detection, capacity enforcement, AI-assisted assignments
- **Announcements** — Scoped visibility, file attachments, reactions, threaded replies, email notifications
- **Calendar** — Personal/team/club events, RSVP, recurring events, role/event targeting
- **Attendance** — Check-in codes, manual check-in, grace periods, CSV export, rate limiting

### Finance
- **Budgets** — Per-event budgets (optionally per-team)
- **Purchase Requests** — Approval workflow, budget enforcement
- **Expenses** — Categorized tracking linked to events/teams

### Testing
- **Question Types** — MCQ (single/multi), short text, long text, numeric
- **Proctoring** — Tab tracking, fullscreen enforcement, paste/copy detection
- **Tools** — Built-in calculator (4-function/scientific/graphing), note sheet upload with admin review
- **AI Grading** — OpenAI-powered FRQ grading with suggestions
- **Score Release** — Configurable modes (none, score only, wrong answers, full test)

### Tournaments
- Create & manage invitationals
- Team registration with event selection
- Tournament-specific tests

### Other
- **Gallery** — Photo albums with image/video support
- **Paperwork** — Form distribution with submission tracking
- **Todos** — Personal task lists with priorities & due dates
- **Dashboard Widgets** — Customizable homepage with 12+ widget types
- **Member Preferences** — Event preferences, custom backgrounds, admin notes
- **Stats** — Team performance analytics

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth.js (Google OAuth) |
| UI | Tailwind CSS + shadcn/ui |
| State | TanStack Query |
| AI | OpenAI API |
| Email | Resend |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Yes | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth client secret |
| `RESEND_API_KEY` | Yes | Email service key |
| `EMAIL_FROM` | Yes | Sender email |
| `OPENAI_API_KEY` | No | For AI features |


## License

MIT
