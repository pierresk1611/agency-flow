'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Timesheet {
    id: string
    startTime: Date | string
    endTime: Date | string | null
    durationMinutes: number
    userName: string
    userEmail: string
}

export function JobTimesheetsDialog({
    timesheets,
    jobTitle,
    trigger
}: {
    timesheets: any[],
    jobTitle: string,
    trigger: React.ReactNode
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Všetky výkazy: {jobTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 mt-4">
                    {timesheets.length === 0 ? (
                        <p className="text-center py-10 text-slate-400 italic">Zatiaľ žiadne záznamy času.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kto</TableHead>
                                    <TableHead>Dátum</TableHead>
                                    <TableHead>Poznámka</TableHead>
                                    <TableHead className="text-right">Dĺžka</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timesheets.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="h-3 w-3 text-slate-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{t.userName}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase tracking-tighter">{t.userEmail.split('@')[0]}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell suppressHydrationWarning>
                                            <div className="text-xs">
                                                <div className="font-medium text-slate-700">{format(new Date(t.startTime), 'dd.MM.yyyy')}</div>
                                                <div className="text-[10px] text-slate-400">{format(new Date(t.startTime), 'HH:mm')} - {t.endTime ? format(new Date(t.endTime), 'HH:mm') : '...'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-[10px] text-slate-600 italic line-clamp-2 max-w-[200px]">
                                                {t.description || "—"}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="font-mono text-[10px]">
                                                {t.durationMinutes} min
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
