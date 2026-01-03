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

function getFileIcon(type: string) {
    if (type === 'PDF') return <FileText className="h-4 w-4 text-red-500" />
    if (type === 'IMAGE') return <ImageIcon className="h-4 w-4 text-blue-500" />
    if (type === 'LINK') return <Link2 className="h-4 w-4 text-emerald-500" />
    return <File className="h-4 w-4 text-slate-500" />
}

export default async function JobDetailPage({ params }: { params: { slug: string, jobId: string } }) {
    const session = getSession()
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
            assignments: {
                include: {
                    user: true,
                    timesheets: { orderBy: { startTime: 'desc' } }
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

    return (
        <div className="space-y-6 pb-10">
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
                    {(session.role === 'ADMIN' || session.role === 'ACCOUNT' || session.role === 'TRAFFIC') && !job.archivedAt && (
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
                            {job.files.length === 0 ? (
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

                    <Card className="shadow-sm border-none bg-slate-900 text-white overflow-hidden">
                        <CardHeader className="pb-2 border-b border-white/10"><CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-50">Časová os</CardTitle></CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {history.slice(0, 5).map(t => (
                                <div key={t.id} className="flex justify-between items-center text-[11px] border-b border-white/5 pb-2 last:border-0">
                                    <div>
                                        <div className="font-bold">{t.userName || t.userEmail.split('@')[0]}</div>
                                        <div className="opacity-50">{format(new Date(t.startTime), 'd.M. HH:mm')}</div>
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-[9px] bg-white/10 text-white border-none">{t.durationMinutes} m</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}