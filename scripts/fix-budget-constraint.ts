import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing EventBudget unique constraint...')
  
  try {
    // Drop the custom indexes we created
    console.log('Dropping custom indexes...')
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "EventBudget_teamId_eventId_subteamId_key"`)
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "EventBudget_teamId_eventId_null_subteamId_key"`)
    
    // Prisma will create the proper constraint
    console.log('✅ Indexes dropped. Prisma will create the proper constraint.')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

