import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 1. Validate Session
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    // 2. Strict Isolation: Fetch ONLY notifications belonging to this specific user ID
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.userId,
        ...(slug ? {
          OR: [
            { link: { startsWith: `/${slug}` } },
            { link: '/planner' },
            { link: null }
          ]
        } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 to prevent overflow
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Notifications GET Error:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.text()
    const { id } = body ? JSON.parse(body) : { id: null }

    if (id) {
      // Security: verify ownership before update
      const existing = await prisma.notification.findUnique({
        where: { id }
      })

      if (!existing || existing.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      })
    } else {
      // Mark all as read for this user
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          isRead: false
        },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications PATCH Error:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}