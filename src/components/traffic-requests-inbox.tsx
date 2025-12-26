'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2, ArrowRightLeft, MessageCircleWarning } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface RequestItem {
  id: string
  reason: string
  createdAt: string
  requestByUser: { name: string | null; email: string }
  targetUser: { name: string | null; email: string }
  assignment: {
    job: {
      title: string
      campaign: { client: { name: string } }
    }
  }
}

export function TrafficRequestsInbox() {
  const router = useRouter()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/traffic/requests')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setRequests(data)
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(requestId)
    try {
        const res = await fetch('/api/traffic/requests', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, status })
        })
        if (res.ok) {
            await fetchRequests() // Obnoví zoznam
            router.refresh()      // Obnoví celú stránku (aby sa prehodili joby v grafoch)
        }
    } catch (e) { console.error(e) }
    finally { setProcessingId(null) }
  }

  if (loading) return null // Nechceme blikať, ak načítavame
  if (requests.length === 0) return null // Ak nie sú žiadosti, nezobrazujeme nič

  return (
    <Card className="border-l-4 border-l-orange-500 shadow-md mb-8 bg-orange-50/30">
        <CardHeader className="py-3 border-b bg-orange-100/50">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-orange-800 flex items-center gap-2">
                <MessageCircleWarning className="h-4 w-4" /> Čakajúce žiadosti o presun ({requests.length})
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y divide-orange-100">
                {requests.map(req => (
                    <div key={req.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-slate-700">{req.requestByUser.name || req.requestByUser.email}</span>
                                <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                                <span className="font-bold text-slate-700">{req.targetUser.name || req.targetUser.email}</span>
                                <span className="text-slate-400 ml-2">({format(new Date(req.createdAt), 'dd.MM HH:mm')})</span>
                            </div>
                            <p className="font-black text-sm text-slate-900">
                                {req.assignment.job.title} <span className="font-normal text-slate-500">({req.assignment.job.campaign.client.name})</span>
                            </p>
                            <p className="text-xs text-slate-600 italic bg-white border px-2 py-1 rounded inline-block">
                                " {req.reason} "
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                onClick={() => handleAction(req.id, 'APPROVED')} 
                                disabled={!!processingId}
                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                            >
                                {processingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                                Schváliť
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAction(req.id, 'REJECTED')} 
                                disabled={!!processingId}
                                className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                            >
                                Zamietnuť
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
  )
}