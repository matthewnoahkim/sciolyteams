import { prisma } from './prisma'
import { Division } from '@prisma/client'

interface ConflictCache {
  [division: string]: Map<string, Set<string>> // eventId -> Set of conflicting eventIds
}

const conflictCache: ConflictCache = {}

/**
 * Load conflict groups for a division into memory
 */
export async function loadConflictsForDivision(division: Division): Promise<void> {
  if (conflictCache[division]) return // Already loaded

  const conflictGroups = await prisma.conflictGroup.findMany({
    where: { division },
    include: {
      events: {
        include: {
          event: true,
        },
      },
    },
  })

  const eventConflictMap = new Map<string, Set<string>>()

  // Build a map of eventId -> all conflicting eventIds (events in same group)
  for (const group of conflictGroups) {
    const eventIds = group.events.map(e => e.eventId)
    
    for (const eventId of eventIds) {
      if (!eventConflictMap.has(eventId)) {
        eventConflictMap.set(eventId, new Set())
      }
      // Add all other events in the group as conflicts
      for (const conflictingEventId of eventIds) {
        if (conflictingEventId !== eventId) {
          eventConflictMap.get(eventId)!.add(conflictingEventId)
        }
      }
    }
  }

  conflictCache[division] = eventConflictMap
}

/**
 * Get all events that conflict with a given event
 */
export function getConflictingEvents(division: Division, eventId: string): string[] {
  if (!conflictCache[division]) {
    throw new Error(`Conflicts not loaded for division ${division}`)
  }
  
  const conflicts = conflictCache[division].get(eventId)
  return conflicts ? Array.from(conflicts) : []
}

/**
 * Check if a member can be assigned to an event without conflicts
 */
export async function checkConflicts(
  membershipId: string,
  teamId: string,
  eventId: string
): Promise<{ hasConflict: boolean; conflictingEvents?: string[] }> {
  // Get the event to know its division
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { division: true },
  })

  if (!event) {
    throw new Error('Event not found')
  }

  // Ensure conflicts are loaded
  await loadConflictsForDivision(event.division)

  // Get conflicting event IDs
  const conflictingEventIds = getConflictingEvents(event.division, eventId)
  
  if (conflictingEventIds.length === 0) {
    return { hasConflict: false }
  }

  // Check if member is already assigned to any conflicting events in this team
  const existingAssignments = await prisma.rosterAssignment.findMany({
    where: {
      membershipId,
      teamId,
      eventId: {
        in: conflictingEventIds,
      },
    },
    include: {
      event: {
        select: { name: true },
      },
    },
  })

  if (existingAssignments.length > 0) {
    return {
      hasConflict: true,
      conflictingEvents: existingAssignments.map(a => a.event.name),
    }
  }

  return { hasConflict: false }
}

/**
 * Check if adding a member to an event would exceed capacity
 */
export async function checkCapacity(
  teamId: string,
  eventId: string
): Promise<{ atCapacity: boolean; currentCount: number; maxCount: number }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { maxCompetitors: true },
  })

  if (!event) {
    throw new Error('Event not found')
  }

  const currentCount = await prisma.rosterAssignment.count({
    where: {
      teamId,
      eventId,
    },
  })

  return {
    atCapacity: currentCount >= event.maxCompetitors,
    currentCount,
    maxCount: event.maxCompetitors,
  }
}

/**
 * Validate a roster assignment before creation
 */
export async function validateRosterAssignment(
  membershipId: string,
  teamId: string,
  eventId: string
): Promise<{ valid: boolean; error?: string; code?: string }> {
  // Check if assignment already exists
  const existing = await prisma.rosterAssignment.findUnique({
    where: {
      membershipId_eventId: {
        membershipId,
        eventId,
      },
    },
  })

  if (existing) {
    return {
      valid: false,
      error: 'Member is already assigned to this event',
      code: 'ALREADY_ASSIGNED',
    }
  }

  // Check capacity
  const capacityCheck = await checkCapacity(teamId, eventId)
  if (capacityCheck.atCapacity) {
    return {
      valid: false,
      error: `Event is at capacity (${capacityCheck.maxCount} competitors)`,
      code: 'EVENT_AT_CAP',
    }
  }

  // Check conflicts
  const conflictCheck = await checkConflicts(membershipId, teamId, eventId)
  if (conflictCheck.hasConflict) {
    return {
      valid: false,
      error: `Conflicts with: ${conflictCheck.conflictingEvents?.join(', ')}`,
      code: 'CONFLICT_BLOCK',
    }
  }

  // Check that member belongs to the team
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: {
      team: true,
      club: true,
    },
  })

  if (!membership) {
    return {
      valid: false,
      error: 'Membership not found',
      code: 'MEMBERSHIP_NOT_FOUND',
    }
  }

  if (membership.teamId !== teamId) {
    return {
      valid: false,
      error: 'Member does not belong to this team',
      code: 'INVALID_TEAM',
    }
  }

  // Check division match
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { division: true },
  })

  if (!event) {
    return {
      valid: false,
      error: 'Event not found',
      code: 'EVENT_NOT_FOUND',
    }
  }

  if (event.division !== membership.club.division) {
    return {
      valid: false,
      error: `Event is for Division ${event.division}, but club is Division ${membership.club.division}`,
      code: 'DIVISION_MISMATCH',
    }
  }

  return { valid: true }
}
