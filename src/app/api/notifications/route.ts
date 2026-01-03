import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const notes = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return NextResponse.json(notes || [])
  } catch (error) {
    console.error("Notifications GET Error:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.text()
    const { id } = body ? JSON.parse(body) : { id: null }

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      })
    } else {
      await prisma.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications PATCH Error:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}