import { prisma } from './prisma'

export async function logActivity(data: {
  action: string
  description: string
  userId?: string
  metadata?: any
}) {
  try {
    await prisma.activityLog.create({
      data: {
        action: data.action,
        description: data.description,
        userId: data.userId,
        metadata: data.metadata || null,
      },
    })
  } catch (error) {
    // Fail silently - logging shouldn't break the app
    console.error('Failed to log activity:', error)
  }
}

