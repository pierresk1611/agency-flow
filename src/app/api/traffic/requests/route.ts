import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const requests = await prisma.reassignmentRequest.findMany({
      where: {
        status: 'PENDING',
        assignment: { job: { campaign: { client: { agencyId: session.agencyId } } } }
      },
      include: {
        requestByUser: true,
        targetUser: true,
        assignment: { include: { job: { include: { campaign: { include: { client: true } } } } } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(requests)
  } catch (error) {
    console.error("FETCH_REQUESTS_ERROR:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { requestId, status } = body

    const req = await prisma.reassignmentRequest.findUnique({ where: { id: requestId } })
    if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (status === 'APPROVED') {
        await prisma.$transaction([
            prisma.reassignmentRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' }
            }),
            prisma.jobAssignment.update({
                where: { id: req.assignmentId },
                data: { userId: req.targetUserId }
            })
        ])
    } else {
        await prisma.reassignmentRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}