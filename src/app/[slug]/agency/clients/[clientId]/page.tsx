import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Mail, Phone, FileText, Briefcase, Download, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ContactPersonDialog } from '@/components/contact-person-dialog'
import { ClientFileDialog } from '@/components/client-file-dialog'
import { AddCampaignDialog } from '@/components/add-campaign-dialog'
import { AddJobDialog } from '@/components/add-job-dialog'
import { format } from 'date-fns'

export default async function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId }, // Používame clientId
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/agency">
                <Button variant="outline" size="icon" className="rounded-full shadow-sm"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
                <h2 className="text-3xl font-bold text-slate-900">{client.name}</h2>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">{client.scope || "Žiadny rozsah"}</div>
            </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-slate-50/30">
                    <CardTitle className="text-lg">Kampane a aktívne Joby</CardTitle>
                    <AddCampaignDialog clientId={client.id} />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {client.campaigns.length === 0 ? (
                        <p className="text-sm text-center py-10 text-slate-400">Zatiaľ žiadne kampane.</p>
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
                                                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">{job.title}</div>
                                                <div className="flex items-center gap-6">
                                                    <span className="text-xs text-slate-500">{format(new Date(job.deadline), 'dd.MM.yyyy')}</span>
                                                    <Link href={`/dashboard/jobs/${job.id}`}><Button variant="ghost" size="sm" className="text-blue-600">Detail</Button></Link>
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
        </div>

        <div className="space-y-6">
            <Card className="shadow-sm border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50/30 py-3">
                    <CardTitle className="text-lg text-blue-900">Tendre & Súbory</CardTitle>
                    <ClientFileDialog clientId={client.id} />
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                    {client.files.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <span className="text-xs font-medium truncate flex-1">{f.fileUrl}</span>
                            <Download className="h-4 w-4 text-slate-400" />
                        </div>
                    ))}
                    {client.files.length === 0 && <p className="text-xs text-center text-slate-400 py-4">Žiadne dokumenty.</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}