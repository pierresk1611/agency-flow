'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Bell, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export function NotificationWidget({ notifications: initialData }: { notifications: any[] }) {
    const router = useRouter()
    const [notifications, setNotifications] = useState(initialData)

    const handleDismiss = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id))
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id })
            })
            router.refresh()
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <Card className="shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                    <Bell className="h-4 w-4" /> Centrum Upozornení
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">Žiadne nové upozornenia.</div>
                ) : (
                    <div className="divide-y">
                        {notifications.map(n => (
                            <div key={n.id} className="flex items-start gap-2 hover:bg-slate-50 transition group">
                                <Link href={n.link || '#'} className="flex-1 min-w-0 p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{n.title}</span>
                                        <span className="text-[9px] text-slate-400">{format(new Date(n.createdAt), 'dd.MM HH:mm')}</span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-tight line-clamp-2">{n.message}</p>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 mt-2 mr-2 flex-shrink-0"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDismiss(n.id)
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
