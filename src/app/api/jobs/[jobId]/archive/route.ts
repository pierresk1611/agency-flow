import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    await prisma.job.update({
      where: { id: params.jobId },
      data: { archivedAt: new Date() }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Chyba' }, { status: 500 })
  }
}