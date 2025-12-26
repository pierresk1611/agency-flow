import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET() {
  try {
    const items = await prisma.budgetItem.findMany({
      include: {
        job: {
          include: { 
            campaign: { include: { client: true } } 
          }
        },
        timesheet: {
          include: {
            jobAssignment: { include: { user: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Hlavička CSV
    let csv = "Datum;Klient;Kampan;Job;Kreativec;Hodiny;Sadzba;Suma (EUR)\n"

    items.forEach(item => {
      const date = item.createdAt ? format(new Date(item.createdAt), 'dd.MM.yyyy') : ''
      const client = item.job?.campaign?.client?.name || ''
      const campaign = item.job?.campaign?.name || ''
      const job = item.job?.title || ''
      const user = item.timesheet?.jobAssignment?.user?.name || item.timesheet?.jobAssignment?.user?.email || ''
      const hours = item.hours != null ? item.hours.toFixed(2) : '0.00'
      const rate = item.rate != null ? item.rate.toFixed(2) : '0.00'
      const amount = item.amount != null ? item.amount.toFixed(2) : '0.00'

      csv += `${date};${client};${campaign};${job};${user};${hours};${rate};${amount}\n`
    })

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=rozpocty-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      }
    })

  } catch (error) {
    console.error("BUDGET CSV EXPORT ERROR:", error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
