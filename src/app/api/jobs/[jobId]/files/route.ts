import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request, { params }: { params: { jobId: string } }) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    let { fileUrl, fileType, name } = body // <--- Prijímame name

    if (!fileUrl) return NextResponse.json({ error: 'Chýba URL' }, { status: 400 })

    // OPRAVA LINKU: Ak link nezačína na http, pridáme ho (prevencia relatívnych ciest)
    if (!fileUrl.startsWith('http')) {
        fileUrl = `https://${fileUrl}`
    }

    const file = await prisma.file.create({
      data: {
        jobId: params.jobId,
        name: name || "Odkaz",
        fileUrl: fileUrl.trim(),
        fileType: fileType || 'LINK',
        uploadedBy: session.userId 
      }
    })

    return NextResponse.json(file)
  } catch (error: any) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}