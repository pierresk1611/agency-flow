import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET: Zoznam všetkých šablón
export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const templates = await prisma.emailTemplate.findMany({
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(templates)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH: Úprava šablóny
export async function PATCH(request: Request) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, subject, htmlBody } = body // htmlBody = body from frontend

        if (!id || !subject || !htmlBody) {
            return NextResponse.json({ error: 'Chýbajúce údaje (id, subject, htmlBody)' }, { status: 400 })
        }

        const updated = await prisma.emailTemplate.update({
            where: { id },
            data: {
                subject,
                body: htmlBody
            }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        console.error("TEMPLATE PATCH ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
