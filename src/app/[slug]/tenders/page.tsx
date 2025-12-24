import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar, Loader, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function TendersPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')
    
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()
  
  // OCHRANA: Creative nemá čo tu hľadať
  if (session.role === 'CREATIVE') redirect(`/${params.slug}`)

  const tenders = await prisma.tender.findMany({
    where: { agencyId: agency.id, archivedAt: null },
    orderBy: { deadline: 'asc' },
    include: { files: true }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tender Pipeline</h2>
        {/* Sem príde dialóg na pridanie nového tendra (TRAFFIC/ADMIN) */}
        <Button className="bg-green-700 hover:bg-green-800 text-white gap-2">
            <Plus className="h-4 w-4" /> Nový Pitch/Tender
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-yellow-50/50 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-700" /> Pripravované Obchodné Príležitosti</CardTitle>
          <CardDescription>Všetky prebiehajúce a víťazné ponuky.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader><TableRow><TableHead>Názov</TableHead><TableHead>Termín</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Akcia</TableHead></TableRow></TableHeader>
            <TableBody>
              {tenders.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 italic text-muted-foreground">Zatiaľ žiadne podané tendre.</TableCell></TableRow>
              ) : (
                tenders.map(t => (
                  <TableRow key={t.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold flex flex-col">
                        {t.title}
                        <span className="text-xs font-normal text-slate-400">{t._count.files} Príloh</span>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(t.deadline), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>
                        <Badge variant={t.status === 'DONE' ? 'success' : 'outline'} className={t.status === 'TODO' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                            {t.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/${params.slug}/tenders/${t.id}`}><Button variant="ghost" size="sm">Detail</Button></Link>
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