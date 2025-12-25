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

export default async function TendersPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')
  
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // OCHRANA: Kreatívec sem nemá prístup
  if (session.role === 'CREATIVE') redirect(`/${params.slug}`)

  // Načítanie tendrov agentúry
  const tenders = await prisma.tender.findMany({
    where: { agencyId: agency.id },
    orderBy: { deadline: 'asc' },
    include: { 
        _count: { select: { files: true } } 
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase italic">Tender Pipeline</h2>
            <p className="text-muted-foreground text-sm">Prehľad všetkých rozpracovaných ponúk pre nových klientov.</p>
        </div>
        <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2 shadow-md">
            <Plus className="h-4 w-4" /> Nový Pitch
        </Button>
      </div>
      
      <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" /> Aktuálne obchodné príležitosti
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead className="pl-6 text-[10px] font-black uppercase">Názov Tendra</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Deadline odovzdania</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Fee / Budget</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Súbory</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right pr-6">Akcia</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {tenders.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">Zatiaľ ste nepridali žiadne tendre.</TableCell></TableRow>
              ) : (
                  tenders.map(t => (
                    <TableRow key={t.id} className="hover:bg-slate-50 transition-colors group">
                        <TableCell className="pl-6 py-4">
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{t.title}</span>
                                {t.isConverted && <Badge className="w-fit mt-1 h-4 text-[8px] bg-green-100 text-green-700 border-none">SKONVERTOVANÉ</Badge>}
                            </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                            <span className={new Date(t.deadline) < new Date() ? "text-red-600 font-bold" : "text-slate-600"}>
                                {format(new Date(t.deadline), 'dd.MM.yyyy')}
                            </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-bold text-slate-700">
                            {t.budget?.toLocaleString()} €
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                <FileText className="h-3.5 w-3.5" /> {t._count.files}
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <Link href={`/${params.slug}/tenders/${t.id}`}>
                                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-2 font-bold transition-all">
                                    Detail <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}