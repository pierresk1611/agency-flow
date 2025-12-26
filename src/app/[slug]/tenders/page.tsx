import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, Plus, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'

export const dynamic = 'force-dynamic' // Vynútenie dynamiky, kým to nie je stabilné

export default async function TendersPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  // 1. ZÍSKANIE AGENTÚRY (POZOR NA SLUG!)
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // OCHRANA ROLÍ: Creative nesmie ísť do Tendre
  const isRestricted = session.role === 'CREATIVE' && session.agencyId === agency.id
  if (isRestricted) redirect(`/${params.slug}`)

  // 2. NAČÍTANIE TENDROV (FILTROVANÉ PODĽA AGENCY ID!)
  const tenders = await prisma.tender.findMany({
    where: { 
        agencyId: agency.id, // <--- KRITICKÁ OCHRANA
        archivedAt: null 
    },
    orderBy: { deadline: 'asc' },
    include: { 
        _count: { select: { files: true } } 
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Tender Pipeline</h2>
            <p className="text-muted-foreground text-sm font-medium">Prehľad aktívnych pitchov pre {agency.name}.</p>
        </div>
        <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2 shadow-md">
            <Plus className="h-4 w-4" /> Nový Pitch
        </Button>
      </div>
      
      <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" /> Aktuálne Ponuky
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="pl-6 text-[10px] font-black uppercase">Názov Tendra</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Deadline</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Budget</TableHead>
                        <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Akcia</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {tenders.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">Žiadne otvorené tendre.</TableCell></TableRow>
                ) : (
                    tenders.map(t => (
                        <TableRow key={t.id} className="hover:bg-slate-50 transition-colors group">
                            <TableCell className="pl-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-800">{t.title}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">{t._count.files} Príloh</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                                <span className={new Date(t.deadline) < new Date() ? "text-red-600 font-bold" : "text-slate-600"}>
                                    {format(new Date(t.deadline), 'dd.MM.yyyy')}
                                </span>
                            </TableCell>
                            <TableCell className="font-mono text-sm font-bold text-slate-700">{t.budget?.toFixed(0)} €</TableCell>
                            <TableCell className="text-right pr-6">
                                <Link href={`/${params.slug}/tenders/${t.id}`}>
                                    <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-bold transition-all">
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