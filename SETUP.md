# Setup Guide

This guide will walk you through setting up the SciOly Teams application from scratch.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** installed ([Download](https://nodejs.org/))
- **PostgreSQL** database (local or hosted)
- **Google Cloud account** (for OAuth)
- **Resend account** (for email, free tier available)

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd sciolyteams
npm install
```

### 2. Set Up PostgreSQL Database

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb sciolyteams
```

**Option B: Hosted Database**
- Use [Supabase](https://supabase.com/) (free tier)
- Or [Neon](https://neon.tech/) (free tier)
- Or any PostgreSQL hosting service

Get your connection string (format: `postgresql://user:password@host:port/database`)

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. **Create a new project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name it "SciOly Teams"
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Enable APIs and Services"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Configure consent screen if prompted:
     - User Type: External
     - App name: SciOly Teams
     - User support email: your email
     - Developer contact: your email
   - Application type: Web application
   - Name: SciOly Teams
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
     (Add production URL later)
   - Click "Create"
   - **Save the Client ID and Client Secret**

### 4. Set Up Resend (Email Service)

1. Go to [Resend](https://resend.com/) and sign up

2. **Verify your domain** (or use their test domain for development)
   - Go to "Domains"
   - Click "Add Domain"
   - Follow DNS verification steps
   - OR use `onboarding@resend.dev` for testing

3. **Create API Key**
   - Go to "API Keys"
   - Click "Create API Key"
   - Name it "SciOly Teams"
   - **Save the API key**

### 5. Configure Environment Variables

Create `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sciolyteams"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="SciOly Teams <onboarding@resend.dev>"

# Environment
NODE_ENV="development"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 6. Initialize Database

Run Prisma migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed with 2026 events and conflict blocks
npx prisma db seed
```

You should see:
```
🌱 Starting seed...
📚 Seeding Division C events...
✅ Created 23 Division C events
📚 Seeding Division B events...
✅ Created 23 Division B events
🔗 Seeding Division C conflict groups...
✅ Created 6 Division C conflict groups
🔗 Seeding Division B conflict groups...
✅ Created 6 Division B conflict groups
✅ Seed completed successfully!
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the sign-in page!

### 8. Test the Application

1. **Sign in with Google**
   - Click "Sign in with Google"
   - Authorize the app
   - You should be redirected to the home page

2. **Create a team**
   - Click "Create Team"
   - Name: "Test Team"
   - Division: C or B
   - Click "Create Team"

3. **Explore features**
   - **Stream**: Post an announcement
   - **Subteams**: Create subteams and assign members
   - **Roster**: View events and assign members (need multiple users)
   - **Calendar**: Create events
   - **Settings**: View invite codes

### 9. Test with Multiple Users

To test team functionality:

1. **Get invite codes** from Settings tab
2. **Open incognito window**
3. **Sign in with different Google account**
4. **Join team** using the invite code

Now you can test:
- Captain vs Member permissions
- Roster assignments
- Conflict detection
- Announcements to subteams

## Troubleshooting

### Database Connection Issues

**Error: "Can't reach database server"**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Restart if needed
brew services restart postgresql@15
```

**Error: "Database does not exist"**
```bash
# Create database
createdb sciolyteams
```

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Make sure redirect URI in Google Console matches exactly:
  `http://localhost:3000/api/auth/callback/google`
- No trailing slash
- Check port number (3000)

**Error: "access_denied"**
- Check Google+ API is enabled
- Try configuring OAuth consent screen again
- Add your test email to test users if using External

### Prisma Issues

**Error: "Environment variable not found"**
```bash
# Make sure .env file exists
ls -la .env

# Check DATABASE_URL is set
cat .env | grep DATABASE_URL
```

**Error: "Migration failed"**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Try again
npx prisma migrate dev
```

### Email Issues

**Emails not sending**
- Check RESEND_API_KEY is correct
- Verify domain or use `onboarding@resend.dev` for testing
- Check Resend dashboard for errors

## Next Steps

### Production Deployment

1. **Set up production database** (Supabase/Neon/AWS RDS)
2. **Deploy to Vercel/Fly.io** (see README.md)
3. **Update Google OAuth redirect URIs** for production domain
4. **Verify email domain** in Resend
5. **Set production environment variables**
6. **Enable rate limiting** and security measures

### Optional Enhancements

- Set up error tracking (Sentry)
- Add analytics (PostHog/Plausible)
- Configure CDN for static assets
- Set up monitoring and alerts
- Implement automated backups

## Development Tools

### Prisma Studio

Visual database browser:
```bash
npx prisma studio
```

Opens at [http://localhost:5555](http://localhost:5555)

### Database Inspection

```bash
# View database schema
npx prisma db pull

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Getting Help

- **Documentation**: See README.md for full feature docs
- **API Reference**: Check `/src/app/api` for endpoint details
- **Issues**: Open a GitHub issue
- **Questions**: Reach out to the maintainers

---

Happy building! 🎉

