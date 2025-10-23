import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCaptain } from '@/lib/rbac'

// DELETE /api/attendance/[attendanceId]/checkin/[checkInId]
// Delete a check-in (captains only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { attendanceId: string; checkInId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attendanceId, checkInId } = params

    // Get the attendance record to verify team
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    })

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance not found' }, { status: 404 })
    }

    // Only captains can delete check-ins
    await requireCaptain(session.user.id, attendance.teamId)

    // Verify the check-in belongs to this attendance
    const checkIn = await prisma.attendanceCheckIn.findUnique({
      where: { id: checkInId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    if (checkIn.attendanceId !== attendanceId) {
      return NextResponse.json({ error: 'Check-in does not belong to this attendance' }, { status: 400 })
    }

    // Delete the check-in
    await prisma.attendanceCheckIn.delete({
      where: { id: checkInId },
    })

    return NextResponse.json({
      message: 'Check-in removed successfully',
      removedUser: {
        id: checkIn.user.id,
        name: checkIn.user.name,
        email: checkIn.user.email,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Delete check-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

