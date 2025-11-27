# Migration Instructions: Add Gradient Colors Support

## 🚀 Quick Migration (Option 1 - Recommended)

Run the SQL migration file directly on your database:

### Using psql (PostgreSQL command line):
```bash
psql $DATABASE_URL -f prisma/migrations/add_gradient_colors.sql
```

### Or if DATABASE_URL is in your .env file:
```bash
# Windows PowerShell
Get-Content prisma/migrations/add_gradient_colors.sql | psql $env:DATABASE_URL

# Windows Command Prompt
type prisma\migrations\add_gradient_colors.sql | psql %DATABASE_URL%

# Mac/Linux
psql $DATABASE_URL < prisma/migrations/add_gradient_colors.sql
```

### Or using Prisma's db execute:
```bash
npx prisma db execute --file prisma/migrations/add_gradient_colors.sql --schema prisma/schema.prisma
```

## 🔄 Option 2: Create Prisma Migration Manually

If you prefer using Prisma's migration system:

1. **Create the migration directory:**
   ```bash
   mkdir -p prisma/migrations/$(Get-Date -Format "yyyyMMddHHmmss")_add_gradient_colors
   ```

2. **Copy the SQL file:**
   ```bash
   copy prisma/migrations/add_gradient_colors.sql prisma/migrations/*_add_gradient_colors/migration.sql
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Mark migration as applied (if needed):**
   ```bash
   npx prisma migrate resolve --applied add_gradient_colors
   ```

## ✅ After Migration

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Verify the migration worked:**
   ```bash
   npx prisma studio
   ```
   - Check that `Team` table has `gradientColors` column
   - Check that `MemberPreferences` table has `gradientColors` column

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## 🐛 Troubleshooting

### If migration fails with "column already exists":
The columns might already exist. Check with:
```bash
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'gradientColors';"
```

### If you need to rollback:
```sql
-- Remove the columns (be careful - this will delete data!)
ALTER TABLE "Team" DROP COLUMN IF EXISTS "gradientColors";
ALTER TABLE "MemberPreferences" DROP COLUMN IF EXISTS "gradientColors";
```

### Regenerate Prisma Client:
If you get type errors after migration:
```bash
npx prisma generate
```

## 📝 What the Migration Does

1. ✅ Adds `gradientColors TEXT[]` column to `Team` table
2. ✅ Adds `gradientColors TEXT[]` column to `MemberPreferences` table  
3. ✅ Migrates existing `gradientStartColor` and `gradientEndColor` to `gradientColors` array
4. ✅ Maintains backward compatibility with old start/end color fields

## ✨ Ready to Test

After migration, you can:
- Go to Settings → Background Personalization
- Select "Gradient" as background type
- Click "Add Color" to add more colors
- Remove colors (minimum 2 required)
- See live preview of your multi-color gradient

