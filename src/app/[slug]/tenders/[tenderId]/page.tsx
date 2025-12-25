import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, FileText, Download, Users, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ConvertTenderButton } from '@/components/convert-tender-button' // Vytvoríme nižšie

export default async function TenderDetailPage({ params }: { params: { slug: string, tenderId: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const tender = await prisma.tender.findUnique({
    where: { id: params.tenderId },
    include: {
      files: true,
      assignments: { include: { user: true } },
      agency: true
    }
  })

  if (!tender || tender.agency.slug !== params.slug) return notFound()

  return (
    <div className="space-y-6 pb-12">
      {/* HLAVIČKA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${params.slug}/tenders`}>
            <Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{tender.title}</h2>
                {tender.isConverted ? (
                    <Badge className="bg-green-600">VYHRANÉ / KLIENT</Badge>
                ) : (
                    <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 italic">PITCH V PRÍPRAVE</Badge>
                )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-widest">ID: {tender.id.substring(0,8)}</p>
          </div>
        </div>

        {/* TLAČIDLO NA KONVERZIU (iba ak nie je skonvertovaný a si admin/traffic) */}
        {!tender.isConverted && (session.role === 'ADMIN' || session.role === 'TRAFFIC') && (
            <ConvertTenderButton tenderId={tender.id} slug={params.slug} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            {/* BRIEF */}
            <Card className="shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" /> Zadanie Tendra
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed text-slate-600 text-sm leading-relaxed">
                        Tu bude detailný popis tendrového zadania. Aktuálne budujeme budget na úrovni {tender.budget} €.
                    </div>
                </CardContent>
            </Card>

            {/* SÚBORY */}
            <Card className="shadow-sm">
                <CardHeader className="border-b"><CardTitle className="text-sm font-bold">Podklady a Prílohy</CardTitle></CardHeader>
                <CardContent className="pt-4">
                    <div className="grid gap-2">
                        {tender.files.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Žiadne nahraté súbory.</p>
                        ) : (
                            tender.files.map(f => (
                                <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-white group">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-purple-500" />
                                        <span className="text-sm font-medium">{f.fileUrl}</span>
                                    </div>
                                    <Download className="h-4 w-4 text-slate-300" />
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* PRAVÝ PANEL */}
        <div className="space-y-6">
            {/* TÍM NA PITCHI */}
            <Card className="shadow-sm border-purple-100">
                <CardHeader className="bg-purple-50/50 border-b py-3">
                    <CardTitle className="text-xs font-black uppercase text-purple-900 tracking-widest flex items-center gap-2">
                        <Users className="h-4 w-4" /> Tím na Pitchi
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {tender.assignments.map(a => (
                        <div key={a.id} className="flex items-center gap-3">
                             <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px] font-bold">
                                    {(a.user.name || a.user.email).charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">{a.user.name || a.user.email.split('@')[0]}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{a.roleOnJob}</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* INFO */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-400">Deadline odovzdania:</span>
                        <span className="text-red-600 font-mono font-bold">{format(new Date(tender.deadline), 'dd.MM.yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-400">Predpokladaný budget:</span>
                        <span className="font-bold">{tender.budget?.toFixed(0)} €</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}