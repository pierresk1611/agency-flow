import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { jobId, userId, roleOnJob } = body

    if (!jobId || !userId) {
        return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    const existing = await prisma.jobAssignment.findFirst({
        where: { jobId, userId }
    })

    if (existing) {
        return NextResponse.json({ message: 'Užívateľ už je priradený' })
    }

    const assignment = await prisma.jobAssignment.create({
        data: { jobId, userId, roleOnJob: roleOnJob || 'Contributor' }
    })

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}