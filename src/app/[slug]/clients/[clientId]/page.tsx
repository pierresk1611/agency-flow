import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Briefcase, FileText, Download, AlertTriangle, Building } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getSession } from '@/lib/session'
import { ContactPersonDialog } from '@/components/contact-person-dialog'
import { ClientFileDialog } from '@/components/client-file-dialog'
import { AddCampaignDialog } from '@/components/add-campaign-dialog'
import { AddJobDialog } from '@/components/add-job-dialog'
import { ClientNewsfeed } from '@/components/client-newsfeed'
import { format } from 'date-fns'
import DefaultTeamCard from '@/components/default-team-card'
import { Prisma } from '@prisma/client'

export default async function ClientDetailPage({ params }: { params: { slug: string, clientId: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const isCreative = session.role === 'CREATIVE'

  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: {
      contacts: true,
      files: { orderBy: { createdAt: 'desc' } },
      notes: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      campaigns: {
        include: {
          jobs: {
            where: {
              archivedAt: null,
              ...(isCreative ? { assignments: { some: { userId: session.userId } } } : {})
            },
            orderBy: { deadline: 'asc' }
          },
          _count: { select: { jobs: true } }
        }
      },
      defaultAssignees: { select: { id: true } }
    }
  }) as any // Cast to any to resolve property access errors on relations in this view

  if (!client) return notFound()

  const canSeeBilling = ['ADMIN', 'ACCOUNT', 'TRAFFIC'].includes(session.role)

  return (
    <div className="space-y-6 pb-10">
      {/* ALERT: IMPORTANT NOTE */}
      {client.importantNote && (
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 shadow-sm rounded-r-lg flex items-start gap-3">
          <div className="bg-amber-200 p-1.5 rounded-full">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest mb-1">Dôležité upozornenie pre tím</p>
            <p className="text-sm font-medium text-amber-900 leading-relaxed whitespace-pre-wrap">{client.importantNote}</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${params.slug}/clients`}>
            <Button variant="outline" size="icon" className="rounded-full shadow-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
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
        <a href={`/api/exports/timesheets?clientId=${client.id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export Klienta
          </Button>
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* NEWSFEED */}
          <div className="min-h-[400px]">
            <ClientNewsfeed clientId={client.id} initialNotes={client.notes} isReadOnly={isCreative} />
          </div>

          {/* KAMPANE */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-slate-50/30">
              <CardTitle className="text-lg">Kampane a Joby</CardTitle>
              {!isCreative && <AddCampaignDialog clientId={client.id} />}
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
                      {!isCreative && <AddJobDialog campaignId={campaign.id} agencyId={client.agencyId} defaultAssigneeIds={client.defaultAssignees.map(u => u.id)} />}
                    </div>
                    <div className="divide-y">
                      {campaign.jobs.length === 0 ? (
                        <p className="text-[10px] text-slate-400 p-4 text-center italic">Žiadne joby.</p>
                      ) : (
                        campaign.jobs.map(job => (
                          <div key={job.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
                            <span className="text-sm font-medium text-slate-700">{job.title}</span>
                            <div className="flex items-center gap-6">
                              <span className="text-xs text-slate-500 font-mono">{format(new Date(job.deadline), 'dd.MM.yyyy')}</span>
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
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-slate-50/30">
              <CardTitle className="text-lg">Kontaktné osoby</CardTitle>
              {!isCreative && <ContactPersonDialog clientId={client.id} />}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                {client.contacts.map(contact => (
                  <div key={contact.id} className="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition">
                    <p className="font-bold text-slate-800 text-sm">{contact.name}</p>
                    <p className="text-[10px] text-blue-600 font-bold mb-3 uppercase tracking-tighter">{contact.position || 'Marketing'}</p>
                    <div className="space-y-1 text-xs text-slate-500 font-medium">
                      {contact.email && <div className="flex items-center gap-2">{contact.email}</div>}
                      {contact.phone && <div className="flex items-center gap-2">{contact.phone}</div>}
                    </div>
                  </div>
                ))}
                {client.contacts.length === 0 && <p className="text-xs text-center text-slate-400 italic">Žiadne kontakty.</p>}
              </div>
            </CardContent>
          </Card>

          {/* FAKTURAČNÉ ÚDAJE */}
          {canSeeBilling && (client.companyId || client.vatId || client.billingAddress) && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b py-3 bg-slate-50/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Building className="h-4 w-4" /> Fakturačné údaje
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {client.companyId && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">IČO</span>
                    <span className="text-sm font-semibold text-slate-800">{client.companyId}</span>
                  </div>
                )}
                {client.vatId && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">DIČ / IČ DPH</span>
                    <span className="text-sm font-semibold text-slate-800">{client.vatId}</span>
                  </div>
                )}
                {client.billingAddress && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fakturačná adresa</span>
                    <span className="text-sm font-semibold text-slate-800 leading-snug">{client.billingAddress}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50/30 py-3">
              <CardTitle className="text-lg text-blue-900">Tendre & Dokumenty</CardTitle>
              {!isCreative && <ClientFileDialog clientId={client.id} />}
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
              {client.files.length === 0 && <p className="text-xs text-center text-slate-400 italic">Žiadne dokumenty.</p>}
            </CardContent>
          </Card>

          {/* DEFAULT TEAM CARD */}
          {!isCreative && <DefaultTeamCard clientId={client.id} initialAssigneeIds={client.defaultAssignees.map(u => u.id)} />}
        </div>
      </div>
    </div >
  )
}
