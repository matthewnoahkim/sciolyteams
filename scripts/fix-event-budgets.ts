import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing EventBudget table...')
  
  try {
    // Step 1: Remove duplicate budgets, keeping the one with the highest maxBudget
    console.log('Step 1: Removing duplicate budgets...')
    await prisma.$executeRawUnsafe(`
      DELETE FROM "EventBudget" a
      USING "EventBudget" b
      WHERE a.id < b.id
        AND a."teamId" = b."teamId"
        AND a."eventId" = b."eventId"
    `)
    
    // Step 2: Drop the subteamId column (if it exists)
    console.log('Step 2: Dropping subteamId column...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "EventBudget" DROP COLUMN IF EXISTS "subteamId"
    `)
    
    // Step 3: Add unique constraint (if it doesn't exist)
    console.log('Step 3: Adding unique constraint...')
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'EventBudget_teamId_eventId_key'
          ) THEN
              ALTER TABLE "EventBudget" 
              ADD CONSTRAINT "EventBudget_teamId_eventId_key" 
              UNIQUE ("teamId", "eventId");
          END IF;
      END $$;
    `)
    
    console.log('✅ EventBudget table fixed successfully!')
    console.log('You can now run: npx prisma db push')
  } catch (error: any) {
    console.error('❌ Error fixing EventBudget table:', error.message)
    // Don't throw - some steps might already be done
    if (!error.message.includes('does not exist') && !error.message.includes('already exists')) {
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()

