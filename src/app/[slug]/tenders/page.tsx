import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: {
    slug: string
  }
}

export default async function JobsPage({ params }: PageProps) {
  /* 1️⃣ SESSION */
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  /* 2️⃣ AGENCY */
  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug },
  })

  if (!agency) {
    notFound()
  }

  /* 3️⃣ ROLE LOGIC */
  const isCreative = session.role === 'CREATIVE'

  /* 4️⃣ FILTER – kreatívec vidí len svoje joby */
  const jobFilter = isCreative
    ? {
        assignments: {
          some: {
            userId: session.userId,
          },
        },
      }
    : {}

  /* 5️⃣ FETCH JOBS */
  const jobs = await prisma.job.findMany({
    where: {
      campaign: {
        client: {
          agencyId: agency.id,
        },
      },
      archivedAt: null,
      ...jobFilter,
    },
    include: {
      assignments: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          files: true,
        },
      },
    },
    orderBy: [
      {
        campaign: {
          client: {
            priority: 'desc',
          },
        },
      },
      {
        deadline: 'asc',
      },
    ],
  })

  /* 6️⃣ RENDER */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase italic">
            Job Pipeline
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Prehľad všetkých aktívnych jobov.
          </p>
        </div>

        {!isCreative && (
          <Link href={`/${params.slug}/jobs/new`}>
            <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2 shadow-md">
              <Plus className="h-4 w-4" /> Nový Job
            </Button>
          </Link>
        )}
      </div>

      {/* TABLE CARD */}
      <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Aktívne joby
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6 text-[10px] font-black uppercase">
                    Názov
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase">
                    Deadline
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase">
                    Status
                  </TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-black uppercase">
                    Akcia
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-20 text-slate-400 italic text-sm"
                    >
                      Žiadne aktívne joby.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {job.title}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {job._count.files} príloh
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm font-medium">
                        {job.deadline ? (
                          <span
                            className={
                              new Date(job.deadline) < new Date()
                                ? 'text-red-600 font-bold'
                                : 'text-slate-600'
                            }
                          >
                            {format(
                              new Date(job.deadline),
                              'dd.MM.yyyy'
                            )}
                          </span>
                        ) : (
                          '–'
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            job.status === 'TODO'
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : job.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-green-100 text-green-700 border-green-200'
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <Link href={`/${params.slug}/jobs/${job.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-bold"
                          >
                            Detail <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
