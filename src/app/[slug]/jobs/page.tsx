import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { JobActions } from '@/components/job-actions' // <--- IMPORT NAŠHO NOVÉHO TLAČIDLA

export default async function JobsPage() {
  // 1. TRAFFIC LOGIKA:
  // - Iba nearchivované (archivedAt: null)
  // - Zoradené podľa priority klienta (5 -> 1)
  // - Potom podľa deadline (najbližšie termíny)
  const jobs = await prisma.job.findMany({
    where: { archivedAt: null },
    include: {
      campaign: {
        include: { client: true }
      },
      assignments: {
        include: { user: true }
      }
    },
    orderBy: [
      { campaign: { client: { priority: 'desc' } } },
      { deadline: 'asc' }
    ]
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Aktívna výroba</h2>
          <p className="text-muted-foreground text-sm">
            Zoradené podľa priority klientov a termínov odovzdania.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-16 text-center">Prio</TableHead>
              <TableHead>Názov Jobu / Kampaň</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Termín</TableHead>
              <TableHead>Rozpočet</TableHead>
              <TableHead className="text-right">Akcia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                  Momentálne nemáte žiadne aktívne úlohy.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                // Kontrola prešvihnutého termínu
                const isOverdue = new Date(job.deadline) < new Date() && job.status !== 'DONE'

                return (
                  <TableRow key={job.id} className="hover:bg-slate-50/50 transition-colors">
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
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {job.campaign.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600">
                      {job.campaign.client.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className={isOverdue ? "text-red-600 font-bold" : "text-slate-700"}>
                          {format(new Date(job.deadline), 'dd.MM.yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {job.budget?.toFixed(0)} €
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                          <Link href={`/dashboard/jobs/${job.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              Detail
                            </Button>
                          </Link>
                          
                          {/* TLAČIDLO ARCHIVOVAŤ */}
                          <JobActions jobId={job.id} />
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
  )
}