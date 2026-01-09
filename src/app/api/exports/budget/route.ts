import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const items = await prisma.budgetItem.findMany({
      where: {
        job: {
          campaign: {
            client: {
              agencyId: session.agencyId
            }
          }
        }
      },
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
    let csv = "Datum;Klient;Kampan;Job;Kreativec;Hodiny;Typ odmeny;Bill Sadzba;Bill Celkom;Cost Sadzba;Cost Celkom;Profit\n"

    items.forEach(item => {
      const date = item.createdAt ? format(new Date(item.createdAt), 'dd.MM.yyyy') : ''
      const client = item.job?.campaign?.client?.name || ''
      const campaign = item.job?.campaign?.name || ''
      const job = item.job?.title || ''
      const user = item.timesheet?.jobAssignment?.user?.name || item.timesheet?.jobAssignment?.user?.email || ''
      const hours = item.hours != null ? item.hours.toFixed(2).replace('.', ',') : '0,00'
      const billRate = item.rate != null ? item.rate.toFixed(2).replace('.', ',') : '0,00'
      const billAmount = item.amount != null ? item.amount.toFixed(2).replace('.', ',') : '0,00'

      const costRate = (item as any).internalRate != null ? (item as any).internalRate.toFixed(2).replace('.', ',') : '0,00'
      const costAmount = (item as any).internalAmount != null ? (item as any).internalAmount.toFixed(2).replace('.', ',') : '0,00'
      const profit = (item.amount || 0) - ((item as any).internalAmount || 0)
      const profitStr = profit.toFixed(2).replace('.', ',')

      const costType = (item.timesheet?.jobAssignment as any)?.assignedCostType === 'task' ? 'Task' : 'Hourly'

      csv += `${date};${client};${campaign};${job};${user};${hours};${costType};${billRate};${billAmount};${costRate};${costAmount};${profitStr}\n`
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
