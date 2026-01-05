import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session || !['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT'].includes(session.role)) {
            return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
        }

        const body = await request.json()
        const { assignmentId, targetUserId } = body

        if (!assignmentId || !targetUserId) {
            return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
        }

        // 1. Verify ownership/agency
        const check = await prisma.reassignmentRequest.findFirst({
            where: {
                assignmentId,
                targetUserId,
                status: 'PENDING',
                assignment: {
                    job: {
                        campaign: {
                            client: {
                                agencyId: session.agencyId
                            }
                        }
                    }
                }
            }
        })

        if (!check && session.role !== 'SUPERADMIN' && !session.godMode) {
            return NextResponse.json({ error: 'Žiadosť nenájdená alebo prístup zamietnutý' }, { status: 404 })
        }

        // Update request to REJECTED
        const updated = await prisma.reassignmentRequest.updateMany({
            where: {
                assignmentId,
                targetUserId,
                status: 'PENDING'
            },
            data: { status: 'REJECTED' }
        })

        const path = request.headers.get('referer') || '/'
        revalidatePath(path)
        revalidatePath('/[slug]/traffic', 'page')

        return NextResponse.json({ success: true, count: updated.count })

    } catch (error: any) {
        console.error("REJECT REQUEST ERROR:", error)
        return NextResponse.json({ error: error.message || 'Chyba pri zamietaní' }, { status: 500 })
    }
}
