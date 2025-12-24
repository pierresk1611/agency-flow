import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, ArrowRight, Trophy, ListChecks } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { JobActions } from '@/components/job-actions' // Akcie na Joby (Archivácia/Soft-delete)
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

  // 1. ZÍSKANIE VŠETKÝCH PROJEKTOV (JOBY AJ TENDRE)
  const activeJobs = await prisma.job.findMany({
    where: { archivedAt: null, campaign: { client: { agencyId: agency.id } } },
    include: { campaign: { include: { client: true } }, assignments: { include: { user: true } } }
  })

  const activeTenders = await prisma.tender.findMany({
      where: { agencyId: agency.id, archivedAt: null },
      include: { campaign: { select: { client: true } } } // Tender priamo nevie, čo je kampaň, ale musíme vedieť priority klienta
  })
  
  // 2. JEDNOTNÝ MODEL (Spájanie Jobov a Tendrov)
  const activeProjects = [
      ...activeJobs.map(job => ({
          ...job,
          type: 'JOB' as const,
          priority: job.campaign.client?.priority || 0,
          clientName: job.campaign.client?.name || 'Internal Pitch',
          deadline: job.deadline,
      })),
      ...activeTenders.map(tender => ({
          ...tender,
          type: 'TENDER' as const,
          priority: 5, // Tendre majú automaticky najvyššiu prioritu
          clientName: 'INTERNAL PITCH',
          deadline: tender.deadline,
      }))
  ]
  .filter(p => p.type === 'JOB' ? p.status !== 'DONE' : p.status === 'TODO' || p.status === 'IN_PROGRESS') // Filtruj iba neukončené

  // 3. ZORADENIE: Podľa priority (5 -> 1) a potom deadline (najskoršie prvé)
  const sortedProjects = activeProjects.sort((a: any, b: any) => {
    // A. Porovnaj priority (vyšie číslo má prednosť)
    if (b.priority !== a.priority) return b.priority - a.priority
    // B. Porovnaj deadline
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  });


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {isCreative ? 'Moje Zadaniá' : 'Prehľad Výroby'}
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            Zoradené podľa priority a termínov (Tendre sú vždy najvyššia priorita).
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[900px] md:min-w-full">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-16 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Prio</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Typ / Názov</TableHead>
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
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 italic text-sm">
                    Žiadne aktívne projekty. Pridajte tender alebo job!
                </TableCell></TableRow>
              ) : (
                sortedProjects.map((proj: any) => (
                  <TableRow key={proj.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                    {/* PRIORITA */}
                    <TableCell className="text-center font-bold">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant={proj.type === 'TENDER' ? 'destructive' : 'outline'} className={`text-[10px] font-black ${proj.type === 'TENDER' ? 'bg-purple-500 border-purple-500' : ''}`}>
                           {proj.type === 'TENDER' ? 'PITCH' : `P${proj.priority}`}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* NÁZOV */}
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {proj.type === 'TENDER' ? <Trophy className="h-3 w-3 text-amber-500" /> : <ArrowRight className="h-3 w-3 text-blue-500" />}
                          <span className="font-semibold text-slate-800">{proj.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{proj.type === 'TENDER' ? 'Interná Príprava' : proj.campaign.name}</span>
                      </div>
                    </TableCell>

                    {/* KLIENT */}
                    <TableCell className="text-sm font-medium text-slate-600">
                      {proj.clientName}
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
                    
                    {/* ROZPOČET (len pre ne-kreatívcov) */}
                    {!isCreative && (
                      <TableCell className="font-mono text-xs font-bold text-slate-600">
                        {proj.budget?.toFixed(0)} €
                      </TableCell>
                    )}

                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                          {/* Ak je to Job, link ide na Job Detail. Ak je to Tender, pôjde na Tender Detail */}
                          <Link href={proj.type === 'TENDER' ? `/my-placeholder-tender-detail/${proj.id}` : `/${params.slug}/jobs/${proj.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8">
                                {proj.type === 'TENDER' ? 'Pripraviť' : 'Detail'}
                            </Button>
                          </Link>
                          {!isCreative && <JobActions jobId={proj.id} />} 
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