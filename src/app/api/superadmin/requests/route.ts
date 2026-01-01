
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as jwt from 'jsonwebtoken'
import { headers } from 'next/headers'
import { sendDynamicEmail } from '@/lib/email'

// FORCE LOCAL CONNECTION
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_Aw56YZHlVUhO@ep-calm-violet-aggutujf-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        },
    },
})

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

// Helper na overenie Superadmina
function isSuperAdmin(authHeader: string | null) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false
    const token = authHeader.split(' ')[1]
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        return decoded.role === 'SUPERADMIN'
    } catch (e) {
        return false
    }
}

// GET: Zoznam nevybavených žiadostí
export async function GET(request: Request) {
    const headersList = headers()
    const authHeader = headersList.get('authorization')

    if (!isSuperAdmin(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const pendingAgencies = await prisma.agency.findMany({
            where: {
                status: 'PENDING'
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                users: {
                    where: {
                        role: 'ADMIN' // Predpokladáme, že zakladateľ je prvý admin
                    },
                    select: {
                        name: true,
                        email: true
                    },
                    take: 1
                }
            }
        })

        const formatted = pendingAgencies.map(agency => ({
            id: agency.id,
            name: agency.name,
            slug: agency.slug,
            createdAt: agency.createdAt,
            contactName: agency.contactName || agency.users[0]?.name || 'N/A',
            email: agency.email || agency.users[0]?.email || 'N/A'
        }))

        return NextResponse.json(formatted)

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH: Schválenie alebo zamietnutie
export async function PATCH(request: Request) {
    const headersList = headers()
    const authHeader = headersList.get('authorization')

    if (!isSuperAdmin(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { agencyId, action } = body // action: 'APPROVE' | 'REJECT'

        if (!agencyId || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        if (action === 'APPROVE') {
            // 1. Aktivuj agentúru
            // 2. Aktivuj všetkých používateľov tejto agentúry (zatiaľ len admina)
            await prisma.$transaction([
                prisma.agency.update({
                    where: { id: agencyId },
                    data: { status: 'ACTIVE' }
                }),
                prisma.user.updateMany({
                    where: { agencyId: agencyId },
                    data: { active: true }
                })
            ])

            // Email notifikácia
            const adminUser = await prisma.user.findFirst({
                where: { agencyId: agencyId, role: 'ADMIN' }
            })

            // Fetch agency name for email
            const agency = await prisma.agency.findUnique({ where: { id: agencyId } })

            if (adminUser && agency) {
                await sendDynamicEmail('CLIENT_WELCOME_APPROVED', adminUser.email, {
                    agencyName: agency.name,
                    link: 'https://agency-flow.vercel.app/login'
                })
            }

            return NextResponse.json({ success: true, message: 'Agentúra schválená' })

        } else {
            // REJECT
            const agency = await prisma.agency.update({
                where: { id: agencyId },
                data: { status: 'REJECTED' }
            })

            const adminUser = await prisma.user.findFirst({
                where: { agencyId: agencyId, role: 'ADMIN' }
            })

            if (adminUser) {
                await sendDynamicEmail('CLIENT_REJECTED', adminUser.email, {
                    agencyName: agency.name
                })
            }

            return NextResponse.json({ success: true, message: 'Agentúra zamietnutá' })
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
