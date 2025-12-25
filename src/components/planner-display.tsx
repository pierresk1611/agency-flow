'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isValid } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Clock, Pencil, Loader2 } from 'lucide-react'
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts' 
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger, 
    DialogFooter 
} from "@/components/ui/dialog"


// TLAČIDLO PRE DELETE (s auto-refreshom)
const DeleteButton = ({ entryId }: { entryId: string }) => {
    // Odstránil som router.refresh() a používam window.location.reload()
    const [loading, setLoading] = useState(false)
    
    const handleDelete = async () => {
        if(!confirm("Naozaj vymazať túto naplánovanú položku?")) return
        setLoading(true)
        try {
            const res = await fetch(`/api/planner/${entryId}`, { method: 'DELETE' })
            if (res.ok) window.location.reload() // <--- SILNÝ REFRESH
        } catch(e) { console.error(e) } finally { setLoading(false) }
    }
    return (
        <div className="flex items-center">
            {loading ? <Loader2 className="h-3 w-3 animate-spin text-red-500" /> : (
                <Trash2 
                    className="h-3 w-3 text-red-400 cursor-pointer hover:text-red-600" 
                    onClick={handleDelete}
                />
            )}
        </div>
    )
}

// DIALÓG PRE EDITÁCIU
const EditDialog = ({ entry, allJobs, onSave }: { entry: any, allJobs: any[], onSave: () => void }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    
    const [jobId, setJobId] = useState(entry.jobId || 'INTERNAL')
    const [date, setDate] = useState(format(new Date(entry.date), 'yyyy-MM-dd'))
    const [minutes, setMinutes] = useState(entry.minutes.toString())
    const [title, setTitle] = useState(entry.title || '')

    const handleSave = async () => {
        setLoading(true)
        const finalJobId = jobId === 'INTERNAL' ? null : jobId;
        try {
            const res = await fetch(`/api/planner/${entry.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: finalJobId, date, minutes, title })
            })
            if (res.ok) {
                setOpen(false)
                onSave() // Volá refresh
            } else {
                alert("Chyba pri úprave.")
            }
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600">
                    <Pencil className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Upraviť záznam</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label>Job</Label>
                        <Select onValueChange={setJobId} value={jobId}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INTERNAL">INTERNÁ PRÁCA</SelectItem> 
                                {allJobs.map(job => (<SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2"><Label>Popis</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Dátum</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Minúty</Label><Input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} /></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white w-full">Uložiť zmeny</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function PlannerDisplay({ initialEntries, allJobs }: { initialEntries: any[], allJobs: any[] }) {
    const router = useRouter() // Musíme importovať router kvôli onSave v EditDialog
    const [entries] = useState(initialEntries)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    // LOGIKA GRAFU
    const plannedHoursData = days.map(day => {
      const totalMinutes = entries
        .filter(e => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
        .reduce((sum, e) => sum + e.minutes, 0)
      
      return { name: format(day, 'E'), hodiny: totalMinutes / 60, minutes: totalMinutes }
    })
    
    if (!isMounted) return <div className="h-[250px] w-full bg-slate-50 animate-pulse rounded-xl" />


    return (
        <div className="space-y-6">
            <Card className="shadow-lg border-none ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Clock className="h-4 w-4" /> Naplánovaná Kapacita</CardTitle>
                    <Badge variant="secondary" className="bg-white/10 text-white font-bold text-xs">{Math.floor(plannedHoursData.reduce((s,i) => s + i.minutes, 0) / 60)}h</Badge>
                </CardHeader>
                <CardContent className="pt-4 h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={plannedHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="hodiny" name="Hodiny" fill="#34d399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>


            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {days.map(day => {
                const dayEntries = entries.filter(e => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

                return (
                    <Card key={day.toString()} className={`min-h-[250px] shadow-md ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardHeader className="p-3 border-b bg-slate-50/50">
                        <p className="text-[10px] font-black uppercase text-slate-400">{format(day, 'EEEE')}</p>
                        <p className="text-sm font-bold">{format(day, 'd. MMMM')}</p>
                    </CardHeader>
                    <CardContent className="p-2 space-y-2">
                        {dayEntries.length === 0 ? (
                            <p className="text-center py-6 text-slate-400 text-xs italic">Voľný deň.</p>
                        ) : (
                            dayEntries.map(e => (
                                <div key={e.id} className="p-2 bg-white border rounded text-[10px] shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-blue-600 uppercase">{e.job?.campaign?.client?.name || 'Interná práca'}</p>
                                        <p className="font-medium truncate">{e.title}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-[8px] h-4 mb-1">{e.minutes}m</Badge>
                                        <EditDialog entry={e} allJobs={allJobs} onSave={() => window.location.reload()} />
                                        <DeleteButton entryId={e.id} />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                    </Card>
                )
                })}
            </div>
        </div>
    )
}