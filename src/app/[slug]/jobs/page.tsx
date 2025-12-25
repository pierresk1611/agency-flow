import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, ArrowRight, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { JobActions } from '@/components/job-actions'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function JobsPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    redirect('/login')
  }

  // 1. ZÍSKANIE JOBOV
  // Kreatívec vidí len tie, kde je priradený
  const activeJobs = await prisma.job.findMany({
    where: { 
      archivedAt: null, 
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: { 
      campaign: { include: { client: true } }, 
      assignments: { include: { user: true } } 
    }
  })

  // 2. ZÍSKANIE TENDROV
  // Tendre zatiaľ ukazujeme všetkým (aby kreatívec vedel, že sa niečo chystá), 
  // alebo ich môžeme pre kreatívca skryť, ak tam nie je priradený (zatiaľ necháme viditeľné)
  const activeTenders = await prisma.tender.findMany({
      where: { agencyId: agency.id, archivedAt: null },
      // Tender nemá kampaň ani klienta v štruktúre, takže nič neincludujeme, čo by mohlo padnúť
  })
  
  // 3. SPÁJANIE DÁT (Bezpečné mapovanie)
  const activeProjects = [
      ...activeJobs.map(job => ({
          id: job.id,
          title: job.title,
          type: 'JOB',
          status: job.status,
          priority: job.campaign.client?.priority || 0,
          clientName: job.campaign.client?.name || 'Neznámy klient',
          campaignName: job.campaign.name,
          deadline: job.deadline,
          budget: job.budget
      })),
      ...activeTenders.map(tender => ({
          id: tender.id,
          title: tender.title,
          type: 'TENDER',
          status: tender.status,
          priority: 6, // Tendre dáme vizuálne nad P5 (ako 6)
          clientName: 'NEW BUSINESS', // Placeholder, lebo Tender nemá klienta
          campaignName: 'Interný Pitch',
          deadline: tender.deadline,
          budget: tender.budget
      }))
  ]
  // Filtrovanie hotových (iba ak to nie je JOB DONE)
  .filter(p => p.type === 'TENDER' || (p.type === 'JOB' && p.status !== 'DONE'))
  
  // 4. ZORADENIE
  const sortedProjects = activeProjects.sort((a, b) => {
    // Najprv podľa priority (6 > 5 > 4...)
    if (b.priority !== a.priority) return b.priority - a.priority
    // Potom podľa termínu
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {isCreative ? 'Moje Zadaniá' : 'Aktívna výroba'}
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            Zoznam úloh a tendrov zoradený podľa priority.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[900px] md:min-w-full">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-20 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Prio</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Názov</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Klient / Kampaň</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Termín</TableHead>
                {!isCreative && (
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Budget</TableHead>
                )}
                <TableHead className="text-right pr-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.length === 0 ? (
                <TableRow><TableCell colSpan={isCreative ? 5 : 6} className="text-center py-20 text-slate-400 italic text-sm">
                    {isCreative ? 'Nemáte priradené žiadne aktívne úlohy.' : 'Žiadne aktívne projekty.'}
                </TableCell></TableRow>
              ) : (
                sortedProjects.map((proj) => (
                  <TableRow key={proj.id} className={`hover:bg-slate-50/50 transition-colors group text-sm ${proj.type === 'TENDER' ? 'bg-yellow-50/30' : ''}`}>
                    
                    {/* PRIORITA */}
                    <TableCell className="text-center font-bold">
                      <div className="flex justify-center">
                        {proj.type === 'TENDER' ? (
                            <Badge className="bg-purple-600 hover:bg-purple-700 text-[9px] font-black">PITCH</Badge>
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

                    {/* NÁZOV */}
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {proj.type === 'TENDER' ? <Trophy className="h-3 w-3 text-purple-600" /> : <ArrowRight className="h-3 w-3 text-blue-500" />}
                          <span className="font-semibold text-slate-800">{proj.title}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* KLIENT */}
                    <TableCell>
                       <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{proj.clientName}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{proj.campaignName}</span>
                       </div>
                    </TableCell>

                    {/* TERMÍN */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className={new Date(proj.deadline) < new Date() ? "text-red-600 font-bold" : "text-slate-700"}>
                          {format(new Date(proj.deadline), 'dd.MM.yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* ROZPOČET (Skrytý pre kreatívca) */}
                    {!isCreative && (
                      <TableCell className="font-mono text-xs font-bold text-slate-600">
                        {proj.budget?.toFixed(0)} €
                      </TableCell>
                    )}

                    {/* AKCIE */}
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                          {proj.type === 'JOB' ? (
                            <>
                                <Link href={`/${params.slug}/jobs/${proj.id}`}>
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8">Detail</Button>
                                </Link>
                                {/* Archiváciu vidí len admin */}
                                {!isCreative && <JobActions jobId={proj.id} />}
                            </>
                          ) : (
                              // Tendre zatiaľ nemajú detail pre kreatívca, alebo ho dorobíme v ďalšom kroku
                              <Badge variant="outline" className="text-purple-600 border-purple-200">Info u Traffica</Badge>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}