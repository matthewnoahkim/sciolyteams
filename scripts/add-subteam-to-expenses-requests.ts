import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding subteamId to Expense and PurchaseRequest tables...')
  
  try {
    // Step 1: Add subteamId to Expense table
    console.log('Step 1: Adding subteamId to Expense table...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "subteamId" TEXT`)
    
    // Step 2: Add foreign key constraint for Expense
    console.log('Step 2: Adding foreign key constraint for Expense...')
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'Expense_subteamId_fkey'
          ) THEN
              ALTER TABLE "Expense" 
              ADD CONSTRAINT "Expense_subteamId_fkey" 
              FOREIGN KEY ("subteamId") 
              REFERENCES "Subteam"("id") 
              ON DELETE SET NULL;
          END IF;
      END $$;
    `)
    
    // Step 3: Add index on Expense.subteamId
    console.log('Step 3: Adding index on Expense.subteamId...')
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Expense_subteamId_idx" ON "Expense" ("subteamId")`)
    
    // Step 4: Add subteamId to PurchaseRequest table
    console.log('Step 4: Adding subteamId to PurchaseRequest table...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "PurchaseRequest" ADD COLUMN IF NOT EXISTS "subteamId" TEXT`)
    
    // Step 5: Add foreign key constraint for PurchaseRequest
    console.log('Step 5: Adding foreign key constraint for PurchaseRequest...')
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'PurchaseRequest_subteamId_fkey'
          ) THEN
              ALTER TABLE "PurchaseRequest" 
              ADD CONSTRAINT "PurchaseRequest_subteamId_fkey" 
              FOREIGN KEY ("subteamId") 
              REFERENCES "Subteam"("id") 
              ON DELETE SET NULL;
          END IF;
      END $$;
    `)
    
    // Step 6: Add index on PurchaseRequest.subteamId
    console.log('Step 6: Adding index on PurchaseRequest.subteamId...')
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PurchaseRequest_subteamId_idx" ON "PurchaseRequest" ("subteamId")`)
    
    // Step 7: Backfill subteamId for existing records based on requester/adder membership
    console.log('Step 7: Backfilling subteamId for existing records...')
    
    // Backfill PurchaseRequest.subteamId from requester's membership
    await prisma.$executeRawUnsafe(`
      UPDATE "PurchaseRequest" pr
      SET "subteamId" = m."subteamId"
      FROM "Membership" m
      WHERE pr."requesterId" = m.id
        AND pr."subteamId" IS NULL
        AND m."subteamId" IS NOT NULL;
    `)
    
    // Backfill Expense.subteamId from adder's membership
    await prisma.$executeRawUnsafe(`
      UPDATE "Expense" e
      SET "subteamId" = m."subteamId"
      FROM "Membership" m
      WHERE e."addedById" = m.id
        AND e."subteamId" IS NULL
        AND m."subteamId" IS NOT NULL;
    `)
    
    console.log('✅ Expense and PurchaseRequest tables updated successfully!')
    console.log('You can now run: npx prisma db push')
  } catch (error: any) {
    console.error('❌ Error updating tables:', error.message)
    if (!error.message.includes('does not exist') && !error.message.includes('already exists')) {
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()

