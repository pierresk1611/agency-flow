'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { format } from 'date-fns'

export function NotificationsBell() {
  const [notes, setNotes] = useState<any[]>([])
  const unreadCount = notes.filter(n => !n.isRead).length

  const fetchNotes = () => {
    fetch('/api/notifications').then(r => r.json()).then(setNotes)
  }

  useEffect(() => {
    fetchNotes()
    const interval = setInterval(fetchNotes, 30000) // Kontrola každých 30s
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    fetchNotes()
  }

  return (
    <Dialog onOpenChange={(open) => open && markAsRead()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Upozornenia</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400">Žiadne nové správy.</p>
          ) : (
            notes.map(n => (
              <div key={n.id} className={`p-3 rounded-lg border ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-100'}`}>
                <p className="text-xs font-bold">{n.title}</p>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                <p className="text-[9px] text-slate-400 mt-2">{format(new Date(n.createdAt), 'dd.MM HH:mm')}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}