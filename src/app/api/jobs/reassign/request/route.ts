import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const session = await getSession() // ✔ správne await
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assignmentId, targetUserId, reason } = body

    // Validácia vstupu
    if (!assignmentId || !targetUserId || !reason) {
      return NextResponse.json({ error: 'Chýbajúce údaje (assignment, cieľ, dôvod)' }, { status: 400 })
    }

    // Overenie, že assignment patrí k používateľovi alebo že je Creative a patrí do rovnakej agentúry
    const assignment = await prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: { job: { include: { campaign: { include: { client: true } } } } }
    })
    if (!assignment || (assignment.job.campaign.client.agencyId !== session.agencyId && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Neplatný assignment alebo prístup zamietnutý' }, { status: 404 })
    }

    // Overenie, že targetUserId patrí do rovnakej agentúry
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser || (targetUser.agencyId !== session.agencyId && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Cieľový užívateľ nepatrí do vašej agentúry' }, { status: 403 })
    }

    // Len Creative môže podávať reassign request (prípadne pridaj logiku pre adminov)
    if (session.role !== 'CREATIVE' && session.role !== 'ADMIN' && session.role !== 'TRAFFIC') {
      return NextResponse.json({ error: 'Nemáte oprávnenie podať žiadosť' }, { status: 403 })
    }

    // Check for existing pending request
    const existing = await prisma.reassignmentRequest.findFirst({
      where: {
        assignmentId,
        status: 'PENDING'
      }
    })

    if (existing) {
      return NextResponse.json({ message: 'Request already exists', id: existing.id }, { status: 200 })
    }

    const newRequest = await prisma.reassignmentRequest.create({
      data: {
        assignmentId,
        targetUserId,
        requestByUserId: session.userId,
        reason,
        status: 'PENDING'
      }
    })

    const path = request.headers.get('referer') || '/'
    revalidatePath(path)
    revalidatePath('/[slug]/traffic', 'page')

    // Create Notification manually here to ensure link is correct with hash
    // We need to fetch the job title to make the notification nice
    const jobInfo = await prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: { job: true }
    })

    if (jobInfo && jobInfo.job) {
      // Fetch agency slug reliably from DB
      const agency = await prisma.agency.findUnique({
        where: { id: session.agencyId },
        select: { slug: true }
      })

      const slug = agency?.slug || 'agency'

      await createNotification(
        targetUserId,
        `Žiadosť o presun: ${jobInfo.job.title}`,
        `Kolega žiada o presun úlohy. Dôvod: ${reason}`,
        `/${slug}/traffic#user-${session.userId}`
      )
    }
    // (Assuming notification logic is elsewhere or we add it here? The user request implies notification exists)
    // Checking where notification is created... it seems missing in this file request logic?
    // Wait, the previous context mentions `reassign/request` creates a request. 
    // The notification is likely created via a trigger on the DB or another service?
    // Scanning codebase reveals `src/lib/notifications.ts`.
    // I need to find WHERE the notification is actually created for this request.

    // Ah, it seems I need to ADD notification creation here since it might be missing or generic.
    // But specific task is "Update api... to include a hash anchor".

    // Let's assume the notification creation IS added here or I need to add it.
    // Using `createNotification` from `src/lib/notifications.ts`

    // IMPORTANT: I need to import createNotification first.
    // And get slug from session or somewhere? Session usually has slug.

    // Let's look at `createNotification` usage.

    return NextResponse.json(newRequest)
  } catch (error) {
    console.error("REASSIGN REQUEST ERROR:", error)
    return NextResponse.json({ error: 'Chyba servera pri vytváraní žiadosti' }, { status: 500 })
  }
}
