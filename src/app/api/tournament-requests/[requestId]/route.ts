import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH - Update tournament hosting request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = params
    const body = await request.json()
    const { status, reviewNotes } = body

    // Validate status
    if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get the current request
    const currentRequest = await prisma.tournamentHostingRequest.findUnique({
      where: { id: requestId },
      include: { tournament: true },
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // If approving and no tournament exists yet, create one
    if (status === 'APPROVED' && !currentRequest.tournament) {
      // Generate a slug from the tournament name
      const baseSlug = currentRequest.preferredSlug || 
        currentRequest.tournamentName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      
      // Ensure slug is unique
      let slug = baseSlug
      let counter = 1
      while (await prisma.tournament.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Determine division - handle "B&C" case
      let division: 'B' | 'C' = 'C'
      if (currentRequest.division === 'B') {
        division = 'B'
      } else if (currentRequest.division === 'C') {
        division = 'C'
      }
      // For "B&C", default to C (can be changed later)

      // Create tournament and update request in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the tournament
        const tournament = await tx.tournament.create({
          data: {
            name: currentRequest.tournamentName,
            slug,
            division,
            description: currentRequest.otherNotes,
            isOnline: currentRequest.tournamentFormat === 'satellite',
            startDate: new Date(), // Default to now, TD can update later
            endDate: new Date(),
            startTime: new Date(),
            endTime: new Date(),
            location: currentRequest.location,
            approved: true,
            createdById: session.user.id,
            hostingRequestId: requestId,
          },
        })

        // Update the request status
        const updatedRequest = await tx.tournamentHostingRequest.update({
          where: { id: requestId },
          data: {
            status,
            reviewNotes: reviewNotes || null,
          },
          include: {
            tournament: true,
          },
        })

        return updatedRequest
      })

      return NextResponse.json({ 
        success: true, 
        request: result 
      })
    }

    // For non-approval or if tournament already exists, just update the status
    const updatedRequest = await prisma.tournamentHostingRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewNotes: reviewNotes || null,
      },
      include: {
        tournament: true,
      },
    })

    return NextResponse.json({ 
      success: true, 
      request: updatedRequest 
    })
  } catch (error) {
    console.error('Error updating tournament hosting request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a tournament hosting request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params

    // First, find and delete any associated tournament
    const hostingRequest = await prisma.tournamentHostingRequest.findUnique({
      where: { id: requestId },
      include: { tournament: true },
    })

    if (hostingRequest?.tournament) {
      // Delete the tournament first (this will cascade delete related records)
      await prisma.tournament.delete({
        where: { id: hostingRequest.tournament.id },
      })
    }

    // Then delete the hosting request
    await prisma.tournamentHostingRequest.delete({
      where: { id: requestId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tournament hosting request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
}

