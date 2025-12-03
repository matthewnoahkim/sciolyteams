import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH - Update tournament hosting request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
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

    // Update the request
    const updatedRequest = await prisma.tournamentHostingRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewNotes: reviewNotes || null,
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

