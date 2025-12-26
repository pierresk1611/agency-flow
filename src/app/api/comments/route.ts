import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    // 1. Načítanie tokenu z cookies
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Overenie tokenu
    let userId: string
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      userId = decoded.userId
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 3. Načítanie dát z requestu
    const { jobId, text } = await request.json()
    if (!jobId || !text) {
      return NextResponse.json({ error: 'Chýba text alebo ID jobu' }, { status: 400 })
    }

    console.log(`Ukladám komentár: User=${userId}, Job=${jobId}, Text=${text}`)

    // 4. Vytvorenie komentára
    const comment = await prisma.comment.create({
      data: {
        jobId,
        userId,
        text
      },
      include: { user: true } // vrátime meno autora
    })

    return NextResponse.json(comment)

  } catch (error: any) {
    console.error('Comment error DETAIL:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
