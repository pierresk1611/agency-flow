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
        status: { not: 'REJECTED' }, // Exportujeme approved a pending? Alebo vsetky? Requirement nehovori. Defaultneme na vsetky okrem rejected maybe? Alebo vsetky. Dajme vsetky okrem zmazanych (ak by boli).
        // Ale schema nema deletedAt pre timesheet.
        // Dajme vsetky.
    }

    if (jobId) {
        where.jobAssignment = { jobId }
    } else if (clientId) {
        where.jobAssignment = { job: { campaign: { clientId } } }
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

    // Header: Dátum;Pracovník;Projekt;Task;Popis;Hodiny
    const header = ['Dátum', 'Pracovník', 'Projekt', 'Task', 'Popis', 'Hodiny'].join(';')

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

        return [date, worker, project, task, description, hoursStr].join(';')
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
