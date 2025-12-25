import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar, ArrowRight, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { JobActions } from '@/components/job-actions'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function JobsPage({ params }: { params: { slug: string } }) {
  // 1. Overenie prihlásenia
  const session = getSession()
  if (!session) redirect('/login')

  // 2. Zistenie ID agentúry podľa slugu
  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug }
  })

  if (!agency) return notFound()

  // 3. Kontrola roly
  const isCreative = session.role === 'CREATIVE'

  // Ochrana pred prístupom do cudzej agentúry
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    redirect('/login')
  }

  // 4. NAČÍTANIE JOBOV (Majú kampane a klientov)
  const activeJobs = await prisma.job.findMany({
    where: { 
      archivedAt: null,
      campaign: { 
        client: { 
          agencyId: agency.id 
        } 
      },
      // Ak je creative, vidí len tie, kde je v tíme
      assignments: isCreative ? {
        some: {
          userId: session.userId
        }
      } : undefined
    },
    include: {
      campaign: { 
        include: { 
          client: true 
        } 
      }
    },
    orderBy: { deadline: 'asc' }
  })

  // 5. NAČÍTANIE TENDROV (Tendre NEMAJÚ kampane v DB!)
  const activeTenders = await prisma.tender.findMany({
    where: { 
        agencyId: agency.id
        // Tendre zatiaľ nemajú archivedAt, ak ho doplníme, pridáme ho sem
    },
    orderBy: { deadline: 'asc' }
  })
  
  // 6. SPÁJANIE DÁT DO JEDNOTNÉHO FORMÁTU PRE TABUĽKU
  const activeProjects = [
      ...activeJobs.map(job => ({
          id: job.id,
          title: job.title,
          type: 'JOB',
          status: job.status,
          priority: job.campaign.client?.priority || 0,
          clientName: job.campaign.client?.name || 'Klient',
          subName: job.campaign.name,
          deadline: job.deadline,
          budget: job.budget
      })),
      ...activeTenders.map(tender => ({
          id: tender.id,
          title: tender.title,
          type: 'TENDER',
          status: tender.status,
          priority: 6, // Tendre vizuálne nad P5
          clientName: 'PITCH / TENDER',
          subName: 'New Business',
          deadline: tender.deadline,
          budget: tender.budget
      }))
  ]
  // Filtrujeme, aby sme neukazovali hotové joby (DONE)
  .filter(p => p.status !== 'DONE')
  
  // 7. ZORADENIE: Priorita (vysoká prvá) -> Deadline (skorý prvý)
  const sortedProjects = activeProjects.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {isCreative ? 'Moje priradené úlohy' : 'Aktívna výroba'}
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            {isCreative 
              ? 'Zoznam zadaní a tendrov, na ktorých pracujete.' 
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
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Názov projektu</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Klient / Kampaň</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Termín</TableHead>
                {!isCreative && (
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rozpočet</TableHead>
                )}
                <TableHead className="text-right pr-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isCreative ? 5 : 6} className="text-center py-20 text-slate-400 italic text-sm">
                    Momentálne nie sú k dispozícii žiadne aktívne úlohy.
                  </TableCell>
                </TableRow>
              ) : (
                sortedProjects.map((proj) => {
                  const isOverdue = new Date(proj.deadline) < new Date()

                  return (
                    <TableRow key={proj.id} className={`hover:bg-slate-50/50 transition-colors group text-sm ${proj.type === 'TENDER' ? 'bg-purple-50/20' : ''}`}>
                      <TableCell className="text-center font-bold">
                        <div className="flex justify-center">
                            {proj.type === 'TENDER' ? (
                                <Badge className="bg-purple-600 hover:bg-purple-700 text-[9px] font-black border-none text-white">PITCH</Badge>
                            ) : (
                                <span className={
                                    proj.priority >= 5 ? "text-red-600" :
                                    proj.priority >= 4 ? "text-orange-600" :
                                    "text-slate-400"
                                }>
                                    P{proj.priority}
                                </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {proj.type === 'TENDER' ? <Trophy className="h-3 w-3 text-purple-600" /> : <ArrowRight className="h-3 w-3 text-blue-500" />}
                            <span className="font-semibold text-slate-800">{proj.title}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{proj.clientName}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{proj.subName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className={isOverdue ? "text-red-600 font-bold" : "text-slate-700"}>
                            {format(new Date(proj.deadline), 'dd.MM.yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      {!isCreative && (
                        <TableCell className="font-mono text-xs font-bold text-slate-600">
                          {proj.budget?.toFixed(0)} €
                        </TableCell>
                      )}
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-2">
                          {proj.type === 'JOB' ? (
                            <>
                                <Link href={`/${params.slug}/jobs/${proj.id}`}>
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8">Detail</Button>
                                </Link>
                                {!isCreative && <JobActions jobId={proj.id} />}
                            </>
                          ) : (
                              <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 text-[10px]">Tender v príprave</Badge>
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