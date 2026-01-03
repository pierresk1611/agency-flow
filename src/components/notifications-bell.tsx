'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function NotificationsBell() {
  const router = useRouter()
  const [notes, setNotes] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notes.filter(n => !n.isRead).length

  // ... fetch logic exists ...

  const fetchNotes = () => {
    fetch('/api/notifications').then(r => r.json()).then(setNotes)
  }

  useEffect(() => {
    fetchNotes()
    const interval = setInterval(fetchNotes, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAllAsRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    fetchNotes()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Upozornenia</DialogTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[10px] text-blue-600 hover:text-blue-700 h-auto p-0 px-2">
              Označiť všetko prečítané
            </Button>
          )}
        </DialogHeader>
        <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400">Žiadne nové správy.</p>
          ) : (
            notes.map(n => (
              <div
                key={n.id}
                onClick={async (e) => {
                  e.stopPropagation()

                  // Optimistic Update
                  setNotes(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item))

                  // Mark as read specifically
                  if (!n.isRead) {
                    try {
                      await fetch('/api/notifications', {
                        method: 'PATCH',
                        body: JSON.stringify({ id: n.id })
                      })
                      fetchNotes()
                    } catch (err) {
                      console.error("Failed to mark read", err)
                    }
                  }

                  if (n.link) {
                    setIsOpen(false)
                    router.push(n.link)
                    router.refresh()
                  }
                }}
                className={cn(
                  "p-3 rounded-lg border transition-colors cursor-pointer hover:bg-slate-50 relative",
                  n.isRead ? "bg-white border-slate-100 opacity-60" : "bg-blue-50 border-blue-100"
                )}
              >
                {!n.isRead && <span className="absolute top-3 right-3 h-2 w-2 bg-blue-500 rounded-full" />}
                <p className="text-xs font-bold pr-4">{n.title}</p>
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