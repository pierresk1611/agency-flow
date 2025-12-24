import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId, name, email, phone, position } = body

    if (!clientId || !name) {
        return NextResponse.json({ error: 'Chýba meno alebo ID klienta' }, { status: 400 })
    }

    const contact = await prisma.contactPerson.create({
        data: { clientId, name, email, phone, position }
    })

    return NextResponse.json(contact)
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}