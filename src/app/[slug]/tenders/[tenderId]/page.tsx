import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Trophy, FileText, Download, Users, Calendar, Euro } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ConvertTenderButton } from '@/components/convert-tender-button'
import { AddFileDialog } from '@/components/add-file-dialog' // <--- ZDIELANÝ KOMPONENT

export default async function TenderDetailPage({ params }: { params: { slug: string, tenderId: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const tender = await prisma.tender.findUnique({
    where: { id: params.tenderId },
    include: {
      files: { orderBy: { createdAt: 'desc' } },
      assignments: { include: { user: true } },
      agency: true
    }
  })

  if (!tender || tender.agency.slug !== params.slug) return notFound()

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href={`/${params.slug}/tenders`}>
            <Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{tender.title}</h2>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold mt-1">ID: {tender.id}</p>
          </div>
        </div>

        {!tender.isConverted && (session.role !== 'CREATIVE') && (
            <ConvertTenderButton tenderId={tender.id} slug={params.slug} />
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* LEFT: BRIEF & FILES */}
        <div className="lg:col-span-2 space-y-6">
            {/* ZOBRAZENIE BRIEFU */}
            <Card className="shadow-xl border-none ring-1 ring-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-xs font-black uppercase tracking-widest">Zadanie / Brief</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 px-8 pb-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                        {tender.description || "Zatiaľ nebolo pridané žiadne detailné zadanie. Môžete ho doplniť v nastaveniach tendra."}
                    </div>
                </CardContent>
            </Card>

            {/* SÚBORY */}
            <Card className="shadow-xl border-none ring-1 ring-slate-200">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Podklady a Prílohy</CardTitle>
                    {/* Použijeme AddFileDialog, ale musíme ho neskôr upraviť pre TenderID */}
                    <Badge variant="outline">Tender Docs</Badge>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-2">
                        {tender.files.length === 0 ? (
                            <p className="text-xs text-slate-400 py-10 text-center border-2 border-dashed rounded-xl italic">Žiadne súbory.</p>
                        ) : (
                            tender.files.map(f => (
                                <div key={f.id} className="flex items-center justify-between p-4 border rounded-xl bg-white group">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-purple-600" />
                                        <span className="text-xs font-bold text-slate-700">{f.fileUrl}</span>
                                    </div>
                                    <Download className="h-4 w-4 text-slate-300 cursor-pointer" />
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* RIGHT: STATS */}
        <div className="space-y-6">
            <Card className="shadow-xl border-none ring-1 ring-slate-200">
                <CardContent className="p-6 space-y-5">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">Termín odovzdania</span>
                        <span className="text-sm font-black text-red-600 font-mono">{format(new Date(tender.deadline), 'dd.MM.yyyy')}</span>
                    </div>
                    <Separator className="bg-slate-100" />
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">Plánované Fee</span>
                        <span className="text-lg font-black text-slate-900 font-mono">{tender.budget?.toLocaleString()} €</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}