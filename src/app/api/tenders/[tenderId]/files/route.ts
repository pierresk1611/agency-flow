import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request, { params }: { params: { tenderId: string } }) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await request.json()
    const { fileUrl, fileType } = body

    if (!fileUrl) return NextResponse.json({ error: 'Chýba URL' }, { status: 400 })

    const file = await prisma.file.create({
      data: {
        tenderId: params.tenderId, // <--- PRIRADENIE K TENDU
        fileUrl,
        fileType: fileType || 'DOCUMENT',
        uploadedBy: session.userId // Ukladáme ID prihláseného
      }
    })

    return NextResponse.json(file)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}