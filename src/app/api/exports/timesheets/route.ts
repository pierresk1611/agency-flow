import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { format } from 'date-fns'

export async function GET(request: Request) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const clientId = searchParams.get('clientId')

    if (!jobId && !clientId) {
        return NextResponse.json({ error: 'Missing jobId or clientId' }, { status: 400 })
    }

    // Build filter
    const where: any = {
        status: { not: 'REJECTED' },
        jobAssignment: {
            job: {
                campaign: {
                    client: {
                        agencyId: session.agencyId
                    }
                }
            }
        }
    }

    if (jobId) {
        where.jobAssignment.jobId = jobId
    } else if (clientId) {
        where.jobAssignment.job.campaign.clientId = clientId
    }

    const timesheets = await prisma.timesheet.findMany({
        where,
        include: {
            jobAssignment: {
                include: {
                    user: true,
                    job: {
                        include: { campaign: { include: { client: true } } }
                    }
                }
            }
        },
        orderBy: { startTime: 'desc' }
    })

    // Header: Dátum;Pracovník;Projekt;Task;Popis;Hodiny;Typ odmeny;Bill Sadzba;Bill Celkom;Cost Sadzba;Cost Celkom;Profit
    const header = ['Dátum', 'Pracovník', 'Projekt', 'Task', 'Popis', 'Hodiny', 'Typ odmeny', 'Bill Sadzba', 'Bill Celkom', 'Cost Sadzba', 'Cost Celkom', 'Profit'].join(';')

    const rows = timesheets.map(t => {
        const date = format(new Date(t.startTime), 'dd.MM.yyyy')
        const worker = t.jobAssignment.user.name || t.jobAssignment.user.email
        const project = `${t.jobAssignment.job.campaign.client.name} - ${t.jobAssignment.job.campaign.name}`
        const task = t.jobAssignment.job.title
        const description = (t.description || '').replace(/;/g, ',').replace(/\n/g, ' ') // Clean up for CSV

        // Calculate hours from minutes (durationMinutes) or diff
        let hours = 0
        if (t.durationMinutes) {
            hours = t.durationMinutes / 60
        } else if (t.endTime) {
            const diff = new Date(t.endTime).getTime() - new Date(t.startTime).getTime()
            hours = diff / (1000 * 60 * 60)
        }

        const hoursStr = hours.toFixed(2).replace('.', ',')
        const costType = (t.jobAssignment as any).assignedCostType || 'hourly'

        // Billing calculation
        const billValue = (t.jobAssignment as any).assignedBillingValue ?? (t.jobAssignment.user.hourlyRate || 0)
        let totalBill = (costType === 'task') ? billValue : hours * billValue

        // Cost calculation
        const costValue = (t.jobAssignment as any).assignedCostValue ?? ((t.jobAssignment.user as any).costRate || t.jobAssignment.user.hourlyRate || 0)
        let totalCost = (costType === 'task') ? costValue : hours * costValue

        const profit = totalBill - totalCost

        const costTypeDisplay = costType === 'task' ? 'Task' : 'Hourly'
        const billRateStr = billValue.toFixed(2).replace('.', ',')
        const totalBillStr = totalBill.toFixed(2).replace('.', ',')
        const costRateStr = costValue.toFixed(2).replace('.', ',')
        const totalCostStr = totalCost.toFixed(2).replace('.', ',')
        const profitStr = profit.toFixed(2).replace('.', ',')

        return [date, worker, project, task, description, hoursStr, costTypeDisplay, billRateStr, totalBillStr, costRateStr, totalCostStr, profitStr].join(';')
    })

    const csvContent = '\uFEFF' + [header, ...rows].join('\n')

    return new NextResponse(csvContent, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="timesheets_export_${jobId || clientId}.csv"`
        }
    })
}
