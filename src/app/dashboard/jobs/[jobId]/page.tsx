import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
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

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

function getFileIcon(type: string) {
    if (type === 'PDF') return <FileText className="h-4 w-4 text-red-500" />
    if (type === 'IMAGE') return <ImageIcon className="h-4 w-4 text-blue-500" />
    return <File className="h-4 w-4 text-slate-500" />
}

export default async function JobDetailPage({ params }: { params: { jobId: string } }) {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  let currentUserId: string | null = null
  
  if (token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        currentUserId = decoded.userId
    } catch (e) {}
  }

  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: {
      campaign: { include: { client: true } },
      files: { orderBy: { createdAt: 'desc' } },
      comments: { 
          include: { user: true },
          orderBy: { createdAt: 'asc' } 
      },
      assignments: { 
          include: { 
              user: true,
              timesheets: { orderBy: { startTime: 'desc' } }
          } 
      }
    },
  })

  if (!job) return notFound()

  // --- LOGIKA PRE STOPKY A PAUZU ---
  let runningStartTime: string | null = null
  let isPaused = false
  let totalPausedMinutes = 0
  let lastPauseStart: string | null = null

  if (currentUserId) {
    const myAssignment = job.assignments.find(a => a.userId === currentUserId)
    if (myAssignment) {
        // Hľadáme bežiaci timesheet (endTime je null)
        const activeSheet = myAssignment.timesheets.find(t => t.endTime === null)
        if (activeSheet) {
            runningStartTime = activeSheet.startTime.toISOString()
            isPaused = activeSheet.isPaused
            totalPausedMinutes = activeSheet.totalPausedMinutes
            lastPauseStart = activeSheet.lastPauseStart ? activeSheet.lastPauseStart.toISOString() : null
        }
    }
  }

  // História času (len ukončené timesheety)
  const history = job.assignments.flatMap(a => 
    a.timesheets.filter(t => t.endTime !== null).map(t => ({
        ...t, userEmail: a.user.email
    }))
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  return (
    <div className="space-y-6 pb-10">
      {/* HLAVIČKA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/jobs">
                <Button variant="outline" size="icon" className="rounded-full shadow-sm"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
                    <Badge variant="outline">{job.status}</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1 uppercase tracking-tighter font-bold">
                    Kampaň: {job.campaign.name} • Klient: {job.campaign.client.name}
                </p>
            </div>
        </div>
        <div className="flex gap-2 items-center">
             {/* TLAČIDLO S PODPOROU PAUZY */}
             <TimerButton 
                jobId={job.id} 
                initialStartTime={runningStartTime}
                initialIsPaused={isPaused}
                initialPausedMinutes={totalPausedMinutes}
                initialLastPauseStart={lastPauseStart}
             />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* ĽAVÁ STRANA */}
        <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-500" />
                        <CardTitle>Zadanie / Brief</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-50 p-4 rounded-md border text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {job.campaign.description || "Žiadne detailné zadanie nebolo pridané."}
                    </div>
                </CardContent>
            </Card>

            <CommentsSection 
                jobId={job.id} 
                comments={job.comments} 
                currentUserId={currentUserId}
            />
        </div>

        {/* PRAVÁ STRANA */}
        <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-bold">Tím na projekte</CardTitle>
                    <AssignUserDialog jobId={job.id} />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 pt-2">
                        {job.assignments.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Zatiaľ nikto nie je priradený.</p>
                        ) : (
                            job.assignments.map(assign => (
                                <div key={assign.id} className="flex items-center gap-3 text-sm">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs uppercase">
                                            {(assign.user.name || assign.user.email).charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                                            {assign.user.name || assign.user.email.split('@')[0]}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{assign.roleOnJob}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-slate-400" />
                        <CardTitle className="text-sm font-bold">Súbory</CardTitle>
                    </div>
                    <AddFileDialog jobId={job.id} />
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-2">
                        {job.files.length === 0 ? (
                            <p className="text-xs text-center text-muted-foreground py-4">Žiadne prílohy.</p>
                        ) : (
                            job.files.map(file => (
                                <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-white hover:bg-slate-50 transition group">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {getFileIcon(file.fileType)}
                                        <span className="text-xs font-medium truncate text-slate-700">{file.fileUrl}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition">
                                        <Download className="h-3.5 w-3.5 text-slate-400" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="pb-2 border-b bg-slate-50/50"><CardTitle className="text-sm font-bold">Odpracovaný Čas</CardTitle></CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-3">
                        {history.length === 0 ? (
                            <p className="text-xs text-center text-muted-foreground py-4 italic">Zatiaľ žiadny čas.</p>
                        ) : (
                            history.map(t => (
                                <div key={t.id} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0">
                                    <div>
                                        <div className="font-bold text-slate-800">{t.userEmail.split('@')[0]}</div>
                                        <div className="text-[10px] text-muted-foreground">{format(new Date(t.startTime), 'd.M. HH:mm')}</div>
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100">{t.durationMinutes} min</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}