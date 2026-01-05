import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { tenderId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { fileUrl, fileType } = body

    if (!fileUrl || !fileUrl.trim()) {
      return NextResponse.json({ error: 'Chýba odkaz na súbor' }, { status: 400 })
    }

    // Overíme, či tender existuje a patrí do agentúry
    const tender = await prisma.tender.findUnique({
      where: { id: params.tenderId }
    })

    if (!tender || (tender.agencyId !== session.agencyId && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Tender nenájdený alebo prístup zamietnutý' }, { status: 404 })
    }

    // Vytvorenie záznamu súboru priradeného k tendru
    const file = await prisma.file.create({
      data: {
        tenderId: params.tenderId,
        fileUrl: fileUrl.trim(),
        fileType: fileType?.toUpperCase() || 'LINK',
        uploadedBy: session.userId
      }
    })

    return NextResponse.json(file)
  } catch (error: any) {
    console.error("TENDER FILE ERROR:", error)
    return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 })
  }
}
