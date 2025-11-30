import { prisma } from './prisma'
import { Role } from '@prisma/client'

/**
 * Get user's membership and role in a club
 */
export async function getUserMembership(userId: string, clubId: string) {
  return prisma.membership.findUnique({
    where: {
      userId_clubId: {
        userId,
        clubId,
      },
    },
    include: {
      club: true,
      team: true,
      user: true,
    },
  })
}

/**
 * Check if user is an admin of a club
 */
export async function isAdmin(userId: string, clubId: string): Promise<boolean> {
  const membership = await getUserMembership(userId, clubId)
  return membership?.role === Role.ADMIN
}

/**
 * Check if user is a member of a club (any role)
 */
export async function isMember(userId: string, clubId: string): Promise<boolean> {
  const membership = await getUserMembership(userId, clubId)
  return !!membership
}

/**
 * Require admin role, throw if not authorized
 */
export async function requireAdmin(userId: string, clubId: string) {
  const isAuth = await isAdmin(userId, clubId)
  if (!isAuth) {
    throw new Error('UNAUTHORIZED: Admin role required')
  }
}

/**
 * Require club membership (any role), throw if not authorized
 */
export async function requireMember(userId: string, clubId: string) {
  const isAuth = await isMember(userId, clubId)
  if (!isAuth) {
    throw new Error('UNAUTHORIZED: Club membership required')
  }
}

/**
 * Get all clubs a user belongs to
 */
export async function getUserClubs(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      club: true,
      team: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
