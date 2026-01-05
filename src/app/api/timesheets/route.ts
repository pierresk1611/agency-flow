import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const userId = session.userId
        const agencyId = session.agencyId

        const body = await request.json()
        const { jobId, action, description } = body // action: 'TOGGLE_TIMER' | 'TOGGLE_PAUSE'

        if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 })

        // 1. Verify that the job belongs to the session's agency
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { campaign: { include: { client: true } } }
        })

        if (!job || job.campaign.client.agencyId !== agencyId) {
            return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
        }

        let assignment = await prisma.jobAssignment.findFirst({
            where: { jobId, userId },
            include: {
                job: { include: { campaign: { include: { client: { include: { agency: true } } } } } },
                user: true
            }
        })

        if (!assignment) {
            // Ak neexistuje, vytvoríme (fallback)
            const newAssignment = await prisma.jobAssignment.create({
                data: { jobId, userId, roleOnJob: 'Contributor' }
            })
            // Fetch full Structure
            assignment = await prisma.jobAssignment.findUnique({
                where: { id: newAssignment.id },
                include: {
                    job: { include: { campaign: { include: { client: { include: { agency: true } } } } } },
                    user: true
                }
            })
        }

        // Safety check
        if (!assignment) return NextResponse.json({ error: 'Assignment error' }, { status: 500 })



        const runningTimer = await prisma.timesheet.findFirst({
            where: { jobAssignmentId: assignment.id, endTime: null }
        })

        // --- LOGIKA: PAUZA / RESUME ---
        if (action === 'TOGGLE_PAUSE' && runningTimer) {
            const now = new Date()

            if (runningTimer.isPaused) {
                // RESUME: Vypočítaj koľko trvala pauza a pripočítaj ju k totalPausedMinutes
                const pauseDiffMs = now.getTime() - new Date(runningTimer.lastPauseStart!).getTime()
                const pauseMinutes = Math.round(pauseDiffMs / 1000 / 60)

                const updated = await prisma.timesheet.update({
                    where: { id: runningTimer.id },
                    data: {
                        isPaused: false,
                        lastPauseStart: null,
                        totalPausedMinutes: runningTimer.totalPausedMinutes + pauseMinutes
                    }
                })
                return NextResponse.json({ status: 'resumed', data: updated })
            } else {
                // PAUSE: Zapíš začiatok pauzy
                const updated = await prisma.timesheet.update({
                    where: { id: runningTimer.id },
                    data: {
                        isPaused: true,
                        lastPauseStart: now
                    }
                })
                return NextResponse.json({ status: 'paused', data: updated })
            }
        }

        // --- LOGIKA: START / STOP ---
        if (runningTimer) {
            // ZASTAVIŤ
            const now = new Date()
            const totalElapsedMs = now.getTime() - new Date(runningTimer.startTime).getTime()

            // Ak zastavujeme počas pauzy, musíme pripočítať aj tú poslednú nedokončenú pauzu
            let finalPausedMinutes = runningTimer.totalPausedMinutes
            if (runningTimer.isPaused) {
                const lastPauseMs = now.getTime() - new Date(runningTimer.lastPauseStart!).getTime()
                finalPausedMinutes += Math.round(lastPauseMs / 1000 / 60)
            }

            const durationMinutes = Math.max(0, Math.round(totalElapsedMs / 1000 / 60) - finalPausedMinutes)

            const updated = await prisma.timesheet.update({
                where: { id: runningTimer.id },
                data: {
                    endTime: now,
                    durationMinutes,
                    description: description || "",
                    isPaused: false,
                    lastPauseStart: null
                }
            })

            // --- SYNC TO PLANNER (Capacity) ---
            try {
                // 1. Calculate TOTAL minutes worked on this job TODAY (including this new one)
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

                const dailyStats = await prisma.timesheet.aggregate({
                    _sum: { durationMinutes: true },
                    where: {
                        jobAssignment: {
                            userId: userId,
                            jobId: assignment.jobId
                        },
                        startTime: {
                            gte: startOfDay,
                            lt: endOfDay
                        }
                    }
                })

                const totalMinutesToday = dailyStats._sum.durationMinutes || durationMinutes // Fallback to current if null

                // 2. Check if Planner Entry exists
                const existingEntry = await prisma.plannerEntry.findFirst({
                    where: {
                        userId: userId,
                        jobId: assignment.jobId,
                        date: {
                            gte: startOfDay,
                            lt: endOfDay
                        }
                    }
                })

                if (existingEntry) {
                    await prisma.plannerEntry.update({
                        where: { id: existingEntry.id },
                        data: {
                            minutes: totalMinutesToday,
                            isDone: true
                        }
                    })
                } else {
                    await prisma.plannerEntry.create({
                        data: {
                            userId: userId,
                            jobId: assignment.jobId,
                            date: startOfDay,
                            minutes: totalMinutesToday,
                            isDone: true,
                            title: 'Odpracovaný čas (Stopky)'
                        }
                    })
                }
            } catch (err) {
                console.error("Failed to sync to planner:", err)
                // Non-blocking error
            }

            // NOTIFIKÁCIA: Timesheet Submit (Pre Traffic & Account)
            const agencyId = assignment.job.campaign.client.agencyId
            const slug = assignment.job.campaign.client.agency.slug

            const managers = await prisma.user.findMany({
                where: {
                    agencyId,
                    role: { in: ['TRAFFIC', 'ACCOUNT', 'ADMIN', 'SUPERADMIN'] }, // Pridal som aj Admina pre istotu
                    active: true
                },
                select: { id: true }
            })

            if (managers.length > 0) {
                const userName = assignment.user.name || 'Užívateľ'
                const jobTitle = assignment.job.title

                await prisma.notification.createMany({
                    data: managers.map(m => ({
                        userId: m.id,
                        title: 'Nový výkaz',
                        message: `${userName} pridal nový výkaz na "${jobTitle}".`,
                        link: `/${slug}/timesheets` // Link na kontrolu výkazov
                    }))
                })
            }

            return NextResponse.json({ status: 'stopped', data: updated })
        } else {
            // SPUSTIŤ
            const newTimer = await prisma.timesheet.create({
                data: {
                    jobAssignmentId: assignment.id,
                    startTime: new Date(),
                    status: 'PENDING',
                    totalPausedMinutes: 0,
                    isPaused: false
                }
            })
            return NextResponse.json({ status: 'started', data: newTimer })
        }

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}