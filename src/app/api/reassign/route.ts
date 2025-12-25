import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { assignmentId, targetUserId, reason } = body

    if (!assignmentId || !targetUserId || !reason) {
        return NextResponse.json({ error: 'Chýbajúce údaje žiadosti' }, { status: 400 })
    }

    const newRequest = await prisma.reassignmentRequest.create({
      data: {
        assignmentId,
        targetUserId,
        requestByUserId: session.userId,
        reason,
        status: 'PENDING'
      }
    })

    return NextResponse.json(newRequest)
  } catch (error) {
    return NextResponse.json({ error: 'Chyba servera' }, { status: 500 })
  }
}