import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { revalidatePath } from 'next/cache'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB for background images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

// POST - Upload background image
export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can upload background images
    await requireAdmin(session.user.id, params.teamId)

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Delete old background image if it exists
    if (team.backgroundImageUrl) {
      try {
        const oldFilePath = join(process.cwd(), 'public', team.backgroundImageUrl)
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath)
        }
      } catch (err) {
        console.error('Failed to delete old background image:', err)
        // Continue even if deletion fails
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `background-${timestamp}-${randomString}.${extension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const filePath = join(uploadsDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const imageUrl = `/uploads/${filename}`

    // Update team with new background image URL
    await prisma.team.update({
      where: { id: params.teamId },
      data: {
        backgroundImageUrl: imageUrl,
        backgroundType: 'image',
      },
    })

    revalidatePath(`/club/${params.teamId}`)

    return NextResponse.json({ imageUrl })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Background image upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete background image
export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete background images
    await requireAdmin(session.user.id, params.teamId)

    // Get team to find the image URL
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Delete file from filesystem
    if (team.backgroundImageUrl) {
      try {
        const filePath = join(process.cwd(), 'public', team.backgroundImageUrl)
        if (existsSync(filePath)) {
          await unlink(filePath)
        }
      } catch (err) {
        console.error('Failed to delete background image file:', err)
        // Continue even if file deletion fails
      }
    }

    // Update team to remove background image
    await prisma.team.update({
      where: { id: params.teamId },
      data: {
        backgroundImageUrl: null,
        backgroundType: 'image', // Keep image type selected for future uploads
      },
    })

    revalidatePath(`/club/${params.teamId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Delete background image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

