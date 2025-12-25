import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'
import { AddTenderDialog } from '@/components/add-tender-dialog'

export default async function TendersPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')
  
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // NAČÍTANIE: Iba tie, ktoré NIE SÚ skonvertované na klienta
  const tenders = await prisma.tender.findMany({
    where: { 
        agencyId: agency.id,
        isConverted: false // <--- TOTO ZABRÁNI DUPLICITÁM PO VÝHRE
    },
    orderBy: { deadline: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase italic">Tender Pipeline</h2>
        <AddTenderDialog slug={params.slug} />
      </div>
      
      <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" /> Aktívne obchodné príležitosti
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead className="pl-6">Názov</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Fee / Budget</TableHead>
                    <TableHead className="text-right pr-6">Akcia</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {tenders.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 italic text-sm">Zatiaľ žiadne otvorené tendre.</TableCell></TableRow>
              ) : (
                  tenders.map(t => (
                    <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-6 py-4 font-bold text-slate-800">{t.title}</TableCell>
                        <TableCell className="text-sm font-medium">
                            {format(new Date(t.deadline), 'dd.MM.yyyy')}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-bold">{t.budget?.toLocaleString()} €</TableCell>
                        <TableCell className="text-right pr-6">
                            <Link href={`/${params.slug}/tenders/${t.id}`}>
                                <Button variant="ghost" size="sm" className="text-purple-600 font-bold hover:bg-purple-50">
                                    Detail <ArrowRight className="ml-2 h-3 w-3" />
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