'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isValid, differenceInDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Clock, CalendarDays } from 'lucide-react'
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts' 

export function PlannerDisplay({ initialEntries }: { initialEntries: any[] }) {
    const [entries] = useState(initialEntries)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true) // Zabezpečí, že Recharts sa nespustí na serveri
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
    
    // UI: Ak to ešte nie je namontované, zobraziť placeholder
    if (!isMounted) return <div className="h-[250px] w-full bg-slate-50 animate-pulse rounded-xl" />


    return (
        <div className="space-y-6">
            {/* GRAF VYŤAŽENOSTI NA TÝŽDEŇ */}
            <Card className="shadow-lg border-none ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="p-4 bg-slate-900 text-white flex flex-row justify-between items-center">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Clock className="h-4 w-4" /> Naplánovaná Kapacita</CardTitle>
                    <Badge variant="secondary" className="bg-white/10 text-white font-bold text-xs">{plannedHoursData.reduce((s,i) => s + i.minutes, 0)} min</Badge>
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
                                    <div className="flex flex-col items-end">
                                        <Badge variant="outline" className="text-[8px] h-4 mb-1">{e.minutes}m</Badge>
                                        <Trash2 className="h-3 w-3 text-red-400 cursor-pointer hover:text-red-600" />
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