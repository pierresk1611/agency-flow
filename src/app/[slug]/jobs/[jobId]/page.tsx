import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Download, Paperclip, Image as ImageIcon, File, ExternalLink, Link2, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { TimerButton } from '@/components/timer-button'
import { CommentsSection } from '@/components/comments-section'
import { AssignUserDialog } from '@/components/assign-user-dialog'
import { AddFileDialog } from '@/components/add-file-dialog'
import { EditCampaignDescription } from '@/components/edit-campaign-description'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getSession } from '@/lib/session'
import { JobActions } from '@/components/job-actions'
import { JobTimesheetsDialog } from '@/components/job-timesheets-dialog'

function getFileIcon(type: string) {
    if (type === 'PDF') return <FileText className="h-4 w-4 text-red-500" />
    if (type === 'IMAGE') return <ImageIcon className="h-4 w-4 text-blue-500" />
    if (type === 'LINK') return <Link2 className="h-4 w-4 text-emerald-500" />
    return <File className="h-4 w-4 text-slate-500" />
}

export default async function JobDetailPage({ params }: { params: { slug: string, jobId: string } }) {
    const session = await getSession()
    if (!session) redirect('/login')

    const job = await prisma.job.findFirst({
        where: {
            id: params.jobId,
            campaign: { client: { agency: { slug: params.slug } } }
        },
        include: {
            campaign: { include: { client: true } },
            files: { orderBy: { createdAt: 'desc' } },
            comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
            plannerEntries: {
                where: { date: { gte: new Date() } },
                include: { user: true },
                orderBy: { date: 'asc' }
            },
            assignments: {
                include: {
                    user: true,
                    timesheets: {
                        orderBy: { startTime: 'desc' }
                    }
                }
            }
        },
    })

    if (!job) return notFound()

    const isCreative = session.role === 'CREATIVE'
    const isAssigned = job.assignments.some(a => a.userId === session.userId)
    if (isCreative && !isAssigned) return notFound()

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

    // Extract all currently running timers on this job
    const anyRunningOnJob = job.assignments.flatMap(a =>
        a.timesheets.filter(t => t.endTime === null).map(t => ({
            ...t, userName: a.user.name
        }))
    )

    return (
        <div className="space-y-6 pb-10">
            {/* ALERT: WORK IN PROGRESS */}
            {anyRunningOnJob.length > 0 && (
                <div className="bg-blue-600 text-white p-4 shadow-lg rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2 rounded-full shadow-inner">
                            <Clock className="h-5 w-5 animate-spin-slow" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Práca práve prebieha</p>
                            <p className="text-sm font-bold">
                                {anyRunningOnJob.length === 1
                                    ? `${anyRunningOnJob[0].userName} práve pracuje na tomto jobe`
                                    : `${anyRunningOnJob.length} kolegovia práve pracujú na tomto jobe`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/${params.slug}/jobs`}>
                        <Button variant="outline" size="icon" className="rounded-full shadow-sm"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
                            <Badge variant="outline" className="font-bold">{job.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-black uppercase mt-1 tracking-widest">
                            {job.campaign.client.name} / {job.campaign.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a href={`/api/exports/timesheets?jobId=${job.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                            <Download className="h-4 w-4" /> Stiahnúť timesheety
                        </Button>
                    </a>
                    {(session.role === 'ADMIN' || session.role === 'ACCOUNT' || session.role === 'TRAFFIC' || session.role === 'SUPERADMIN' || session.godMode) && !job.archivedAt && (
                        <JobActions jobId={job.id} isArchived={false} />
                    )}
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
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b bg-slate-50/30 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-500" />
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Zadanie / Brief</CardTitle>
                            </div>
                            {!isCreative && (
                                <EditCampaignDescription
                                    campaignId={job.campaignId}
                                    initialDescription={job.campaign.description || ''}
                                />
                            )}
                        </CardHeader>
                        <CardContent className="pt-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed min-h-[100px]">
                            {job.campaign.description || <div className="text-slate-400 italic py-4">Zadanie zatiaľ nebolo vyplnené.</div>}
                        </CardContent>
                    </Card>

                    <CommentsSection jobId={job.id} comments={job.comments} currentUserId={session.userId} />
                </div>

                <div className="space-y-6">
                    {/* PLÁNOVANÁ PRÁCA */}
                    <Card className="shadow-sm border-blue-200 bg-blue-50/10">
                        <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-blue-50/50">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-900 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" /> Plánovaná práca
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {job.plannerEntries.length === 0 ? (
                                <p className="text-[10px] text-center py-4 text-slate-400 italic font-medium tracking-tight">Na tento job zatiaľ nie je nič naplánované.</p>
                            ) : (
                                <div className="space-y-3">
                                    {job.plannerEntries.map((pe: any) => (
                                        <div key={pe.id} className="flex items-center gap-4 p-3 rounded-lg border border-white bg-white/50 shadow-sm">
                                            <div className="flex flex-col items-center justify-center min-w-[50px] py-1 px-2 rounded bg-blue-100 text-blue-700">
                                                <span className="text-[10px] font-black uppercase leading-none">{format(new Date(pe.date), 'EEE')}</span>
                                                <span className="text-sm font-bold">{format(new Date(pe.date), 'dd')}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{pe.title || "Práca na úlohe"}</p>
                                                    <Badge variant="outline" className="text-[9px] bg-white border-blue-200 text-blue-600 px-1 py-0 h-4">
                                                        {pe.minutes >= 60 ? `${(pe.minutes / 60).toFixed(1)} h` : `${pe.minutes} m`}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Avatar className="h-4 w-4 border">
                                                        <AvatarFallback className="text-[7px] bg-slate-100 text-slate-600 font-bold">
                                                            {pe.user?.name?.split(' ').map((n: any) => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[9px] font-medium text-slate-500">{pe.user?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <JobTimesheetsDialog
                        timesheets={history}
                        jobTitle={job.title}
                        trigger={
                            <div className="cursor-pointer group">
                                <Card className="shadow-sm border-none bg-slate-900 text-white overflow-hidden mt-6 group-hover:bg-slate-800 transition">
                                    <CardHeader className="pb-2 border-b border-white/10">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-50">Čas strávený na jobe</CardTitle>
                                            <ExternalLink className="h-3 w-3 opacity-30" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-3">
                                        {history.slice(0, 5).map(t => (
                                            <div key={t.id} className="flex justify-between items-start text-[11px] border-b border-white/5 pb-2 last:border-0 relative">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <div className="font-bold truncate">{t.userName || t.userEmail.split('@')[0]}</div>
                                                    <div className="opacity-50 text-[9px]">{format(new Date(t.startTime), 'd.M. HH:mm')}</div>
                                                    {t.description && (
                                                        <p className="text-[10px] opacity-70 mt-1 line-clamp-1 italic">
                                                            "{t.description}"
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant="secondary" className="font-mono text-[9px] bg-white/10 text-white border-none shrink-0">{t.durationMinutes} m</Badge>
                                            </div>
                                        ))}
                                        {history.length === 0 && <p className="text-[10px] text-center py-2 opacity-50 italic">Zatiaľ žiadne záznamy.</p>}
                                        {history.length > 5 && (
                                            <div className="text-[9px] text-center opacity-40 font-bold uppercase tracking-widest pt-2 group-hover:opacity-100 transition">
                                                Zobraziť ďalších {history.length - 5} záznamov
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        }
                    />

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-slate-50/30">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Tím na projekte</CardTitle>
                            {!isCreative && <AssignUserDialog jobId={job.id} />}
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {job.assignments.map(a => (
                                <div key={a.id} className="flex items-center gap-3 text-sm">
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs uppercase">{(a.user.name || a.user.email).charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700 truncate max-w-[150px]">{a.user.name || a.user.email.split('@')[0]}</span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{a.roleOnJob}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-slate-50/30">
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Paperclip className="h-4 w-4 text-slate-400" /> Súbory a Odkazy</CardTitle>
                            <AddFileDialog jobId={job.id} />
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            {job.externalLink && (
                                <div className="flex items-center justify-between p-2 border rounded-md bg-blue-50/50 hover:bg-blue-50 transition group border-blue-100">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <ExternalLink className="h-4 w-4 text-blue-600" />
                                        <span className="text-[11px] font-bold truncate text-slate-800 uppercase tracking-tighter">
                                            EXTERNÝ LINK (ASANA/CLICKUP...)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a href={job.externalLink} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            )}

                            {job.files.length === 0 && !job.externalLink ? (
                                <p className="text-xs text-center text-slate-400 py-4 italic">Žiadne prílohy.</p>
                            ) : (
                                job.files.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-white hover:bg-slate-50 transition group">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {getFileIcon(file.fileType)}
                                            <span className="text-[11px] font-bold truncate text-slate-800 uppercase tracking-tighter">
                                                {file.name || "Bez názvu"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}