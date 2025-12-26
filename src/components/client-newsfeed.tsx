'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Pin, Send, Loader2, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Toggle } from "@/components/ui/toggle"

export function ClientNewsfeed({ clientId, initialNotes }: { clientId: string, initialNotes: any[] }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddNote = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, isPinned })
      })
      if (res.ok) {
        setText('')
        setIsPinned(false)
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  // Rozdelíme poznámky na Pripnuté (Hore) a Ostatné
  const pinnedNotes = initialNotes.filter(n => n.isPinned)
  const normalNotes = initialNotes.filter(n => !n.isPinned)

  return (
    <Card className="shadow-md border-blue-100 h-full flex flex-col">
      <CardHeader className="bg-blue-50/50 border-b py-3">
        <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-900">
                Klientsky Denník & Prístupy
            </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4 min-h-[400px]">
        {/* INPUT OBLASŤ */}
        <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border shadow-sm">
            <Textarea 
                placeholder="Zápis zo stretka, nové heslá alebo dôležité info..." 
                value={text} 
                onChange={e => setText(e.target.value)}
                className="min-h-[80px] border-0 focus-visible:ring-0 resize-none p-0 text-sm"
            />
            <div className="flex justify-between items-center pt-2 border-t mt-2">
                <Toggle 
                    pressed={isPinned} 
                    onPressedChange={setIsPinned} 
                    size="sm" 
                    variant="outline"
                    className="gap-2 text-xs font-bold data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 data-[state=on]:border-orange-200"
                >
                    <Pin className="h-3 w-3" /> {isPinned ? 'Pripnuté (Dôležité)' : 'Pripnúť'}
                </Toggle>
                <Button size="sm" onClick={handleAddNote} disabled={loading || !text.trim()} className="bg-blue-600 hover:bg-blue-700 h-8">
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
            </div>
        </div>

        {/* ZOZNAM POZNÁMOK */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            
            {/* PRIPNUTÉ (Dôležité) */}
            {pinnedNotes.length > 0 && (
                <div className="space-y-2 mb-4">
                    <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest pl-1">Dôležité / Prístupy</p>
                    {pinnedNotes.map(note => (
                        <div key={note.id} className="p-3 bg-orange-50/80 border border-orange-200 rounded-lg text-sm relative group">
                            <Pin className="h-3 w-3 text-orange-400 absolute top-3 right-3" />
                            <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px] bg-white">{note.user.email.charAt(0)}</AvatarFallback></Avatar>
                                <span className="text-[10px] font-bold text-orange-800">{note.user.name || note.user.email}</span>
                                <span className="text-[10px] text-orange-400">{format(new Date(note.createdAt), 'dd.MM.yyyy')}</span>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap font-medium">{note.text}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* OSTATNÉ (Chronologické) */}
            {normalNotes.map(note => (
                <div key={note.id} className="flex gap-3">
                     <Avatar className="h-8 w-8 mt-1 border shadow-sm">
                        <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-600">
                            {(note.user.name || note.user.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-slate-800">{note.user.name || note.user.email.split('@')[0]}</span>
                            <span className="text-[10px] text-slate-400">{format(new Date(note.createdAt), 'dd.MM HH:mm')}</span>
                        </div>
                        <div className="bg-white p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border text-sm text-slate-600 whitespace-pre-wrap shadow-sm">
                            {note.text}
                        </div>
                    </div>
                </div>
            ))}
            
            {initialNotes.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-xs text-slate-400 italic">Zatiaľ žiadne záznamy. Pridajte prvý zápis.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}