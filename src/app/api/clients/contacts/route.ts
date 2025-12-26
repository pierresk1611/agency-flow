import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, name, email, phone, position } = body

    if (!clientId || !name) {
      return NextResponse.json({ error: 'Chýba meno alebo ID klienta' }, { status: 400 })
    }

    // Overenie, či klient patrí do agentúry session
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const contact = await prisma.contactPerson.create({
      data: { clientId, name, email, phone, position }
    })

    return NextResponse.json(contact)
  } catch (error: any) {
    console.error('CREATE_CONTACT_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
