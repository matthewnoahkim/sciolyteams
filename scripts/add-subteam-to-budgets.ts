import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding subteamId to EventBudget table...')
  
  try {
    // Step 1: Add subteamId column (nullable)
    console.log('Step 1: Adding subteamId column...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "EventBudget" 
      ADD COLUMN IF NOT EXISTS "subteamId" TEXT;
    `)
    
    // Step 2: Add foreign key constraint
    console.log('Step 2: Adding foreign key constraint...')
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'EventBudget_subteamId_fkey'
          ) THEN
              ALTER TABLE "EventBudget" 
              ADD CONSTRAINT "EventBudget_subteamId_fkey" 
              FOREIGN KEY ("subteamId") 
              REFERENCES "Subteam"("id") 
              ON DELETE CASCADE;
          END IF;
      END $$;
    `)
    
    // Step 3: Drop old unique constraint
    console.log('Step 3: Dropping old unique constraint...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "EventBudget" 
      DROP CONSTRAINT IF EXISTS "EventBudget_teamId_eventId_key";
    `)
    
    // Step 4: Add new unique constraint with subteamId (handles NULL properly)
    console.log('Step 4: Adding new unique constraint with subteamId...')
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'EventBudget_teamId_eventId_subteamId_key'
          ) THEN
              -- Create unique index that handles NULL values properly
              CREATE UNIQUE INDEX "EventBudget_teamId_eventId_subteamId_key" 
              ON "EventBudget" ("teamId", "eventId", COALESCE("subteamId", ''))
              WHERE "subteamId" IS NOT NULL;
              
              -- For NULL subteamId, we need a separate constraint
              CREATE UNIQUE INDEX "EventBudget_teamId_eventId_null_subteamId_key" 
              ON "EventBudget" ("teamId", "eventId") 
              WHERE "subteamId" IS NULL;
          END IF;
      END $$;
    `)
    
    // Step 5: Add index on subteamId
    console.log('Step 5: Adding index on subteamId...')
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EventBudget_subteamId_idx" 
      ON "EventBudget" ("subteamId");
    `)
    
    console.log('✅ EventBudget table updated successfully!')
    console.log('You can now run: npx prisma db push')
  } catch (error: any) {
    console.error('❌ Error updating EventBudget table:', error.message)
    // Don't throw - some steps might already be done
    if (!error.message.includes('does not exist') && !error.message.includes('already exists')) {
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()

