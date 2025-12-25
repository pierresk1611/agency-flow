import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { JobActions } from '@/components/job-actions'

export default async function JobsPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    redirect('/login')
  }

  // 1. NAČÍTANIE JOBOV (Filtrované cez agencyId a osobný filter pre Creative)
  const jobs = await prisma.job.findMany({
    where: { 
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: {
      campaign: { include: { client: true } },
      assignments: { include: { user: true } }
    },
    orderBy: [
      { campaign: { client: { priority: 'desc' } } },
      { deadline: 'asc' }
    ]
  })

  return (
    <div className="space-y-6">
      {/* OPRAVENÁ HLAVIČKA S PRISPÔSOBENÝM TEXTOM */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {isCreative ? 'Moje priradené úlohy' : 'Aktívna výroba'}
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            {isCreative 
              ? 'Zoznam úloh, na ktorých pracujete.' 
              : `Prehľad všetkých otvorených úloh agentúry ${agency.name}.`}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[800px] md:min-w-full">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-16 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Prio</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Názov Jobu / Kampaň</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Klient</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Termín</TableHead>
                {!isCreative && (
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rozpočet</TableHead>
                )}
                <TableHead className="text-right pr-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic text-sm">
                    {isCreative ? 'Momentálne nemáte priradené žiadne joby.' : 'V tejto agentúre nie sú žiadne aktívne joby.'}
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => {
                  const isOverdue = new Date(job.deadline) < new Date() && job.status !== 'DONE'

                  return (
                    <TableRow key={job.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                      <TableCell className="text-center font-bold">
                        <span className={
                          job.campaign.client.priority >= 5 ? "text-red-600" :
                          job.campaign.client.priority >= 4 ? "text-orange-600" :
                          "text-slate-400"
                        }>
                          P{job.campaign.client.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{job.title}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{job.campaign.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-600">
                        {job.campaign.client.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className={isOverdue ? "text-red-600 font-bold" : "text-slate-700"}>
                            {format(new Date(job.deadline), 'dd.MM.yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      {!isCreative && (
                        <TableCell className="font-mono text-xs font-bold text-slate-600">
                          {job.budget?.toFixed(0)} €
                        </TableCell>
                      )}
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-2">
                            <Link href={`/${params.slug}/jobs/${job.id}`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8">Detail</Button>
                            </Link>
                            {!isCreative && <JobActions jobId={job.id} />}
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