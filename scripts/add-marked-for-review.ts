import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding markedForReview column to AttemptAnswer table...')
  
  try {
    // Add markedForReview column
    console.log('Adding markedForReview column...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AttemptAnswer" 
      ADD COLUMN IF NOT EXISTS "markedForReview" BOOLEAN NOT NULL DEFAULT false;
    `)
    
    console.log('✅ AttemptAnswer table updated successfully!')
    console.log('The markedForReview column has been added.')
  } catch (error: any) {
    console.error('❌ Error updating table:', error.message)
    if (!error.message.includes('does not exist') && !error.message.includes('already exists')) {
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()

