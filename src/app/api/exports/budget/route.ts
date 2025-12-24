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

    // Dáta
    items.forEach(item => {
      const date = format(new Date(item.createdAt), 'dd.MM.yyyy')
      const client = item.job.campaign.client.name
      const campaign = item.job.campaign.name
      const job = item.job.title
      const user = item.timesheet.jobAssignment.user.name || item.timesheet.jobAssignment.user.email
      
      csv += `${date};${client};${campaign};${job};${user};${item.hours.toFixed(2)};${item.rate.toFixed(2)};${item.amount.toFixed(2)}\n`
    })

    // Vrátime súbor na stiahnutie
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=rozpocty-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      }
    })

  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}