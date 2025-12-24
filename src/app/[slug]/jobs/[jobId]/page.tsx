import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Download, Paperclip, Image as ImageIcon, File } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { TimerButton } from '@/components/timer-button'
import { CommentsSection } from '@/components/comments-section'
import { AssignUserDialog } from '@/components/assign-user-dialog'
import { AddFileDialog } from '@/components/add-file-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import { getSession } from '@/lib/session'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

function getFileIcon(type: string) {
    if (type === 'PDF') return <FileText className="h-4 w-4 text-red-500" />
    if (type === 'IMAGE') return <ImageIcon className="h-4 w-4 text-blue-500" />
    return <File className="h-4 w-4 text-slate-500" />
}

export default async function JobDetailPage({ params }: { params: { slug: string, jobId: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  // 1. NAČÍTANIE JOBU S KONTROLOU AGENTÚRY (Zabezpečenie cez SLUG)
  const job = await prisma.job.findFirst({
    where: { 
        id: params.jobId,
        campaign: {
            client: {
                agency: { slug: params.slug } // <--- KRITICKÉ: Overíme, že job patrí do slugu v URL
            }
        }
    },
    include: {
      campaign: { include: { client: true } },
      files: { orderBy: { createdAt: 'desc' } },
      comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      assignments: { 
          include: { 
              user: true,
              timesheets: { orderBy: { startTime: 'desc' } }
          } 
      }
    },
  })

  // Ak sa Job ID nezhoduje so slugom agentúry (niekto skúša hackovať URL), vrátime 404
  if (!job) return notFound()

  // 2. Kontrola, či užívateľ patrí do tejto agentúry (ochrana pred medzi-agentúrnym prístupom)
  if (session.role !== 'SUPERADMIN' && session.agencyId !== job.campaign.client.agencyId) {
      redirect('/login')
  }

  let runningStartTime: string | null = null
  let isPaused = false
  let totalPausedMinutes = 0
  let lastPauseStart: string | null = null

  const myAssignment = job.assignments.find(a => a.userId === session.userId)
  if (myAssignment) {
      const activeSheet = myAssignment.timesheets.find(t => t.endTime === null)
      if (activeSheet) {
          runningStartTime = activeSheet.startTime.toISOString()
          isPaused = activeSheet.isPaused
          totalPausedMinutes = activeSheet.totalPausedMinutes
          lastPauseStart = activeSheet.lastPauseStart ? activeSheet.lastPauseStart.toISOString() : null
      }
  }

  const history = job.assignments.flatMap(a => 
    a.timesheets.filter(t => t.endTime !== null).map(t => ({
        ...t, userEmail: a.user.email, userName: a.user.name
    }))
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href={`/${params.slug}/jobs`}><Button variant="outline" size="icon" className="rounded-full shadow-sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
                    <Badge variant="outline">{job.status}</Badge>
                </div>
                <p className="text-muted-foreground text-[10px] font-black uppercase mt-1 tracking-widest">
                    {job.campaign.client.name} / {job.campaign.name}
                </p>
            </div>
        </div>
        <TimerButton 
            jobId={job.id} 
            initialStartTime={runningStartTime} 
            initialIsPaused={isPaused}
            initialPausedMinutes={totalPausedMinutes}
            initialLastPauseStart={lastPauseStart}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 items-start">
        <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3 border-b bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">Zadanie / Brief</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed italic">
                    {job.campaign.description || "Žiadne detailné zadanie nebolo pridané."}
                </CardContent>
            </Card>

            <CommentsSection jobId={job.id} comments={job.comments} currentUserId={session.userId} />
        </div>

        <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-slate-50/30">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Tím na projekte</CardTitle>
                    <AssignUserDialog jobId={job.id} />
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    {job.assignments.map(a => (
                        <div key={a.id} className="flex items-center gap-3 text-sm">
                            <Avatar className="h-8 w-8"><AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs uppercase">{(a.user.name || a.user.email).charAt(0)}</AvatarFallback></Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{a.user.name || a.user.email.split('@')[0]}</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{a.roleOnJob}</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-slate-50/30">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Paperclip className="h-4 w-4" /> Súbory</CardTitle>
                    <AddFileDialog jobId={job.id} />
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                    {job.files.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-white hover:bg-slate-50 transition group">
                            <div className="flex items-center gap-2 min-w-0">
                                {getFileIcon(file.fileType)}
                                <span className="text-[11px] font-medium truncate text-slate-700">{file.fileUrl}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition"><Download className="h-3.5 w-3.5 text-slate-400" /></Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="pb-2 border-b bg-slate-50/50"><CardTitle className="text-xs font-black uppercase tracking-widest">Časová os</CardTitle></CardHeader>
                <CardContent className="pt-4 space-y-3">
                    {history.map(t => (
                        <div key={t.id} className="flex justify-between items-center text-[11px] border-b border-slate-50 pb-2 last:border-0">
                            <div>
                                <div className="font-bold text-slate-800">{t.userName || t.userEmail.split('@')[0]}</div>
                                <div className="text-slate-400">{format(new Date(t.startTime), 'd.M. HH:mm')}</div>
                            </div>
                            <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100">{t.durationMinutes} min</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}