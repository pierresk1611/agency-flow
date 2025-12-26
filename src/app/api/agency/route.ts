import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession() // ✅ must await
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agency = await prisma.agency.findUnique({
    where: { id: session.agencyId } // konkrétna agentúra
  })
  
  if (!agency) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(agency)
}

export async function PATCH(request: Request) {
  const session = await getSession() // ✅ must await
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const updated = await prisma.agency.update({
    where: { id: session.agencyId }, // iba svoju agentúru
    data: body
  })

  return NextResponse.json(updated)
}