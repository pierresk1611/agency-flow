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

    // Check if user has permission (Admin, Account, Traffic, Superadmin)
    if (!['ADMIN', 'ACCOUNT', 'TRAFFIC', 'SUPERADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
