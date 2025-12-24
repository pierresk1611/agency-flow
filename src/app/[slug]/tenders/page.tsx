import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function TendersPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')
  
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // OCHRANA: Iba ADMIN/TRAFFIC/SUPERADMIN
  if (session.role === 'CREATIVE') redirect(`/${params.slug}`)

  // 1. NAČÍTANIE TENDROV (Opravený include - iba files, žiadna campaign)
  const tenders = await prisma.tender.findMany({
    where: { 
        agencyId: agency.id, 
        // archivedAt: null // Tender zatiaľ nemá archivedAt v modeli, ak sme ho nepridali, tak toto vynechajme
    },
    orderBy: { deadline: 'asc' },
    include: { 
        files: true 
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tender Pipeline</h2>
            <p className="text-muted-foreground text-sm">Prehľad otvorených výberových konaní.</p>
        </div>
        {/* Tlačidlo zatiaľ len ako placeholder, kým nespravíme dialóg */}
        <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2">
            <Plus className="h-4 w-4" /> Nový Pitch
        </Button>
      </div>
      
      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-yellow-50/50 border-b py-3">
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2 text-yellow-800">
            <Trophy className="h-4 w-4" /> Aktívne príležitosti
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead className="pl-6">Názov Tendra</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Rozpočet (Fee)</TableHead>
                    <TableHead>Prílohy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Akcia</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {tenders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">Zatiaľ žiadne tendre.</TableCell></TableRow>
              ) : (
                  tenders.map(t => (
                    <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-6 font-semibold text-slate-800">{t.title}</TableCell>
                        <TableCell className="text-sm">
                            <span className={new Date(t.deadline) < new Date() ? "text-red-600 font-bold" : "text-slate-600"}>
                                {format(new Date(t.deadline), 'dd.MM.yyyy')}
                            </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold">{t.budget?.toFixed(0)} €</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <FileText className="h-3 w-3" /> {t.files.length}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={t.status === 'DONE' ? 'default' : 'outline'} className={t.status === 'TODO' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'text-blue-600 border-blue-200 bg-blue-50'}>
                                {t.status === 'TODO' ? 'PRÍPRAVA' : t.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            {/* Link zatiaľ nevedie nikam, lebo nemáme detail page */}
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-purple-600">Detail</Button>
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