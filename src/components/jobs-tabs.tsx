'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight, Trophy, Archive as ArchiveIcon } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { JobActions } from '@/components/job-actions'
import { ReassignmentDialog } from '@/components/reassignment-dialog'

export function JobsTabs({
    activeJobs,
    archivedJobs,
    tenders,
    colleagues,
    slug,
    isCreative,
    session
}: any) {
    const [activeTab, setActiveTab] = useState('active')

    // Group archived jobs by client
    const groupedArchived = archivedJobs.reduce((acc: any, job: any) => {
        const clientName = job.campaign?.client?.name || 'Bez klienta'
        if (!acc[clientName]) acc[clientName] = []
        acc[clientName].push(job)
        return acc
    }, {})

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="active">Aktívne ({activeJobs.length})</TabsTrigger>
                <TabsTrigger value="archive">
                    <ArchiveIcon className="h-4 w-4 mr-2" />
                    Archív ({archivedJobs.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <Table className="min-w-[900px] md:min-w-full">
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-20 text-center text-[10px] font-bold uppercase">Prio</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase">Projekt</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase">Klient</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase">Termín</TableHead>
                                    {!isCreative && <TableHead className="text-[10px] font-bold uppercase">Budget</TableHead>}
                                    <TableHead className="text-right pr-6 text-[10px] font-bold uppercase">Akcia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeJobs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic text-sm">
                                            Žiadne aktívne projekty.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activeJobs.map((proj: any) => (
                                        <TableRow key={proj.id} className={`hover:bg-slate-50/50 transition-colors ${proj.type === 'TENDER' ? 'bg-purple-50/20' : ''}`}>
                                            <TableCell className="text-center font-bold">
                                                {proj.type === 'TENDER'
                                                    ? <Badge className="bg-purple-600 text-[9px]">PITCH</Badge>
                                                    : <span className={proj.priority >= 4 ? "text-red-600" : "text-slate-400"}>P{proj.priority}</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        {proj.type === 'TENDER'
                                                            ? <Trophy className="h-3 w-3 text-purple-600" />
                                                            : <ArrowRight className="h-3 w-3 text-blue-500" />}
                                                        <span className="font-semibold text-slate-800">{proj.title}</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{proj.campaign}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-slate-600">{proj.client}</TableCell>
                                            <TableCell className="text-xs font-medium text-slate-700">
                                                {format(new Date(proj.deadline), 'dd.MM.yyyy')}
                                            </TableCell>
                                            {!isCreative && <TableCell className="font-mono text-xs font-bold text-slate-600">{proj.budget ? proj.budget.toFixed(0) : '-'} €</TableCell>}
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Link href={proj.type === 'TENDER' ? `/${slug}/tenders/${proj.id}` : `/${slug}/jobs/${proj.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8">Detail</Button>
                                                    </Link>
                                                    {proj.type === 'JOB' && !isCreative && <JobActions jobId={proj.id} />}

                                                    {/* Reassignment Button */}
                                                    {proj.type === 'JOB' && (() => {
                                                        const myAssignment = proj.assignments?.find((a: any) => a.userId === session.userId)
                                                        if (myAssignment) {
                                                            return <ReassignmentDialog assignmentId={myAssignment.id} currentUserId={session.userId} colleagues={colleagues} />
                                                        }
                                                        return null
                                                    })()}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="archive">
                <div className="space-y-6">
                    {Object.keys(groupedArchived).length === 0 ? (
                        <div className="rounded-xl border bg-white shadow-sm p-20 text-center">
                            <p className="text-slate-400 italic">Žiadne archivované joby.</p>
                        </div>
                    ) : (
                        Object.entries(groupedArchived).map(([clientName, jobs]: [string, any]) => (
                            <div key={clientName} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                                <div className="bg-slate-100 px-4 py-3 border-b">
                                    <h3 className="font-bold text-slate-900">{clientName}</h3>
                                </div>
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-[10px] font-bold uppercase">Projekt</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase">Kampaň</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase">Uzavreté</TableHead>
                                            <TableHead className="text-right pr-6 text-[10px] font-bold uppercase">Akcia</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {jobs.map((job: any) => (
                                            <TableRow key={job.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-semibold text-slate-800">{job.title}</TableCell>
                                                <TableCell className="text-sm text-slate-600">{job.campaign?.name}</TableCell>
                                                <TableCell className="text-xs text-slate-500">
                                                    {job.archivedAt ? format(new Date(job.archivedAt), 'dd.MM.yyyy') : '-'}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Link href={`/${slug}/jobs/${job.id}`}>
                                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8">Detail</Button>
                                                        </Link>
                                                        {!isCreative && <JobActions jobId={job.id} isArchived={true} />}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ))
                    )}
                </div>
            </TabsContent>
        </Tabs>
    )
}
