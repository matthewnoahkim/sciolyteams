import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, getUserMembership, isAdmin } from '@/lib/rbac'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { z } from 'zod'

const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB for PDFs

const createNoteSheetSchema = z.object({
  type: z.enum(['CREATED', 'UPLOADED']),
  content: z.string().optional(), // For CREATED type
})

// POST - Create or upload note sheet
export async function POST(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      include: {
        team: true,
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    await requireMember(session.user.id, test.teamId)

    const membership = await getUserMembership(session.user.id, test.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check if note sheets are enabled for this test
    if (!test.allowNoteSheet) {
      return NextResponse.json(
        { error: 'Note sheets are not enabled for this test' },
        { status: 400 }
      )
    }

    // Check if test is scheduled (has startAt)
    if (!test.startAt) {
      return NextResponse.json(
        { error: 'Note sheets can only be created for scheduled tests' },
        { status: 400 }
      )
    }

    // Check if user already has a note sheet for this test
    const existingNoteSheet = await prisma.noteSheet.findUnique({
      where: {
        testId_membershipId: {
          testId: params.testId,
          membershipId: membership.id,
        },
      },
    })

    // Allow uploading a new note sheet if the existing one is rejected
    if (existingNoteSheet && existingNoteSheet.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'You already have a note sheet for this test' },
        { status: 400 }
      )
    }

    // If there's a rejected note sheet, delete it to allow a new upload
    if (existingNoteSheet && existingNoteSheet.status === 'REJECTED') {
      // Delete the old rejected note sheet (including file if it exists)
      if (existingNoteSheet.filePath) {
        try {
          const fs = require('fs')
          const path = require('path')
          const filePath = path.join(process.cwd(), 'public', existingNoteSheet.filePath)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          console.error('Failed to delete old note sheet file:', err)
          // Continue anyway - file deletion failure shouldn't block the upload
        }
      }
      await prisma.noteSheet.delete({
        where: {
          id: existingNoteSheet.id,
        },
      })
    }

    const formData = await req.formData()
    const type = formData.get('type') as string

    if (type === 'CREATED') {
      const content = formData.get('content') as string
      if (!content) {
        return NextResponse.json(
          { error: 'Content is required for created note sheets' },
          { status: 400 }
        )
      }

      const noteSheet = await prisma.noteSheet.create({
        data: {
          testId: params.testId,
          membershipId: membership.id,
          type: 'CREATED',
          content,
          status: 'PENDING',
        },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json({ noteSheet })
    } else if (type === 'UPLOADED') {
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json(
          { error: 'File is required for uploaded note sheets' },
          { status: 400 }
        )
      }

      // Validate PDF
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Only PDF files are allowed' },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > MAX_PDF_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds 50MB limit' },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const extension = 'pdf'
      const filename = `note-sheet-${timestamp}-${randomString}.${extension}`

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'note-sheets')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Save file
      const filePath = join(uploadsDir, filename)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      const noteSheet = await prisma.noteSheet.create({
        data: {
          testId: params.testId,
          membershipId: membership.id,
          type: 'UPLOADED',
          filePath: `/uploads/note-sheets/${filename}`,
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
          status: 'PENDING',
        },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json({ noteSheet })
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be CREATED or UPLOADED' },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Create note sheet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get user's note sheet for a test
export async function GET(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const adminView = searchParams.get('admin') === 'true'

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      include: {
        team: true,
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    await requireMember(session.user.id, test.teamId)

    const membership = await getUserMembership(session.user.id, test.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    if (adminView) {
      // Admin view - get all note sheets for this test
      const isAdminUser = await isAdmin(session.user.id, test.teamId)
      if (!isAdminUser) {
        return NextResponse.json(
          { error: 'Only admins can view all note sheets' },
          { status: 403 }
        )
      }

      const noteSheets = await prisma.noteSheet.findMany({
        where: {
          testId: params.testId,
        },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          reviewer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ noteSheets })
    } else {
      // User view - get their own note sheet
      const noteSheet = await prisma.noteSheet.findUnique({
        where: {
          testId_membershipId: {
            testId: params.testId,
            membershipId: membership.id,
          },
        },
        include: {
          reviewer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json({ noteSheet })
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get note sheet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

