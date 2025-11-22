import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// WARNING: This endpoint allows deleting users
// Only use in development environments with proper access control

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Delete user and all related data (cascade delete)
    await prisma.user.delete({
      where: { id: userId },
    })

    // Log the deletion
    await prisma.activityLog.create({
      data: {
        action: 'USER_DELETED',
        description: `User with ID ${userId} was deleted from dev panel`,
        metadata: { userId },
      },
    }).catch(() => {
      // Ignore if ActivityLog table doesn't exist yet
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

