import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Trophy, FileText, Download, Users, Calendar, Euro, Link2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ConvertTenderButton } from '@/components/convert-tender-button'
import { EditTenderDescription } from '@/components/edit-tender-description'
import { AddTenderFileDialog } from '@/components/add-tender-file-dialog'

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
  const canEdit = session.role !== 'CREATIVE'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href={`/${params.slug}/tenders`}>
            <Button variant="outline" size="icon" className="rounded-full shadow-sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{tender.title}</h2>
                {tender.isConverted ? <Badge className="bg-green-600 text-white border-none px-3 font-bold uppercase">Vyhrané</Badge> : <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 font-bold italic px-3">PITCH</Badge>}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">ID: {tender.id.substring(0,8)}</p>
          </div>
        </div>
        {!tender.isConverted && canEdit && <ConvertTenderButton tenderId={tender.id} slug={params.slug} />}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-none ring-1 ring-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-500" /><CardTitle className="text-xs font-black uppercase tracking-widest">Zadanie / Brief</CardTitle></div>
                    {canEdit && <EditTenderDescription tenderId={tender.id} initialDescription={tender.description || ''} />}
                </CardHeader>
                <CardContent className="pt-6 px-8 pb-8 min-h-[150px]">
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                        {tender.description || <p className="text-slate-400 italic text-center py-4">Zatiaľ nebolo pridané žiadne zadanie.</p>}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 py-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-slate-400" /><CardTitle className="text-xs font-black uppercase tracking-widest">Podklady</CardTitle></div>
                    {canEdit && <AddTenderFileDialog tenderId={tender.id} />}
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {tender.files.length === 0 ? <p className="text-xs text-slate-400 py-10 col-span-2 text-center border border-dashed rounded-xl italic">Žiadne linky.</p> : 
                            tender.files.map(f => (
                                <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-xl bg-white group hover:border-blue-400 transition-all shadow-sm">
                                    <div className="flex items-center gap-3 truncate">
                                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors"><ExternalLink className="h-4 w-4 text-blue-600" /></div>
                                        <span className="text-xs font-bold text-slate-700 truncate uppercase">{f.name || "Odkaz"}</span>
                                    </div>
                                </a>
                            ))
                        }
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="shadow-xl border-none ring-1 ring-slate-200">
                <CardHeader className="bg-purple-900 text-white py-4 rounded-t-xl"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Users className="h-4 w-4" /> Pitch Team</CardTitle></CardHeader>
                <CardContent className="pt-6 space-y-4 px-6">
                    {tender.assignments.map(a => (
                        <div key={a.id} className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border-2 border-white shadow-md"><AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-black uppercase">{(a.user.name || a.user.email).charAt(0)}</AvatarFallback></Avatar>
                            <div className="flex flex-col"><span className="font-bold text-sm text-slate-800">{a.user.name || a.user.email.split('@')[0]}</span><span className="text-[10px] text-slate-400 font-bold uppercase">{a.roleOnJob}</span></div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card className="shadow-xl border-none ring-1 ring-slate-200">
                <CardContent className="p-6 space-y-5">
                    <div className="flex justify-between items-center"><span className="text-slate-400 text-[10px] font-black uppercase">Deadline</span><span className="text-sm font-black text-red-600 font-mono">{format(new Date(tender.deadline), 'dd.MM.yyyy')}</span></div>
                    <Separator /><div className="flex justify-between items-center"><span className="text-slate-400 text-[10px] font-black uppercase">Fee</span><span className="text-lg font-black text-slate-900 font-mono">{tender.budget?.toLocaleString()} €</span></div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}