import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { jobId, userId, roleOnJob } = body

    if (!jobId || !userId) {
      return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    // Overenie, či užívateľ ešte nie je priradený
    const existing = await prisma.jobAssignment.findFirst({
      where: { jobId, userId }
    })

    if (existing) {
      return NextResponse.json({ message: 'Užívateľ už je priradený' })
    }

    const assignment = await prisma.jobAssignment.create({
      data: {
        jobId,
        userId,
        roleOnJob: roleOnJob?.trim() || 'Contributor',
      },
      include: { job: { include: { campaign: { include: { client: { include: { agency: true } } } } } } } // Fetch deeply for notification
    })

    // NOTIFIKÁCIA: Assign Job
    if ((assignment as any).job) {
      const agencySlug = (assignment as any).job.campaign.client.agency.slug
      await createNotification(
        userId,
        "Nový Job",
        `Boli ste priradený na projekt: ${(assignment as any).job.title} (${(assignment as any).job.campaign.client.name})`,
        `/${agencySlug}/jobs/${jobId}`
      )
    }

    return NextResponse.json(assignment)

  } catch (error: any) {
    console.error("JOB ASSIGNMENT ERROR:", error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
