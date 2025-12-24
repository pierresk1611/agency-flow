import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { TimesheetActions } from '@/components/timesheet-actions'

export default async function TimesheetsPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // IZOLÁCIA: Načítame len timesheety patriace TEJTO agentúre
  const timesheets = await prisma.timesheet.findMany({
    where: {
      jobAssignment: {
        job: {
          campaign: {
            client: {
              agencyId: agency.id // <--- FILTER AGENTÚRY
            }
          }
        }
      }
    },
    orderBy: { startTime: 'desc' },
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
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Timesheety</h2>
        <p className="text-muted-foreground text-sm">Prehľad a schvaľovanie práce tímu agentúry {agency.name}.</p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Kedy / Kto</TableHead>
              <TableHead>Job / Klient</TableHead>
              <TableHead>Trvanie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcie</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timesheets.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">Zatiaľ žiadne záznamy na schválenie.</TableCell></TableRow>
            ) : (
              timesheets.map((ts) => {
                const isRunning = ts.endTime === null
                return (
                  <TableRow key={ts.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-slate-700">{format(new Date(ts.startTime), 'dd.MM.yyyy')}</div>
                        <div className="flex items-center gap-2">
                             <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black uppercase">
                                {(ts.jobAssignment.user.name || ts.jobAssignment.user.email).charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-slate-500">{ts.jobAssignment.user.name || ts.jobAssignment.user.email.split('@')[0]}</span>
                        </div>
                        {ts.description && <p className="text-[10px] text-slate-400 italic pl-7">"{ts.description}"</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-800">{ts.jobAssignment.job.title}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">{ts.jobAssignment.job.campaign.client.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        {isRunning ? <Badge variant="outline" className="animate-pulse border-blue-200 text-blue-700">Beží...</Badge> : 
                            <span className="font-mono text-xs font-bold text-slate-600">{Math.floor((ts.durationMinutes || 0) / 60)}h {(ts.durationMinutes || 0) % 60}m</span>}
                    </TableCell>
                    <TableCell>
                        {ts.status === 'APPROVED' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Schválené</Badge>}
                        {ts.status === 'REJECTED' && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1"><XCircle className="h-3 w-3" /> Zamietnuté</Badge>}
                        {ts.status === 'PENDING' && !isRunning && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1"><AlertCircle className="h-3 w-3" /> Čaká</Badge>}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                        <TimesheetActions id={ts.id} status={ts.status} isRunning={isRunning} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}