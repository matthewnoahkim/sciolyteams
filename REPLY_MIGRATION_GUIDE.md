# Adding Reply Feature - Step-by-Step Guide

## What This Will Do

This migration adds a new table `AnnouncementReply` to allow team members to reply to announcements.

### Database Changes:
- ✅ Creates a **NEW** table: `AnnouncementReply`
- ✅ Does **NOT** modify existing tables
- ✅ Does **NOT** delete any data
- ✅ Safe and reversible

---

## Step 1: Review the Schema Changes ✅ DONE

The schema has been updated in `prisma/schema.prisma`. Here's what was added:

```prisma
model AnnouncementReply {
  id             String   @id @default(cuid())
  announcementId String
  authorId       String
  content        String   @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  announcement   Announcement @relation(...)
  author         Membership   @relation(...)
}
```

---

## Step 2: Run the Migration

Open your terminal in the project directory and run:

```bash
npx prisma migrate dev --name add_announcement_replies
```

### What will happen:
1. Prisma will detect the schema changes
2. It will generate SQL to create the new table
3. It will ask you to confirm
4. It will apply the changes to your database
5. It will generate a new Prisma client

### If you see an error about TLS/SSL:
Try this alternative:

```bash
npx prisma db push
```

This does the same thing but skips the migration file creation.

---

## Step 3: Verify the Migration

After running the migration, you should see:
- ✅ A new migration folder created in `prisma/migrations/`
- ✅ Success message in terminal
- ✅ No errors

---

## Step 4: Tell Me When It's Done!

Once you've successfully run the migration, let me know and I'll:
1. Add the API endpoints for creating/fetching replies
2. Update the UI to show the reply feature

---

## If Something Goes Wrong

### Rollback (undo the migration):
```bash
npx prisma migrate reset
```
⚠️ Warning: This will delete ALL data and recreate from scratch. Only use in development!

### Backup First (optional but recommended):
```bash
# If using PostgreSQL
pg_dump $DATABASE_URL > backup_before_replies.sql
```

---

## Questions?

- **Will this break my app?** No, existing features will continue to work
- **Can I undo this?** Yes, using `prisma migrate reset`
- **Will I lose data?** No, this only adds new tables
- **Do I need to restart my app?** Yes, after migration completes

---

Ready to proceed? Run the migration command and let me know how it goes! 🚀

