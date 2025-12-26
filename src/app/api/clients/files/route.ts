import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, fileUrl, fileType } = body

    if (!clientId || !fileUrl) {
      return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    // Overenie, či klient patrí do agentúry užívateľa
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const file = await prisma.file.create({
      data: {
        clientId,
        fileUrl,
        fileType: fileType || 'DOCUMENT',
        uploadedBy: session.userId
      }
    })

    return NextResponse.json(file)
  } catch (error: any) {
    console.error('UPLOAD_FILE_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
