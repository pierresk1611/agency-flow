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

    // 5. NOTIFIKÁCIE
    // Načítame job a ľudí na ňom
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { assignments: true, campaign: { include: { client: { include: { agency: true } } } } }
    })

    if (job) {
      const recipients = new Set<string>()

      // A) Priradení kreatívci (okrem autora)
      job.assignments.forEach(a => {
        if (a.userId !== userId) recipients.add(a.userId)
      })

      // B) TRAFFIC alebo ADMIN
      const trafficUsers = await prisma.user.findMany({
        where: { role: 'TRAFFIC', active: true, agencyId: job.campaign.client.agencyId }
      })

      if (trafficUsers.length > 0) {
        trafficUsers.forEach(u => {
          if (u.id !== userId) recipients.add(u.id)
        })
      } else {
        // Fallback na ADMIN
        const adminUsers = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SUPERADMIN'] }, active: true, agencyId: job.campaign.client.agencyId }
        })
        adminUsers.forEach(u => {
          if (u.id !== userId) recipients.add(u.id)
        })
      }

      // Odoslanie
      const { createNotification } = await import('@/lib/notifications')
      const notifTitle = `Nový komentár: ${job.title}`
      const notifMessage = `${comment.user.name || 'Kolega'} pridal komentár: "${text.substring(0, 50)}..."`
      const notifLink = `/${job.campaign.client.agency.slug}/jobs/${jobId}` // Pozor: nevieme slug priamo z jobu bez joinu, ale campaign->client->agency

      // Musíme dočítať slug ak chceme link
      const agencySlug = job.campaign.client.agency.slug // Prisma include to potiahne ak pridame

      for (const recipientId of Array.from(recipients)) {
        await createNotification(recipientId, notifTitle, notifMessage, `/${agencySlug}/jobs/${jobId}`)
      }
    }

    return NextResponse.json(comment)

  } catch (error: any) {
    console.error('Comment error DETAIL:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
