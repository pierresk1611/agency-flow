import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
    if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    
    const tenders = await prisma.tender.findMany({
        where: { agencyId: agency.id, archivedAt: null },
        orderBy: { deadline: 'asc' }
    })
    return NextResponse.json(tenders)
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
    const session = getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TRAFFIC')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
    if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })

    const body = await request.json()
    const { title, deadline, budget } = body

    if (!title || !deadline) return NextResponse.json({ error: 'Chýbajú údaje' }, { status: 400 })

    const tender = await prisma.tender.create({
        data: {
            title,
            deadline: new Date(deadline),
            budget: parseFloat(budget || '0'),
            agencyId: agency.id,
            status: 'TODO'
        }
    })
    return NextResponse.json(tender)
}