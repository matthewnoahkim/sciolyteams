# Quick Start Guide

Get SciOly Teams up and running in 5 minutes!

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Google OAuth credentials

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Run `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `RESEND_API_KEY`: From Resend.com
   - `NEXTAUTH_URL`: http://localhost:3000

3. **Initialize database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```

5. **Open browser**
   
   Visit [http://localhost:3000](http://localhost:3000)

## First Steps

1. Sign in with Google
2. Create a team (Division B or C)
3. Go to Settings and copy invite codes
4. Create subteams
5. Assign members to events in the Roster tab

## Need Help?

- Full setup guide: `SETUP.md`
- Documentation: `README.md`
- Troubleshooting: See SETUP.md

## Key Features

✅ Google OAuth authentication  
✅ Team management with dual roles (Captain/Member)  
✅ Subteam organization  
✅ 2026 official events for Division B & C  
✅ Automatic conflict detection  
✅ Event roster with capacity limits  
✅ Team announcements with email notifications  
✅ Shared calendar with scopes  
✅ Secure invite code system  

Enjoy! 🎉

