import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getSession()
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check permissions if needed (Admin, Account, Traffic, Superadmin)
    if (!['ADMIN', 'ACCOUNT', 'TRAFFIC', 'SUPERADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify ownership
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: { campaign: { include: { client: true } } }
    })

    if (!job || (job.campaign.client.agencyId !== session.agencyId && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
    }

    // Archive the job by setting archivedAt
    const updated = await prisma.job.update({
      where: { id: params.jobId },
      data: {
        archivedAt: new Date(),
        status: 'DONE'
      }
    })

    return NextResponse.json(updated)

  } catch (error: any) {
    console.error("JOB ARCHIVE ERROR:", error)
    return NextResponse.json({ error: error.message || 'Archive failed' }, { status: 500 })
  }
}
