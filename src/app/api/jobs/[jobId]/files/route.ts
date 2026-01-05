import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getSession()
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    let { fileUrl, fileType, name } = body

    if (!fileUrl)
      return NextResponse.json({ error: 'Chýba URL súboru' }, { status: 400 })

    // Ak link nezačína na http/https, pridáme https
    if (!/^https?:\/\//i.test(fileUrl)) {
      fileUrl = `https://${fileUrl}`
    }

    // Verify Job belongs to agency
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: { campaign: { include: { client: true } } }
    })

    if (!job || (job.campaign.client.agencyId !== session.agencyId && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
    }

    const file = await prisma.file.create({
      data: {
        jobId: params.jobId,
        name: name?.trim() || 'Odkaz',
        fileUrl: fileUrl.trim(),
        fileType: fileType || 'LINK',
        uploadedBy: session.userId
      }
    })

    return NextResponse.json(file)

  } catch (error: any) {
    console.error("JOB FILE POST ERROR:", error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
