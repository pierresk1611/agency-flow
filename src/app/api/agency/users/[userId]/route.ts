import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  try {
    const body = await request.json()
    const updated = await prisma.user.update({
      where: { id: params.userId }, // Používame userId
      data: body
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
  try {
    await prisma.user.update({
      where: { id: params.userId },
      data: { active: false }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}