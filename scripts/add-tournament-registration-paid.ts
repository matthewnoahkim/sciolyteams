import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding paid column to TournamentRegistration table...')
  
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "TournamentRegistration" ADD COLUMN IF NOT EXISTS "paid" BOOLEAN NOT NULL DEFAULT false;
    `)
    
    console.log('✅ Successfully added paid column to TournamentRegistration table!')
  } catch (error) {
    console.error('❌ Error adding paid column:', error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

