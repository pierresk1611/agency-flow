import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request, 
  { params }: { params: { agencyId: string } }
) {
  const session = await getSession()
  if (session?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const users = await prisma.user.findMany({
      where: { agencyId: params.agencyId },
      orderBy: { email: 'asc' },
      select: { id: true, email: true, role: true, active: true }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Users GET Error:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request, 
  { params }: { params: { agencyId: string } }
) {
  const session = await getSession()
  if (session?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, role, newPassword } = body

    if (!userId) {
      return NextResponse.json({ error: 'Chýba userId' }, { status: 400 })
    }

    const dataToUpdate: { role?: string; passwordHash?: string } = {}
    if (role) dataToUpdate.role = role
    if (newPassword) dataToUpdate.passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Users PATCH Error:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}
