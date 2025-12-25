'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Pin, MessageSquareText, Loader2, Send } from 'lucide-react'
import { format } from 'date-fns'

export function ClientNewsfeed({ clientId, initialNotes }: { clientId: string, initialNotes: any[] }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddNote = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (res.ok) {
        setText('')
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Card className="shadow-sm border-blue-200">
      <CardHeader className="bg-blue-50/30 border-b py-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-blue-500" /> Klientský Newsfeed / Poznámky
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex gap-2">
            <Textarea 
                placeholder="Zápis z meetingu, prístupy alebo dôležitý update..." 
                value={text} 
                onChange={e => setText(e.target.value)}
                className="bg-white text-sm"
            />
            <Button onClick={handleAddNote} disabled={loading || !text.trim()} className="bg-blue-600">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {initialNotes.map(note => (
                <div key={note.id} className="p-3 bg-slate-50 rounded-lg border text-sm">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {note.user.name || note.user.email.split('@')[0]} • {format(new Date(note.createdAt), 'dd.MM HH:mm')}
                        </span>
                        {note.isPinned && <Pin className="h-3 w-3 text-orange-400 fill-orange-400" />}
                    </div>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{note.text}</p>
                </div>
            ))}
            {initialNotes.length === 0 && <p className="text-center py-4 text-xs text-slate-400 italic">Zatiaľ žiadne poznámky k tomuto klientovi.</p>}
        </div>
      </CardContent>
    </Card>
  )
}