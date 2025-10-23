import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { AttendanceStatus } from '@prisma/client'

/**
 * Generate a random 8-character alphanumeric code (uppercase letters + digits)
 */
export function generateAttendanceCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Hash an attendance code using bcrypt
 */
export async function hashAttendanceCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

/**
 * Verify an attendance code against a hash
 */
export async function verifyAttendanceCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

/**
 * Check if the current time is within the meeting window (with grace period)
 */
export function isWithinMeetingWindow(
  eventStart: Date,
  eventEnd: Date,
  graceMinutes: number,
  now: Date = new Date()
): boolean {
  const windowStart = new Date(eventStart.getTime() - graceMinutes * 60 * 1000)
  const windowEnd = new Date(eventEnd.getTime() + graceMinutes * 60 * 1000)
  return now >= windowStart && now <= windowEnd
}

/**
 * Calculate the current status of an attendance event
 */
export function calculateAttendanceStatus(
  eventStart: Date,
  eventEnd: Date,
  graceMinutes: number,
  now: Date = new Date()
): AttendanceStatus {
  const windowStart = new Date(eventStart.getTime() - graceMinutes * 60 * 1000)
  const windowEnd = new Date(eventEnd.getTime() + graceMinutes * 60 * 1000)

  if (now < windowStart) {
    return AttendanceStatus.UPCOMING
  } else if (now >= windowStart && now <= windowEnd) {
    return AttendanceStatus.ACTIVE
  } else {
    return AttendanceStatus.ENDED
  }
}

/**
 * Check rate limiting for code attempts
 * Returns true if rate limit exceeded, false otherwise
 */
export async function checkRateLimit(
  attendanceId: string,
  userId: string | null,
  ipAddress: string,
  windowMinutes: number = 5,
  maxAttempts: number = 5
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)

  // Check attempts by userId or ipAddress
  const attempts = await prisma.attendanceCodeAttempt.count({
    where: {
      attendanceId,
      ...(userId ? { userId } : { ipAddress }),
      attemptedAt: {
        gte: windowStart,
      },
    },
  })

  return attempts >= maxAttempts
}

/**
 * Log a code attempt
 */
export async function logCodeAttempt(
  attendanceId: string,
  userId: string | null,
  ipAddress: string,
  success: boolean
): Promise<void> {
  await prisma.attendanceCodeAttempt.create({
    data: {
      attendanceId,
      userId,
      ipAddress,
      success,
    },
  })
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(headers: Headers): string {
  // Try various headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Generate CSV content for attendance export
 */
export function generateAttendanceCSV(data: {
  event: {
    title: string
  }
  checkIns: Array<{
    user: {
      name: string | null
      email: string
    }
    checkedInAt: Date
  }>
}): string {
  const headers = ['Name', 'Check In Time']

  const rows = data.checkIns.map((checkIn) => {
    const name = checkIn.user.name || checkIn.user.email
    const checkInTime = new Date(checkIn.checkedInAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    return [
      `"${name.replace(/"/g, '""')}"`, // Escape quotes in name
      checkInTime,
    ]
  })

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

/**
 * Update attendance statuses for all events in a team
 * Should be called periodically or when fetching attendance data
 */
export async function updateAttendanceStatuses(teamId: string): Promise<void> {
  const attendances = await prisma.attendance.findMany({
    where: {
      teamId,
      status: {
        in: [AttendanceStatus.UPCOMING, AttendanceStatus.ACTIVE],
      },
    },
    include: {
      calendarEvent: true,
    },
  })

  const now = new Date()

  for (const attendance of attendances) {
    const newStatus = calculateAttendanceStatus(
      attendance.calendarEvent.startUTC,
      attendance.calendarEvent.endUTC,
      attendance.graceMinutes,
      now
    )

    if (newStatus !== attendance.status) {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { status: newStatus },
      })
    }
  }
}

