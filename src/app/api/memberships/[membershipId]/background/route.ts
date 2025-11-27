import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership, isAdmin } from '@/lib/rbac'
import { z } from 'zod'
import { join } from 'path'
import { existsSync } from 'fs'
import { unlink } from 'fs/promises'

const backgroundSchema = z.object({
  backgroundType: z.enum(['grid', 'solid', 'gradient', 'image']).optional(),
  backgroundColor: z.union([z.string().regex(/^#[0-9A-Fa-f]{6}$/), z.null()]).optional(),
  gradientStartColor: z.union([z.string().regex(/^#[0-9A-Fa-f]{6}$/), z.null()]).optional(),
  gradientEndColor: z.union([z.string().regex(/^#[0-9A-Fa-f]{6}$/), z.null()]).optional(),
})

async function deleteExistingImage(filePath?: string | null) {
  if (!filePath) return
  const absolute = join(process.cwd(), 'public', filePath)
  if (existsSync(absolute)) {
    try {
      await unlink(absolute)
    } catch (err) {
      console.error('Failed to delete member background image:', err)
    }
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { membershipId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.membership.findUnique({
      where: { id: params.membershipId },
      include: { preferences: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    const requesterMembership = await getUserMembership(session.user.id, membership.teamId)
    if (!requesterMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isSelf = membership.userId === session.user.id
    const isTeamAdmin = await isAdmin(session.user.id, membership.teamId)

    if (!isSelf && !isTeamAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validated = backgroundSchema.parse(body)

    const targetType = validated.backgroundType ?? 'grid'

    const updateData: Record<string, any> = {
      backgroundType: targetType,
    }

    if (targetType === 'solid') {
      if (!validated.backgroundColor) {
        return NextResponse.json(
          { error: 'Background color is required for solid backgrounds' },
          { status: 400 }
        )
      }
      updateData.backgroundColor = validated.backgroundColor
      updateData.gradientStartColor = null
      updateData.gradientEndColor = null
    } else if (targetType === 'gradient') {
      if (!validated.gradientStartColor || !validated.gradientEndColor) {
        return NextResponse.json(
          { error: 'Start and end colors are required for gradients' },
          { status: 400 }
        )
      }
      updateData.gradientStartColor = validated.gradientStartColor
      updateData.gradientEndColor = validated.gradientEndColor
      updateData.backgroundColor = null
    } else if (targetType === 'grid') {
      updateData.backgroundColor = null
      updateData.gradientStartColor = null
      updateData.gradientEndColor = null
    } else {
      updateData.backgroundColor = null
      updateData.gradientStartColor = null
      updateData.gradientEndColor = null
    }

    // If switching away from image or inheriting, drop the stored file
    if (targetType !== 'image' && membership.preferences?.backgroundImageUrl) {
      await deleteExistingImage(membership.preferences.backgroundImageUrl)
      updateData.backgroundImageUrl = null
    }

    const preferences = await prisma.memberPreferences.upsert({
      where: { membershipId: membership.id },
      update: updateData,
      create: {
        membershipId: membership.id,
        preferredEvents: [],
        avoidEvents: [],
        ...updateData,
      },
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update member background error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

