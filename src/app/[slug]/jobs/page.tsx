// app/[slug]/jobs/page.tsx
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, ArrowRight, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { JobActions } from '@/components/job-actions'
import { ReassignmentDialog } from '@/components/reassignment-dialog'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function JobsPage({ params }: { params: { slug: string } }) {
  // ✅ Správny await
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  // 1️⃣ JOBS
  const jobs = await prisma.job.findMany({
    where: {
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: {
      campaign: { include: { client: true } },
      assignments: { include: { user: true } },
      budgets: true
    }
  })

  // 2.5 COLLEAGUES for reassignment
  const colleagues = await prisma.user.findMany({
    where: { agencyId: agency.id, active: true },
    select: { id: true, name: true, email: true }
  })

  // 2️⃣ TENDERS (ak existuje model)
  const tenders = await prisma.tender?.findMany
    ? await prisma.tender.findMany({
      where: { agencyId: agency.id, isConverted: false },
      orderBy: { deadline: 'asc' }
    })
    : []

  // 3️⃣ MERGE + SORT podľa priority a deadline
  const items = [
    ...jobs.map(j => ({
      id: j.id,
      title: j.title,
      type: 'JOB',
      status: j.status,
      priority: j.campaign?.client?.priority || 0,
      client: j.campaign?.client?.name || 'N/A',
      campaign: j.campaign?.name || '',
      deadline: j.deadline,
      budget: j.budgets?.reduce((acc, b) => acc + b.amount, 0) || 0,
      assignments: j.assignments
    })),
    ...tenders.map(t => ({
      id: t.id,
      title: t.title,
      type: 'TENDER',
      status: t.status,
      priority: 6,
      client: 'PITCH / TENDER',
      campaign: 'New Business',
      deadline: t.deadline,
      budget: t.budget || 0,
      assignments: [] as any[]
    }))
  ].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {isCreative ? 'Moje Zadaniá' : 'Aktívna výroba'}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[900px] md:min-w-full">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-20 text-center text-[10px] font-bold uppercase">Prio</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Projekt</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Klient</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Termín</TableHead>
                {!isCreative && <TableHead className="text-[10px] font-bold uppercase">Budget</TableHead>}
                <TableHead className="text-right pr-6 text-[10px] font-bold uppercase">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic text-sm">
                    Žiadne aktívne projekty.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((proj) => (
                  <TableRow key={proj.id} className={`hover:bg-slate-50/50 transition-colors ${proj.type === 'TENDER' ? 'bg-purple-50/20' : ''}`}>
                    <TableCell className="text-center font-bold">
                      {proj.type === 'TENDER'
                        ? <Badge className="bg-purple-600 text-[9px]">PITCH</Badge>
                        : <span className={proj.priority >= 4 ? "text-red-600" : "text-slate-400"}>P{proj.priority}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {proj.type === 'TENDER'
                            ? <Trophy className="h-3 w-3 text-purple-600" />
                            : <ArrowRight className="h-3 w-3 text-blue-500" />}
                          <span className="font-semibold text-slate-800">{proj.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase">{proj.campaign}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600">{proj.client}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">
                      {format(new Date(proj.deadline), 'dd.MM.yyyy')}
                    </TableCell>
                    {!isCreative && <TableCell className="font-mono text-xs font-bold text-slate-600">{proj.budget ? proj.budget.toFixed(0) : '-'} €</TableCell>}
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                        <Link href={proj.type === 'TENDER' ? `/${params.slug}/tenders/${proj.id}` : `/${params.slug}/jobs/${proj.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8">Detail</Button>
                        </Link>
                        {proj.type === 'JOB' && !isCreative && <JobActions jobId={proj.id} />}

                        {/* Reassignment Button */}
                        {proj.type === 'JOB' && (() => {
                          const myAssignment = proj.assignments?.find((a: any) => a.userId === session.userId)
                          if (myAssignment) {
                            return <ReassignmentDialog assignmentId={myAssignment.id} currentUserId={session.userId} colleagues={colleagues} />
                          }
                          return null
                        })()}
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
