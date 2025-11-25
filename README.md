# Teamy

A comprehensive team management platform built with Next.js 14, TypeScript, and PostgreSQL. Designed for Science Olympiad teams but adaptable for any team-based organization.

## Features

### Authentication
- **Google OAuth 2.0** sign-in with NextAuth.js
- Secure session management with JWT strategy
- User profile management with customizable usernames

### Team Management
- **Create teams** for Division B (Grades 6-9) or Division C (Grades 9-12)
- **Dual role system**: Admins and Members
- **Invite codes**: Separate rotating codes for admins and members
- **Invite links**: Share single-click join URLs that securely wrap invite codes
- **Team size cap**: Maximum 15 users per team
- **Subteams**: Create multiple subteams within a team (e.g., Varsity, JV)
- Assign members to subteams for better organization

### Event Roster
- **Official 2026 events** for both Division B and Division C
- **Conflict detection**: Enforces 2026 National conflict blocks
- **Capacity enforcement**: 2 competitors per event (3 for Codebusters & Experimental Design)
- **Smart validation**: Prevents conflicting assignments and capacity violations
- Visual roster management with real-time feedback
- Subteam-based roster assignments

### Stream (Announcements)
- Post announcements visible to entire team or specific subteams
- **File attachments**: Support for images, PDFs, documents, and more
- **Reactions**: Emoji reactions to announcements and replies
- **Replies**: Threaded conversation system
- **Email notifications**: Optional email delivery to announcement recipients
- **Important markers**: Mark announcements as important
- Filter by visibility scope
- Email delivery logging

### Calendar
- **Scoped events**: Personal, Subteam, or Team-wide
- Members can create personal events
- Admins can create team/subteam events
- **RSVP system**: Members can RSVP to events (Yes/No)
- **Color coding**: Custom colors for different event types
- **Event details**: Location, description, start/end times
- Visual scope badges for easy identification
- Month and week view modes
- Integration with attendance system

### Attendance
- **Check-in codes**: Generate secure codes for event attendance
- **Code-based check-in**: Members check in using codes during event windows
- **Manual check-in**: Admins can manually add check-ins
- **Grace periods**: Configurable grace periods before/after events
- **Status tracking**: Upcoming, Active, Ended, Cancelled
- **Export to CSV**: Download attendance records
- **Roster view**: See who's checked in for each event
- **Rate limiting**: Prevents code brute force attempts
- Automatic attendance creation from calendar events

### Finance
- **Event Budgets**: Set maximum budgets per event (optionally per subteam)
- **Budget tracking**: Real-time tracking of spent, requested, and remaining budget
- **Purchase Requests**: Members can request purchases with estimated costs
- **Budget enforcement**: Prevents requests over budget (admin override available)
- **Expense tracking**: Record actual expenses with categories
- **Purchase approval workflow**: Admins approve/deny purchase requests
- **Budget visibility**: Members see only their subteam's budgets (admins see all)
- **Budget reminders**: Popup reminders when requesting purchases
- Visual progress bars and warnings for budget status
- Link expenses and requests to specific events and subteams

### Tests
- Create and manage tests/assessments
- Assign tests to specific subteams
- Track test results and performance

### People Management
- View all team members with their roles and subteams
- **Subteam assignment**: Admins can move members between subteams
- **Role management**: View admin/member status
- **Contact information**: Quick access to member emails
- Grid and list view modes
- Team roster view by subteam

### Settings
- **Team settings**: Edit team name, view team details
- **Member management**: Remove members, change roles
- **Invite code management**: Regenerate admin/member invite codes and copy shareable links
- **Leave team**: Members can leave teams
- Team information display

### Notifications
- **Tab badges**: Red dot indicators on navigation tabs for new content
- **Favicon badge**: Browser favicon shows notification count (Discord-style)
- **Smart notifications**: Only shows notifications for content created by others
- **Cross-tab notifications**: Related tabs get notified (e.g., calendar event notifies Calendar, Attendance, and Stream)
- **Persistent notifications**: Notifications persist until tabs are viewed
- **Team-level notifications**: Red dots on team cards on home page

### UI/UX
- **Dark mode**: Full dark mode support with theme toggle
- **Responsive design**: Works on desktop, tablet, and mobile
- **Modern UI**: Built with shadcn/ui components
- **Consistent branding**: Logo and favicon throughout the application
- **Real-time updates**: Live data updates without page refresh

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
- **Theme**: next-themes for dark mode

### State & Forms
- **Data Fetching**: TanStack Query (React Query)
- **Form Management**: React Hook Form
- **Validation**: Zod

### Infrastructure
- **Email**: Resend API
- **File Storage**: Local file system (uploads stored in `public/uploads/`)
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
   - `OPENAI_API_KEY`: Required for the optional admin-only AI Assist tools
   - `OPENAI_FRQ_MODEL` *(optional)*: Override the default OpenAI model for FRQ grading (defaults to `gpt-4o-mini`)

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
- **Membership**: User-team relationship with role and subteam
- **Subteam**: Sub-groups within teams
- **Event**: 2026 Science Olympiad events
- **ConflictGroup**: Conflict block definitions
- **RosterAssignment**: Member-to-event assignments

### Feature Models
- **Announcement**: Team announcements with scoped visibility, attachments, reactions, replies
- **CalendarEvent**: Calendar events with scope (Personal/Subteam/Team), RSVP support
- **EventRSVP**: RSVP responses to calendar events
- **Attendance**: Attendance tracking for events with check-in codes
- **AttendanceCheckIn**: Individual check-in records
- **EventBudget**: Budget limits per event (optionally per subteam)
- **PurchaseRequest**: Purchase requests with approval workflow
- **Expense**: Actual expenses with categories and event linking
- **Test**: Test/assessment records
- **TestAssignment**: Test assignments to subteams
- **EmailLog**: Email delivery tracking
- **Attachment**: File attachments for announcements and events
- **Reaction**: Emoji reactions to announcements, events, and replies

## API Routes

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Teams
- `POST /api/teams` - Create team
- `GET /api/teams` - List user's teams
- `GET /api/teams/[teamId]` - Get team details
- `POST /api/teams/join` - Join team with invite code
- `POST /api/teams/[teamId]/invite/regenerate` - Regenerate invite codes (Admin only)
- `PATCH /api/teams/[teamId]` - Update team (Admin only)

### Subteams
- `POST /api/teams/[teamId]/subteams` - Create subteam (Admin only)
- `GET /api/teams/[teamId]/subteams` - List subteams
- `PATCH /api/memberships/[membershipId]` - Update member's subteam (Admin only)

### Roster
- `POST /api/roster` - Assign member to event (Admin only)
- `DELETE /api/roster/[assignmentId]` - Remove assignment (Admin only)

### Events
- `GET /api/events?division=B|C` - List events for division
- `GET /api/conflicts?division=B|C` - Get conflict groups

### Announcements
- `POST /api/announcements` - Create announcement
- `GET /api/announcements?teamId=...` - List announcements
- `PATCH /api/announcements/[announcementId]` - Update announcement
- `DELETE /api/announcements/[announcementId]` - Delete announcement
- `POST /api/announcements/[announcementId]/reactions` - Add reaction
- `DELETE /api/announcements/[announcementId]/reactions` - Remove reaction
- `POST /api/announcements/[announcementId]/replies` - Add reply
- `DELETE /api/announcements/[announcementId]/replies/[replyId]` - Delete reply

### Calendar
- `POST /api/calendar` - Create calendar event
- `GET /api/calendar?teamId=...` - List calendar events
- `PATCH /api/calendar/[eventId]` - Update calendar event
- `DELETE /api/calendar/[eventId]` - Delete calendar event
- `POST /api/calendar/[eventId]/rsvp` - RSVP to event

### Attendance
- `GET /api/attendance?teamId=...` - List attendance records
- `POST /api/attendance/[attendanceId]/checkin` - Check in with code
- `POST /api/attendance/[attendanceId]/manual-checkin` - Manual check-in (Admin only)
- `GET /api/attendance/[attendanceId]/roster` - Get attendance roster
- `GET /api/attendance/[attendanceId]/export` - Export attendance to CSV
- `DELETE /api/attendance/[attendanceId]/checkin/[checkInId]` - Remove check-in (Admin only)

### Finance
- `GET /api/event-budgets?teamId=...` - List event budgets
- `POST /api/event-budgets` - Create/update event budget (Admin only)
- `DELETE /api/event-budgets/[budgetId]` - Delete event budget (Admin only)
- `GET /api/purchase-requests?teamId=...` - List purchase requests
- `POST /api/purchase-requests` - Create purchase request
- `PATCH /api/purchase-requests/[requestId]` - Update purchase request (approve/deny)
- `DELETE /api/purchase-requests/[requestId]` - Delete purchase request
- `GET /api/expenses?teamId=...` - List expenses
- `POST /api/expenses` - Create expense
- `PATCH /api/expenses/[expenseId]` - Update expense
- `DELETE /api/expenses/[expenseId]` - Delete expense

### Tests
- `GET /api/tests?teamId=...` - List tests
- `POST /api/tests` - Create test (Admin only)
- `PATCH /api/tests/[testId]` - Update test (Admin only)
- `DELETE /api/tests/[testId]` - Delete test (Admin only)

### Users
- `PATCH /api/users/me` - Update current user profile

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

### Budget System
- Budgets can be set per event, optionally per subteam
- Team-wide budgets apply to all subteams if no subteam-specific budget exists
- Purchase requests check against remaining budget
- Members can only see budgets for their subteam (unless admin)
- Budgets track: total budget, spent, requested, and remaining amounts

### Access Control
- **Admins can**:
  - Create subteams
  - Assign members to subteams
  - Manage event roster
  - Regenerate invite codes
  - Create team/subteam calendar events
  - Post announcements
  - Approve/deny purchase requests
  - Create/edit/delete expenses
  - Set event budgets
  - Create/edit/delete tests
  - Manually add attendance check-ins
  - Export attendance records

- **Members can**:
  - View team information
  - Post announcements
  - Create personal calendar events
  - RSVP to events
  - Check in to attendance events
  - Create purchase requests
  - View their subteam's budgets
  - View tests assigned to their subteam

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

# Testing
npm test                   # Run tests
npm run test:e2e          # Run E2E tests
```

## Project Structure

```
sciolyteams/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Seed script
├── public/
│   ├── favicon.svg       # Favicon
│   └── uploads/          # File uploads directory
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   ├── auth/        # Auth pages
│   │   ├── teams/       # Team pages
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Home page
│   ├── components/       # React components
│   │   ├── tabs/        # Team page tabs
│   │   ├── ui/          # shadcn/ui components
│   │   ├── logo.tsx     # Logo component
│   │   └── favicon-loader.tsx # Favicon initialization
│   ├── hooks/           # React hooks
│   │   └── use-favicon-badge.ts # Favicon badge hook
│   ├── lib/             # Utilities
│   │   ├── auth.ts      # NextAuth config
│   │   ├── prisma.ts    # Prisma client
│   │   ├── conflicts.ts # Conflict detection
│   │   ├── rbac.ts      # Access control
│   │   ├── email.ts     # Email service
│   │   ├── attendance.ts # Attendance logic
│   │   ├── favicon-badge.ts # Favicon badge utility
│   │   └── utils.ts     # General utilities
│   └── types/           # TypeScript types
├── .env.example         # Environment template
├── Dockerfile           # Docker configuration
├── package.json         # Dependencies
└── README.md           # This file
```

## Security

- **Server-side validation**: All mutations are validated on the server
- **RBAC enforcement**: Role checks are performed server-side
- **Invite code hashing**: Codes are hashed with bcrypt before storage
- **Rate limiting**: Implemented for attendance code attempts
- **SQL injection prevention**: Prisma provides parameterized queries
- **File upload validation**: File types and sizes are validated
- **CORS protection**: API routes are protected

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
