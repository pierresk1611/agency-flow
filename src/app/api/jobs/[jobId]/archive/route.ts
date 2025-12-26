import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: Request, 
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getSession()
    if (!session) 
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, budget, status, deadline } = body

    if (!title && !budget && !status && !deadline) {
      return NextResponse.json({ error: 'Nie sú poskytnuté žiadne údaje na aktualizáciu' }, { status: 400 })
    }

    const updated = await prisma.job.update({
      where: { id: params.jobId },
      data: {
        ...(title !== undefined && { title }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && { deadline: new Date(deadline) })
      }
    })

    return NextResponse.json(updated)

  } catch (error: any) {
    console.error("JOB PATCH ERROR:", error)
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 })
  }
}
