# SciOly Teams

A comprehensive Science Olympiad team management platform built with Next.js 14, TypeScript, and PostgreSQL.

## Features

### Authentication
- **Google OAuth 2.0** sign-in with NextAuth.js
- Secure session management with JWT strategy

### Team Management
- **Create teams** for Division B (Grades 6-9) or Division C (Grades 9-12)
- **Dual role system**: Captains and Members
- **Invite codes**: Separate rotating codes for captains and members
- **Team size cap**: Maximum 15 users per team

### Subteams
- Captains can create multiple subteams within a team
- Assign members to subteams
- Track subteam composition and events

### Event Roster
- **Official 2026 events** for both Division B and Division C
- **Conflict detection**: Enforces 2026 National conflict blocks
- **Capacity enforcement**: 2 competitors per event (3 for Codebusters & Experimental Design)
- **Smart validation**: Prevents conflicting assignments and capacity violations
- Visual roster management with real-time feedback

### Announcements (Team Stream)
- Post announcements visible to entire team or specific subteams
- Optional **email notifications** for announcement recipients
- Filter by visibility scope
- Email delivery logging

### Calendar
- **Scoped events**: Personal, Subteam, or Team-wide
- Members can create personal events
- Captains can create team/subteam events
- Visual scope badges for easy identification

## Tech Stack

### Core
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth

### UI & Styling
- **CSS Framework**: Tailwind CSS
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Icons**: lucide-react

### State & Forms
- **Data Fetching**: TanStack Query (React Query)
- **Form Management**: React Hook Form
- **Validation**: Zod

### Infrastructure
- **Email**: Resend API
- **Deployment**: Vercel / Fly.io ready
- **Container**: Docker support

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Google OAuth credentials
- Resend API key (for email)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sciolyteams
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_URL`: Your app URL (e.g., http://localhost:3000)
   - `NEXTAUTH_SECRET`: Random secret for JWT signing (generate with `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
   - `RESEND_API_KEY`: Resend API key for emails
   - `EMAIL_FROM`: Sender email address

4. **Set up Google OAuth**
   
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

5. **Initialize the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Core Models
- **User**: Global user accounts (from OAuth)
- **Team**: Teams with division (B or C)
- **Membership**: User-team relationship with role
- **Subteam**: Sub-groups within teams
- **Event**: 2026 Science Olympiad events
- **ConflictGroup**: Conflict block definitions
- **RosterAssignment**: Member-to-event assignments

### Features
- **Announcement**: Team announcements with scoped visibility
- **CalendarEvent**: Calendar events with scope (Personal/Subteam/Team)
- **EmailLog**: Email delivery tracking

## API Routes

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Teams
- `POST /api/teams` - Create team
- `GET /api/teams` - List user's teams
- `GET /api/teams/[teamId]` - Get team details
- `POST /api/teams/join` - Join team with invite code
- `POST /api/teams/[teamId]/invite/regenerate` - Regenerate invite codes (Captain only)

### Subteams
- `POST /api/teams/[teamId]/subteams` - Create subteam (Captain only)
- `GET /api/teams/[teamId]/subteams` - List subteams
- `PATCH /api/memberships/[membershipId]` - Update member's subteam (Captain only)

### Roster
- `POST /api/roster` - Assign member to event (Captain only)
- `DELETE /api/roster/[assignmentId]` - Remove assignment (Captain only)

### Events
- `GET /api/events?division=B|C` - List events for division
- `GET /api/conflicts?division=B|C` - Get conflict groups

### Announcements
- `POST /api/announcements` - Create announcement
- `GET /api/announcements?teamId=...` - List announcements

### Calendar
- `POST /api/calendar` - Create calendar event
- `GET /api/calendar?teamId=...` - List calendar events

## Business Logic

### Conflict Detection
The system enforces 2026 National conflict blocks:

**Division C Groups:**
- G1: Anatomy & Physiology, Engineering CAD, Forensics
- G2: Codebusters, Disease Detectives, Remote Sensing
- G3: Astronomy, Entomology, Experimental Design
- G4: Chemistry Lab, Machines
- G5: Circuit Lab, Dynamic Planet, Water Quality
- G6: Designer Genes, Materials Science, Rocks and Minerals

**Division B Groups:**
- G1: Codebusters, Disease Detectives, Remote Sensing
- G2: Entomology, Experimental Design, Solar System
- G3: Machines, Meteorology, Metric Mastery
- G4: Circuit Lab, Dynamic Planet, Water Quality
- G5: Heredity, Potions & Poisons, Rocks and Minerals
- G6: Anatomy & Physiology, Crime Busters, Write It Do It

Members cannot be assigned to multiple events in the same conflict group.

### Capacity Rules
- **Default**: 2 competitors per event
- **Exceptions**: Codebusters and Experimental Design allow 3 competitors

### Access Control
- **Captains can**:
  - Create subteams
  - Assign members to subteams
  - Manage event roster
  - Regenerate invite codes
  - Create team/subteam calendar events
  - Post announcements

- **Members can**:
  - View team information
  - Post announcements
  - Create personal calendar events

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Docker

Build and run with Docker:

```bash
docker build -t sciolyteams .
docker run -p 3000:3000 --env-file .env sciolyteams
```

### Fly.io

1. Install flyctl: `https://fly.io/docs/hands-on/install-flyctl/`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Set secrets: `fly secrets set KEY=value`
5. Deploy: `fly deploy`

## Development Commands

```bash
# Development
npm run dev                 # Start dev server
npm run lint               # Run ESLint

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Create migration
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database

# Build
npm run build              # Build for production
npm start                  # Start production server

# Testing (when implemented)
npm test                   # Run tests
npm run test:e2e          # Run E2E tests
```

## Project Structure

```
sciolyteams/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Seed script
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   ├── auth/        # Auth pages
│   │   ├── teams/       # Team pages
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Home page
│   ├── components/       # React components
│   │   ├── tabs/        # Team page tabs
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utilities
│   │   ├── auth.ts      # NextAuth config
│   │   ├── prisma.ts    # Prisma client
│   │   ├── conflicts.ts # Conflict detection
│   │   ├── rbac.ts      # Access control
│   │   └── email.ts     # Email service
│   └── types/           # TypeScript types
├── public/              # Static assets
├── .env.example         # Environment template
├── Dockerfile           # Docker configuration
├── package.json         # Dependencies
└── README.md           # This file
```

## Security

- **Server-side validation**: All mutations are validated on the server
- **RBAC enforcement**: Role checks are performed server-side
- **Invite code hashing**: Codes are hashed with bcrypt before storage
- **Rate limiting**: Consider implementing for production
- **SQL injection prevention**: Prisma provides parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- **Science Olympiad** for the official 2026 event lists and conflict blocks
- [Science Olympiad Official Website](https://www.soinc.org/)
- [2026 Division B Events](https://www.soinc.org/events/2026-division-b-events)
- [2026 Division C Events](https://www.soinc.org/events/2026-division-c-events)
- [2026 Conflict Blocks PDF](https://scilympiad.com/data/org/sdso/public/SO_26_Conflict_Blocks.pdf)

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ for the Science Olympiad community

