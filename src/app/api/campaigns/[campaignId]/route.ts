import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { campaignId: string } } // <--- SPRÁVNY NÁZOV PARAMETRA
) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, deadline, budget } = body

    if (!title || !deadline) {
        return NextResponse.json({ error: 'Názov a termín sú povinné' }, { status: 400 })
    }

    const job = await prisma.job.create({
      data: {
        title,
        deadline: new Date(deadline),
        budget: parseFloat(budget || '0'),
        campaignId: params.campaignId, // <--- POUŽÍVAME SPRÁVNY PARAMETER
        status: 'TODO'
      }
    })

    return NextResponse.json(job)

  } catch (error: any) {
    console.error("CREATE JOB ERROR:", error)
    return NextResponse.json({ error: 'Chyba servera pri vytváraní jobu.' }, { status: 500 })
  }
}