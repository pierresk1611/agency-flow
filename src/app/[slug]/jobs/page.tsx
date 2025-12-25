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

  // 1. JOBY
  const activeJobs = await prisma.job.findMany({
    where: { 
      archivedAt: null, 
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: { campaign: { include: { client: true } } },
    orderBy: { deadline: 'asc' }
  })

  // 2. TENDRE
  const activeTenders = await prisma.tender.findMany({
    where: { agencyId: agency.id, isConverted: false },
    orderBy: { deadline: 'asc' }
  })
  
  // 3. ZJEDNOTENIE
  const activeProjects = [
      ...activeJobs.map(job => ({
          id: job.id, title: job.title, type: 'JOB', status: job.status,
          priority: job.campaign.client?.priority || 0,
          clientName: job.campaign.client?.name || 'N/A',
          subName: job.campaign.name,
          deadline: job.deadline, budget: job.budget
      })),
      ...activeTenders.map(tender => ({
          id: tender.id, title: tender.title, type: 'TENDER', status: tender.status,
          priority: 6, clientName: 'PITCH / TENDER', subName: 'New Business',
          deadline: tender.deadline, budget: tender.budget
      }))
  ]

  const sortedProjects = activeProjects.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase italic">Výroba a Pitche</h2>
          <p className="text-muted-foreground text-sm">Prehľad aktuálneho vyťaženia agentúry.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[800px] md:min-w-full">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-20 text-center text-[10px] font-black uppercase">Prio</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Projekt</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Klient / Kampaň</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Termín</TableHead>
                {!isCreative && <TableHead className="text-[10px] font-black uppercase">Budget</TableHead>}
                <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.map((proj) => (
                <TableRow key={proj.id} className={`hover:bg-slate-50/50 transition-colors ${proj.type === 'TENDER' ? 'bg-purple-50/20' : ''}`}>
                  <TableCell className="text-center font-bold">
                    {proj.type === 'TENDER' ? <Badge className="bg-purple-600 text-[9px] font-black">PITCH</Badge> : <span className={proj.priority >= 4 ? "text-red-600" : "text-slate-400"}>P{proj.priority}</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {proj.type === 'TENDER' ? <Trophy className="h-3 w-3 text-purple-600" /> : <ArrowRight className="h-3 w-3 text-blue-500" />}
                      <span className="font-semibold text-slate-800 text-sm">{proj.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{proj.clientName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{proj.subName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {format(new Date(proj.deadline), 'dd.MM.yyyy')}
                    </div>
                  </TableCell>
                  {!isCreative && <TableCell className="font-mono text-xs font-bold text-slate-600">{proj.budget?.toFixed(0)} €</TableCell>}
                  <TableCell className="text-right pr-6">
                    {/* OŽIVENÉ TLAČIDLÁ PRE OBA TYPY */}
                    <Link href={proj.type === 'TENDER' ? `/${params.slug}/tenders/${proj.id}` : `/${params.slug}/jobs/${proj.id}`}>
                      <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50">Detail</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}