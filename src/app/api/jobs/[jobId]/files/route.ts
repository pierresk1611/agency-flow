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
