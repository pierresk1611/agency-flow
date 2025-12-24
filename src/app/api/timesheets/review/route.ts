import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let currentUserId: string
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      currentUserId = decoded.userId
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { timesheetId, status } = body

    console.log(`Reviewing Timesheet: ID=${timesheetId}, Status=${status}`)

    if (!timesheetId || !status) {
        return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    const timesheet = await prisma.timesheet.findUnique({
        where: { id: timesheetId },
        include: {
            jobAssignment: {
                include: { user: true, job: true }
            }
        }
    })

    if (!timesheet) return NextResponse.json({ error: 'Timesheet nenájdený' }, { status: 404 })
    
    // Ak už je v danom stave, vrátime OK a neriešime
    if (timesheet.status === status) {
        return NextResponse.json({ success: true, message: 'Already set' })
    }

    if (status === 'APPROVED') {
        const hours = (timesheet.durationMinutes || 0) / 60
        // Použijeme hourlyRate, ak nie je nastavený, tak 0
        const rate = timesheet.jobAssignment.user.hourlyRate ?? 0 
        const amount = hours * rate

        console.log(`Calculated Budget: ${hours}h * ${rate}€ = ${amount}€`)

        // Použijeme transakciu
        await prisma.$transaction(async (tx) => {
            // 1. Update timesheet
            await tx.timesheet.update({
                where: { id: timesheetId },
                data: { 
                    status: 'APPROVED',
                    approvedBy: currentUserId,
                    approvedAt: new Date()
                }
            })

            // 2. Skontrolujeme, či už budget item existuje (aby nepadlo na unique constraint)
            const existingBudget = await tx.budgetItem.findUnique({
                where: { timesheetId: timesheetId }
            })

            if (!existingBudget) {
                await tx.budgetItem.create({
                    data: {
                        jobId: timesheet.jobAssignment.jobId,
                        timesheetId: timesheet.id,
                        hours: hours,
                        rate: rate,
                        amount: amount
                    }
                })
            }
        })
    } else {
        // REJECTED
        await prisma.timesheet.update({
            where: { id: timesheetId },
            data: { status: 'REJECTED' }
        })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Review error DETAIL:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}