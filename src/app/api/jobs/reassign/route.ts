import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(request: Request) {
  try {
    const session = getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TRAFFIC' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
    }

    const body = await request.json()
    const { assignmentId, newUserId } = body

    if (!assignmentId || !newUserId) {
        return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    // Aktualizujeme priradenie na nového užívateľa
    const updated = await prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { userId: newUserId }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Chyba pri prehadzovaní jobu' }, { status: 500 })
  }
}