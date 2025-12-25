import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, User, Mail, Phone, FileText, Briefcase, Download, Pin, MessageSquareText } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ContactPersonDialog } from '@/components/contact-person-dialog'
import { ClientFileDialog } from '@/components/client-file-dialog'
import { AddCampaignDialog } from '@/components/add-campaign-dialog'
import { AddJobDialog } from '@/components/add-job-dialog'
import { format } from 'date-fns'
import { ClientNewsfeed } from '@/components/client-newsfeed' // Vytvoríme nižšie

export default async function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: {
      contacts: true,
      files: { orderBy: { createdAt: 'desc' } },
      notes: { include: { user: true }, orderBy: { createdAt: 'desc' } },
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/agency">
                <Button variant="outline" size="icon" className="rounded-full shadow-sm"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
                <h2 className="text-3xl font-bold text-slate-900">{client.name}</h2>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">{client.scope}</div>
            </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            {/* NEWSFEED / POZNÁMKY (BOD 2 OD TESTERA) */}
            <ClientNewsfeed clientId={client.id} initialNotes={client.notes} />

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-slate-50/30">
                    <CardTitle className="text-lg">Kampane a aktívne Joby</CardTitle>
                    <AddCampaignDialog clientId={client.id} />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {client.campaigns.map(campaign => (
                        <div key={campaign.id} className="border rounded-xl overflow-hidden shadow-sm bg-white">
                            <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                                <h4 className="font-bold text-slate-900">{campaign.name}</h4>
                                <AddJobDialog campaignId={campaign.id} />
                            </div>
                            <div className="divide-y">
                                {campaign.jobs.map(job => (
                                    <div key={job.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
                                        <span className="text-sm font-medium text-slate-700">{job.title}</span>
                                        <div className="flex items-center gap-6">
                                            <span className="text-xs text-slate-500 font-mono">{format(new Date(job.deadline), 'dd.MM.yyyy')}</span>
                                            <Link href={`/dashboard/jobs/${job.id}`}><Button variant="ghost" size="sm" className="text-blue-600">Detail</Button></Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-slate-50/30">
                    <CardTitle className="text-lg">Kontaktné osoby</CardTitle>
                    <ContactPersonDialog clientId={client.id} />
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid gap-3">
                        {client.contacts.map(contact => (
                            <div key={contact.id} className="p-3 border rounded-xl bg-white text-xs">
                                <p className="font-bold text-slate-800">{contact.name}</p>
                                <p className="text-blue-600 font-bold mb-1 uppercase tracking-tighter">{contact.position}</p>
                                {contact.email && <div className="flex items-center gap-1 text-slate-500"><Mail className="h-3 w-3" /> {contact.email}</div>}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50/30 py-3">
                    <CardTitle className="text-lg">Dokumenty</CardTitle>
                    <ClientFileDialog clientId={client.id} />
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                    {client.files.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <span className="text-xs font-medium truncate flex-1">{f.fileUrl}</span>
                            <Download className="h-4 w-4 text-slate-400" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}