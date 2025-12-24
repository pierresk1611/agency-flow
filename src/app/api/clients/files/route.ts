import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId, fileUrl, fileType, uploadedBy } = body

    if (!clientId || !fileUrl) {
      return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    const file = await prisma.file.create({
      data: {
        clientId,
        fileUrl,
        fileType: fileType || 'DOCUMENT',
        uploadedBy: uploadedBy || 'System'
      }
    })

    return NextResponse.json(file)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}