'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle, BellRing } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { TimesheetActions } from '@/components/timesheet-actions'
import { NudgeButton } from '@/components/nudge-button'

export function TimesheetsTabs({
    activeTimesheets,
    archivedTimesheets,
    isCreative
}: {
    activeTimesheets: any[],
    archivedTimesheets: any[],
    isCreative: boolean
}) {
    return (
        <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="active">Na schválenie ({activeTimesheets.length})</TabsTrigger>
                <TabsTrigger value="archive">Archív / Schválené ({archivedTimesheets.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
                <TimesheetTable timesheets={activeTimesheets} isCreative={isCreative} />
            </TabsContent>

            <TabsContent value="archive">
                <ArchivedTimesheetsView timesheets={archivedTimesheets} isCreative={isCreative} />
            </TabsContent>
        </Tabs>
    )
}

function ArchivedTimesheetsView({ timesheets, isCreative }: { timesheets: any[], isCreative: boolean }) {
    if (timesheets.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400 italic bg-white border rounded-xl shadow-sm">
                Žiadne záznamy v archíve.
            </div>
        )
    }

    // Group by Client
    const grouped = timesheets.reduce((acc, ts) => {
        const clientName = ts.jobAssignment.job.campaign.client.name || 'Neznámy Klient'
        if (!acc[clientName]) acc[clientName] = []
        acc[clientName].push(ts)
        return acc
    }, {} as Record<string, typeof timesheets>)

    return (
        <div className="space-y-8">
            {Object.entries(grouped).map(([clientName, clientTimesheets]) => (
                <div key={clientName} className="space-y-3">
                    <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter mb-2 pl-6 ml-px">{clientName}</h3>
                    <TimesheetTable timesheets={clientTimesheets as any[]} isCreative={isCreative} isArchive />
                </div>
            ))}
        </div>
    )
}

import { RunningTimer } from '@/components/running-timer'


function TimesheetTable({ timesheets, isCreative, isArchive }: { timesheets: any[], isCreative: boolean, isArchive?: boolean }) {
    if (timesheets.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400 italic bg-white border rounded-xl shadow-sm">
                Žiadne záznamy.
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
                <Table className="min-w-[900px]">
                    <TableHeader className="bg-slate-50 text-[10px] font-black uppercase">
                        <TableRow>
                            <TableHead className="pl-6 w-[200px]">Kedy / Kto</TableHead>
                            <TableHead className="w-auto">Projekt / Task</TableHead>
                            <TableHead className="w-[120px]">Trvanie</TableHead>
                            {isCreative ? (
                                <TableHead className="text-right w-[120px] text-[10px]">Moja mzda</TableHead>
                            ) : (
                                <>
                                    <TableHead className="text-right w-[120px] text-[10px]">Náklad (Internal)</TableHead>
                                    <TableHead className="text-right w-[120px] text-[10px]">Fakturácia (Bill)</TableHead>
                                </>
                            )}
                            <TableHead className="w-[150px] text-center">Status</TableHead>
                            {!isArchive && <TableHead className="text-right pr-6 w-[120px]">Akcia</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timesheets.map((ts) => {
                            const isRunning = ts.endTime === null
                            return (
                                <TableRow
                                    key={ts.id}
                                    className={cn(
                                        "hover:bg-slate-50/50",
                                        ts.isUrgent && ts.status === 'PENDING' ? "bg-red-50/30" : ""
                                    )}
                                >
                                    <TableCell className="pl-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-bold text-slate-700 text-sm">{format(new Date(ts.startTime), 'dd.MM.yyyy')}</div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                {ts.jobAssignment.user?.name || ts.jobAssignment.user?.email?.split('@')[0] || 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-800">{ts.jobAssignment.job?.title || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                <span className="text-blue-600">{ts.jobAssignment.job?.campaign?.name || 'N/A'}</span>
                                                <span className="opacity-60">{ts.jobAssignment.job?.campaign?.client?.name || 'N/A'}</span>
                                            </div>
                                            {ts.description && (
                                                <p className="text-[10px] text-slate-400 italic mt-1 border-l-2 pl-2 border-slate-100 line-clamp-2">
                                                    {ts.description}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            {isRunning ? (
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="animate-pulse border-blue-200 text-blue-700 font-bold bg-blue-50 w-fit">BEŽÍ...</Badge>
                                                    <RunningTimer startTime={ts.startTime} totalPausedMinutes={ts.totalPausedMinutes} />
                                                </div>
                                            ) : (
                                                <span className="font-mono text-xs font-black text-slate-600 tracking-tighter">
                                                    {Math.floor((ts.durationMinutes || 0) / 60)}h {(ts.durationMinutes || 0) % 60}m
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    {isCreative ? (
                                        <TableCell className="text-right font-mono text-xs font-bold text-blue-700">
                                            {(() => {
                                                if (ts.status === 'APPROVED' && ts.budgetItem) {
                                                    return ts.budgetItem.internalAmount ? `${ts.budgetItem.internalAmount.toFixed(2)} €` : '-'
                                                }
                                                // Prebiehajúce alebo Čakajúce
                                                const hours = (ts.durationMinutes || 0) / 60
                                                const costType = ts.jobAssignment.assignedCostType || 'hourly'
                                                const costRate = ts.jobAssignment.assignedCostValue ?? (ts.jobAssignment.assignedCostType === 'task' ? ts.jobAssignment.user?.defaultTaskRate : ts.jobAssignment.user?.costRate || ts.jobAssignment.user?.hourlyRate) ?? 0
                                                const amount = costType === 'task' ? costRate : hours * costRate
                                                return amount > 0 ? `${amount.toFixed(2)} €` : '-'
                                            })()}
                                        </TableCell>
                                    ) : (
                                        <>
                                            <TableCell className="text-right font-mono text-xs text-slate-500">
                                                {(() => {
                                                    if (ts.status === 'APPROVED' && ts.budgetItem) {
                                                        return ts.budgetItem.internalAmount ? `${ts.budgetItem.internalAmount.toFixed(2)} €` : '-'
                                                    }
                                                    const hours = (ts.durationMinutes || 0) / 60
                                                    const costType = ts.jobAssignment.assignedCostType || 'hourly'
                                                    const costRate = ts.jobAssignment.assignedCostValue ?? (ts.jobAssignment.assignedCostType === 'task' ? ts.jobAssignment.user?.defaultTaskRate : ts.jobAssignment.user?.costRate || ts.jobAssignment.user?.hourlyRate) ?? 0
                                                    const amount = costType === 'task' ? costRate : hours * costRate
                                                    return amount > 0 ? `${amount.toFixed(2)} €` : '-'
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs font-bold text-slate-700">
                                                {(() => {
                                                    if (ts.status === 'APPROVED' && ts.budgetItem) {
                                                        return ts.budgetItem.amount ? `${ts.budgetItem.amount.toFixed(2)} €` : '-'
                                                    }
                                                    const hours = (ts.durationMinutes || 0) / 60
                                                    const costType = ts.jobAssignment.assignedCostType || 'hourly'
                                                    const billRate = ts.jobAssignment.assignedBillingValue ?? ts.jobAssignment.user?.hourlyRate ?? 0
                                                    const amount = costType === 'task' ? billRate : hours * billRate
                                                    return amount > 0 ? `${amount.toFixed(2)} €` : '-'
                                                })()}
                                            </TableCell>
                                        </>
                                    )}
                                    <TableCell>
                                        <div className="flex flex-col gap-1 items-center">
                                            {ts.status === 'APPROVED' && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold uppercase">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Schválené
                                                </Badge>
                                            )}
                                            {ts.status === 'REJECTED' && (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase">
                                                    <XCircle className="h-3 w-3 mr-1" /> Zamietnuté
                                                </Badge>
                                            )}
                                            {ts.status === 'PENDING' && !isRunning && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] font-bold uppercase",
                                                        ts.isUrgent ? "bg-red-600 text-white border-none animate-pulse" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                    )}
                                                >
                                                    {ts.isUrgent ? <BellRing className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                                    {ts.isUrgent ? 'URGENTNÉ' : 'ČAKÁ'}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    {!isArchive && (
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end items-center gap-2">
                                                {isCreative && ts.status === 'PENDING' && !isRunning && !ts.isUrgent && (
                                                    <NudgeButton timesheetId={ts.id} />
                                                )}
                                                {!isCreative && (
                                                    <TimesheetActions id={ts.id} status={ts.status} isRunning={isRunning} />
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
