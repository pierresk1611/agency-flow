import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, User, Mail, Phone, FileText, Briefcase, Download, Building2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ContactPersonDialog } from '@/components/contact-person-dialog'
import { ClientFileDialog } from '@/components/client-file-dialog'
import { AddCampaignDialog } from '@/components/add-campaign-dialog'
import { AddJobDialog } from '@/components/add-job-dialog'
import { format } from 'date-fns'
import { getSession } from '@/lib/session'

export default async function ClientDetailPage({ params }: { params: { slug: string, clientId: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: {
      contacts: true,
      files: { orderBy: { createdAt: 'desc' } },
      campaigns: {
        include: { 
            jobs: { where: { archivedAt: null }, orderBy: { deadline: 'asc' } },
            _count: { select: { jobs: true } } 
        }
      }
    }
  })

  if (!client) return notFound()

  return (
    <div className="space-y-6 pb-10">
      {/* HLAVIČKA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href={`/${params.slug}/clients`}>
                <Button variant="outline" size="icon" className="rounded-full shadow-sm"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-slate-900">{client.name}</h2>
                    <Badge variant="outline" className="bg-slate-50">P{client.priority}</Badge>
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">
                    {client.scope || "Bez definovaného rozsahu"}
                </div>
            </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* LEFT: KAMPANE A KONTAKTY */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* SEKICA KAMPANE */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-slate-50/30">
                    <CardTitle className="text-lg">Kampane a aktívne Joby</CardTitle>
                    <AddCampaignDialog clientId={client.id} />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {client.campaigns.length === 0 ? (
                        <p className="text-sm text-center py-10 text-slate-400 italic">Zatiaľ žiadne kampane.</p>
                    ) : (
                        client.campaigns.map(campaign => (
                            <div key={campaign.id} className="border rounded-xl overflow-hidden shadow-sm bg-white">
                                <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-blue-600" />
                                        <h4 className="font-bold text-slate-900">{campaign.name}</h4>
                                    </div>
                                    <AddJobDialog campaignId={campaign.id} />
                                </div>
                                <div className="divide-y">
                                    {campaign.jobs.length === 0 ? (
                                        <p className="text-[10px] text-slate-400 p-4 text-center italic">Žiadne joby.</p>
                                    ) : (
                                        campaign.jobs.map(job => (
                                            <div key={job.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-2 w-2 rounded-full ${job.status === 'DONE' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                                    <span className="text-sm font-medium text-slate-700">{job.title}</span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                                                        {format(new Date(job.deadline), 'dd.MM.yyyy')}
                                                    </div>
                                                    <Badge variant="secondary" className="text-[10px] font-mono">{job.budget?.toFixed(0)} €</Badge>
                                                    <Link href={`/${params.slug}/jobs/${job.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-blue-600 h-7 text-xs">Detail</Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* SEKICA KONTAKTY */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-slate-50/30">
                    <CardTitle className="text-lg">Kontaktné osoby</CardTitle>
                    <ContactPersonDialog clientId={client.id} />
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        {client.contacts.map(contact => (
                            <div key={contact.id} className="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition">
                                <p className="font-bold text-slate-800 text-sm">{contact.name}</p>
                                <p className="text-[10px] text-blue-600 font-bold mb-3 uppercase tracking-tighter">{contact.position || 'Marketing'}</p>
                                <div className="space-y-1 text-xs text-slate-500 font-medium">
                                    {contact.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {contact.email}</div>}
                                    {contact.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {contact.phone}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="shadow-sm border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50/30 py-3">
                    <CardTitle className="text-lg text-blue-900">Tendre & Dokumenty</CardTitle>
                    <ClientFileDialog clientId={client.id} />
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                    {client.files.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-blue-300 transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-medium truncate text-slate-700">{f.fileUrl}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><Download className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    {client.files.length === 0 && <p className="text-xs text-center text-slate-400 py-4 italic">Žiadne dokumenty.</p>}
                </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white shadow-xl overflow-hidden">
                <div className="p-6 relative">
                    <Building2 className="absolute -right-4 -bottom-4 h-24 w-24 text-white/5" />
                    <h4 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-widest">Rýchly prehľad</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-xs text-slate-400 font-bold">Dátum akvizície</span>
                            <span className="text-xs font-mono">{format(new Date(client.createdAt), 'dd.MM.yyyy')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-xs text-slate-400 font-bold">Aktívnych kampaní</span>
                            <span className="text-xs font-mono">{client.campaigns.length}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  )
}