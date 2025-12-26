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

export const dynamic = 'force-dynamic'

export default async function TimesheetsPage({ params }: { params: { slug: string } }) {
  // ✅ await pre session
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  const timesheets = await prisma.timesheet.findMany({
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
      jobAssignment: {
        include: {
          user: true,
          job: { include: { campaign: { include: { client: true } } } }
        }
      }
    }
  })

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

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-slate-50 text-[10px] font-black uppercase">
              <TableRow>
                <TableHead className="pl-6">Kedy / Kto</TableHead>
                <TableHead>Projekt</TableHead>
                <TableHead>Trvanie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic text-sm">
                    Zatiaľ žiadne záznamy.
                  </TableCell>
                </TableRow>
              ) : (
                timesheets.map((ts) => {
                  const isRunning = ts.endTime === null
                  return (
                    <TableRow
                      key={ts.id}
                      className={cn(
                        "hover:bg-slate-50/50",
                        ts.isUrgent && ts.status === 'PENDING' ? "bg-red-50/30" : ""
                      )}
                    >
                      <TableCell className="pl-6">
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-slate-700 text-sm">{format(new Date(ts.startTime), 'dd.MM.yyyy')}</div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {ts.jobAssignment.user?.name || ts.jobAssignment.user?.email?.split('@')[0] || 'N/A'}
                          </span>
                          {ts.description && <p className="text-[10px] text-slate-400 italic">"{ts.description}"</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-800">{ts.jobAssignment.job?.title || 'N/A'}</span>
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                            {ts.jobAssignment.job?.campaign?.client?.name || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isRunning ? (
                          <Badge variant="outline" className="animate-pulse border-blue-200 text-blue-700 font-bold">BEŽÍ...</Badge>
                        ) : (
                          <span className="font-mono text-xs font-black text-slate-600 tracking-tighter">
                            {Math.floor((ts.durationMinutes || 0) / 60)}h {(ts.durationMinutes || 0) % 60}m
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {ts.status === 'APPROVED' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold uppercase">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Schválené
                            </Badge>
                          )}
                          {ts.status === 'REJECTED' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase">
                              <XCircle className="h-3 w-3 mr-1" /> Zamietnuté
                            </Badge>
                          )}
                          {ts.status === 'PENDING' && !isRunning && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                ts.isUrgent ? "bg-red-600 text-white border-none animate-pulse" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                              )}
                            >
                              {ts.isUrgent ? <BellRing className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                              {ts.isUrgent ? 'URGENTNÉ' : 'ČAKÁ'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-2">
                          {isCreative && ts.status === 'PENDING' && !isRunning && !ts.isUrgent && (
                            <NudgeButton timesheetId={ts.id} />
                          )}
                          {!isCreative && (
                            <TimesheetActions id={ts.id} status={ts.status} isRunning={isRunning} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
