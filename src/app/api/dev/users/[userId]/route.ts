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

    // Handle teams where this user is the creator
    // Transfer ownership to another admin before deleting the user
    await prisma.$transaction(async (tx) => {
      // Find all teams created by this user
      const teamsCreatedByUser = await tx.team.findMany({
        where: { createdById: userId },
        include: {
          memberships: {
            where: {
              role: 'ADMIN',
              userId: { not: userId }, // Exclude the user being deleted
            },
            take: 1,
            orderBy: { createdAt: 'asc' }, // Get the oldest admin (likely most trusted)
          },
        },
      })

      // For each team, transfer ownership to another admin if available
      for (const team of teamsCreatedByUser) {
        if (team.memberships.length > 0) {
          // Transfer to first available admin
          await tx.team.update({
            where: { id: team.id },
            data: { createdById: team.memberships[0].userId },
          })
        } else {
          // No other admin exists - find any member to transfer to
          const anyMember = await tx.membership.findFirst({
            where: {
              teamId: team.id,
              userId: { not: userId },
            },
            orderBy: { createdAt: 'asc' },
          })

          if (anyMember) {
            // Transfer to first available member and make them admin
            await tx.team.update({
              where: { id: team.id },
              data: { createdById: anyMember.userId },
            })
            await tx.membership.update({
              where: { id: anyMember.id },
              data: { role: 'ADMIN' },
            })
          } else {
            // No other members - this team will be orphaned
            // In dev panel, we allow this - the team will be deleted when user is deleted
            // due to cascade, but createdById constraint will prevent it
            // So we need to delete the team first or handle the constraint
            // For now, we'll try to delete the team if it has no other members
            try {
              await tx.team.delete({
                where: { id: team.id },
              })
            } catch (e) {
              // If team deletion fails, we can't proceed with user deletion
              throw new Error(`Cannot delete user: team "${team.name}" has no other members and cannot be transferred`)
            }
          }
        }
      }

      // Now delete user and all related data (cascade delete)
      await tx.user.delete({
        where: { id: userId },
      })
    })

    // Log the deletion
    try {
      await prisma.activityLog.create({
        data: {
          action: 'USER_DELETED',
          description: `User with ID ${userId} was deleted from dev panel`,
          logType: 'ADMIN_ACTION',
          severity: 'WARNING',
          route: '/api/dev/users/[userId]',
          metadata: { userId },
        },
      })
    } catch (logError) {
      // Ignore if ActivityLog table doesn't exist yet or logging fails
      console.error('Failed to log user deletion:', logError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

