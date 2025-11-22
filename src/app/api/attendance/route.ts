import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, isAdmin } from '@/lib/rbac'
import { updateAttendanceStatuses } from '@/lib/attendance'
import { z } from 'zod'

const getAttendanceSchema = z.object({
  teamId: z.string(),
})

// GET /api/attendance?teamId=xxx
// List all attendance events for a team
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
    }

    await requireMember(session.user.id, teamId)

    // Update statuses before fetching
    await updateAttendanceStatuses(teamId)

    const isAdminUser = await isAdmin(session.user.id, teamId)

    // Get all attendance records for team events
    const attendances = await prisma.attendance.findMany({
      where: {
        teamId,
      },
      include: {
        calendarEvent: {
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            subteam: true,
          },
        },
        checkIns: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            checkedInAt: 'asc',
          },
        },
        _count: {
          select: {
            checkIns: true,
          },
        },
      },
      orderBy: {
        calendarEvent: {
          startUTC: 'desc',
        },
      },
    })

    // If not an admin, only return their own check-in status
    const sanitizedAttendances = attendances.map((attendance) => {
      if (!isAdminUser) {
        // Members can only see their own check-in status
        const userCheckIn = attendance.checkIns.find((ci) => ci.user.id === session.user.id)
        return {
          ...attendance,
          checkIns: userCheckIn ? [userCheckIn] : [],
          _count: { checkIns: attendance._count.checkIns }, // Keep total count visible
        }
      }
      return attendance
    })

    return NextResponse.json({ attendances: sanitizedAttendances, isAdmin: isAdminUser })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

