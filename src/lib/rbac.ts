import { prisma } from './prisma'
import { Role } from '@prisma/client'

/**
 * Get user's membership and role in a team
 */
export async function getUserMembership(userId: string, teamId: string) {
  return prisma.membership.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    include: {
      team: true,
      subteam: true,
      user: true,
    },
  })
}

/**
 * Check if user is a captain of a team
 */
export async function isCaptain(userId: string, teamId: string): Promise<boolean> {
  const membership = await getUserMembership(userId, teamId)
  return membership?.role === Role.CAPTAIN
}

/**
 * Check if user is a member of a team (any role)
 */
export async function isMember(userId: string, teamId: string): Promise<boolean> {
  const membership = await getUserMembership(userId, teamId)
  return !!membership
}

/**
 * Require captain role, throw if not authorized
 */
export async function requireCaptain(userId: string, teamId: string) {
  const isAuth = await isCaptain(userId, teamId)
  if (!isAuth) {
    throw new Error('UNAUTHORIZED: Captain role required')
  }
}

/**
 * Require team membership (any role), throw if not authorized
 */
export async function requireMember(userId: string, teamId: string) {
  const isAuth = await isMember(userId, teamId)
  if (!isAuth) {
    throw new Error('UNAUTHORIZED: Team membership required')
  }
}

/**
 * Get all teams a user belongs to
 */
export async function getUserTeams(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      team: true,
      subteam: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

