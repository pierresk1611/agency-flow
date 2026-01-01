import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { JobStatus } from '@prisma/client'

export async function PATCH(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    /* 1️⃣ AUTH */
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* 2️⃣ ROLE CHECK */
    const allowedRoles = ['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    /* 3️⃣ BODY */
    const body = await request.json()
    const { title, description, budget, status } = body

    /* 4️⃣ LOAD JOB + TENANT CHECK */
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        campaign: {
          client: {
            select: { agencyId: true },
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    /* 5️⃣ VALIDATION */
    const parsedBudget =
      budget !== undefined ? Number(budget) : undefined

    if (parsedBudget !== undefined && isNaN(parsedBudget)) {
      return NextResponse.json(
        { error: 'Invalid budget' },
        { status: 400 }
      )
    }

    if (status && !Object.values(JobStatus).includes(status as JobStatus)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    /* 6️⃣ UPDATE */
    const updatedJob = await prisma.job.update({
      where: { id: params.jobId },
      data: {
        title,
        description,
        budget: parsedBudget,
        status: status as JobStatus,
      },
    })

    return NextResponse.json(updatedJob)
  } catch (error: any) {
    console.error('JOB UPDATE ERROR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
