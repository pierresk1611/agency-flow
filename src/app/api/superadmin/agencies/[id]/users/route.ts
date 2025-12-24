import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'

// GET: Zoznam ľudí v agentúre
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = getSession()
  if (session?.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    where: { agencyId: params.id },
    orderBy: { email: 'asc' }
  })
  return NextResponse.json(users)
}

// PATCH: Zmena roly alebo hesla (Určenie admina / Reset)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = getSession()
  if (session?.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { userId, role, newPassword } = body

  const dataToUpdate: any = {}
  if (role) dataToUpdate.role = role
  if (newPassword) dataToUpdate.passwordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate
  })

  return NextResponse.json({ success: true })
}