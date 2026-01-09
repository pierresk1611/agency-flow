// app/[slug]/timesheets/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, AlertCircle, BellRing } from 'lucide-react'
import { TimesheetActions } from '@/components/timesheet-actions'
import { NudgeButton } from '@/components/nudge-button'
import { TimesheetsTabs } from '@/components/timesheet-tabs'

export const dynamic = 'force-dynamic'

export default async function TimesheetsPage({ params }: { params: { slug: string } }) {
  // ✅ await pre session
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // ✅ SECURITY CHECK: Agency Isolation
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id && !session.godMode) {
    redirect('/login')
  }

  const isCreative = session.role === 'CREATIVE'

  // Načítame všetky relevantné timesheety (okrem tých s endTime: null, ak to chceme - ale tu necháme všetko)
  const allTimesheets = await prisma.timesheet.findMany({
    where: {
      jobAssignment: {
        userId: isCreative ? session.userId : undefined,
        job: { campaign: { client: { agencyId: agency.id } } }
      }
    },
    orderBy: [
      { isUrgent: 'desc' },
      { startTime: 'desc' }
    ],
    include: {
      budgetItem: true,
      jobAssignment: {
        include: {
          user: true,
          job: { include: { campaign: { include: { client: true } } } }
        }
      }
    }
  })

  // Rozdelíme na aktívne (Pending, Rejected) a archív (Approved)
  // Poznámka: REJECTED by sme asi chceli nechať v aktívnych kým sa neopravia? 
  // Alebo len PENDING sú aktívne.
  // Zadanie: "ak schválim timesheet, ten sa presunie do archívu"

  const activeTimesheets = allTimesheets.filter(t => t.status !== 'APPROVED')
  const archivedTimesheets = allTimesheets.filter(t => t.status === 'APPROVED')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic">
            {isCreative ? 'Moje výkazy' : 'Schvaľovanie práce'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isCreative ? 'Prehľad vašej odpracovanej práce.' : `Prehľad k schváleniu pre agentúru ${agency.name}.`}
          </p>
        </div>
      </div>

      <TimesheetsTabs
        activeTimesheets={activeTimesheets}
        archivedTimesheets={archivedTimesheets}
        isCreative={isCreative}
      />
    </div>
  )
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
