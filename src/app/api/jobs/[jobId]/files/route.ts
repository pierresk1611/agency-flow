import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { fileUrl, fileType } = body

    if (!fileUrl) {
        return NextResponse.json({ error: 'Chýba odkaz na súbor' }, { status: 400 })
    }

    // Uložíme súbor priradený k Jobu
    const file = await prisma.file.create({
      data: {
        jobId: params.jobId,
        fileUrl: fileUrl.trim(),
        fileType: fileType || 'LINK',
        uploadedBy: session.userId // ID Superadmina alebo užívateľa
      }
    })

    return NextResponse.json(file)
  } catch (error: any) {
    console.error("JOB FILE ERROR:", error)
    return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 })
  }
}