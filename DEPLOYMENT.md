# Deploying centr.club

## ⚠️ Important: This Cannot Run on WordPress Hosting

**Your application is a Next.js/React application, NOT a WordPress site.**

WordPress hosting only supports PHP applications. This is a Node.js application and requires:
- Node.js 20+ runtime
- PostgreSQL database
- Not compatible with WordPress hosting

---

## Your Actual Hosting Options

### Option 1: Vercel (Easiest - Recommended)

**Best for**: Quick deployment, no server management

**Steps**:
1. Sign up at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm i -g vercel`
3. Set up PostgreSQL database: [neon.tech](https://neon.tech) (free)
4. Deploy: `vercel`
5. Add environment variables in Vercel dashboard
6. Add custom domain: centr.club

**Time**: ~15 minutes  
**Cost**: Free tier available

---

### Option 2: Hostinger Node.js Hosting

**Best for**: If you have Hostinger VPS/Cloud with Node.js support

**Requirements**:
- Hostinger VPS or Cloud hosting plan (NOT shared hosting)
- Node.js support enabled in hPanel
- PostgreSQL database access

**Steps**:
1. Log into Hostinger hPanel
2. Go to Node.js section
3. Create PostgreSQL database in hPanel
4. Upload your application files
5. Set environment variables
6. Build and start application

**Note**: Check if your Hostinger plan supports Node.js in the hPanel control panel.

---

### Option 3: Railway

**Best for**: All-in-one solution with database included

**Steps**:
1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Add PostgreSQL database (included)
4. Set environment variables
5. Add custom domain: centr.club

**Time**: ~15 minutes  
**Cost**: $5/month

---

## Required Environment Variables

For any platform, you need:

```env
DATABASE_URL="postgresql://user:pass@host:5432/database"
NEXTAUTH_URL="https://centr.club"
NEXTAUTH_SECRET="[generate with: openssl rand -base64 32]"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
RESEND_API_KEY="optional-for-email-notifications"
NODE_ENV="production"
```

---

## Quick Deploy with Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (follow prompts)
vercel

# 4. Add environment variables in Vercel dashboard

# 5. Deploy to production
vercel --prod
```

---

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create OAuth credentials
3. Add redirect URI: `https://centr.club/api/auth/callback/google`

---

## Why Not WordPress?

| Feature | WordPress | Your App (Next.js) |
|---------|-----------|-------------------|
| **Technology** | PHP | Node.js |
| **Database** | MySQL | PostgreSQL |
| **Hosting** | WordPress hosting | Node.js hosting |
| **Type** | CMS | Custom web app |

Your application is a **custom-built** web application with specific features for Science Olympiad team management. It's not a website builder or CMS like WordPress.

---

## Need Help?

Choose the hosting platform that fits your needs:
- **Easiest**: Vercel (free, no server management)
- **Hostinger**: If you have VPS/Cloud plan with Node.js
- **Railway**: All-in-one with database included

All options will work with centr.club domain!

