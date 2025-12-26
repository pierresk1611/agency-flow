'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRightLeft, Calendar, MessageSquareShare } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { TrafficRequestsInbox } from '@/components/traffic-requests-inbox' // Pridal som import inboxu

interface UserWithJobs {
  id: string
  name: string | null
  email: string
  position: string | null
  assignments: {
    id: string
    userId: string
    roleOnJob: string
    job: {
      id: string
      title: string
      deadline: string
      campaign: { client: { name: string } }
    }
  }[]
}

// DOPSANÉ allActiveUsers s defaultom []
export function TrafficWorkloadManager({ initialUsers, allActiveUsers = [], role, slug }: { initialUsers: UserWithJobs[], allActiveUsers: any[], role: string, slug: string }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  const [requestOpen, setRequestOpen] = useState(false)
  const [activeAssign, setActiveAssign] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [targetUserId, setTargetUserId] = useState('')

  const handleDirectReassign = async (assignmentId: string, newUserId: string) => {
    setLoadingId(assignmentId)
    try {
      const res = await fetch('/api/jobs/reassign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, newUserId })
      })
      if (res.ok) router.refresh()
    } catch (e) { console.error(e) } finally { setLoadingId(null) }
  }

  const handleRequestSend = async () => {
    if (!targetUserId || !reason) return
    setLoadingId('request')
    try {
      const res = await fetch('/api/jobs/reassign/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: activeAssign.id, targetUserId, reason })
      })
      if (res.ok) {
        alert("Žiadosť bola odoslaná.")
        setRequestOpen(false); setReason(''); setTargetUserId('')
        router.refresh()
      }
    } catch (e) { console.error(e) } finally { setLoadingId(null) }
  }

  const isManager = role === 'ADMIN' || role === 'TRAFFIC' || role === 'SUPERADMIN' || role === 'ACCOUNT'

  return (
    <>
        {/* INBOX SA ZOBRAZÍ LEN RAZ HORE (Toto rieši nadradený page.tsx, ale ak by sme chceli in-place) */}
        {/* Tu len renderujeme karty */}
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {isManager && <div className="col-span-full"><TrafficRequestsInbox /></div>}

            {initialUsers.map(user => (
                <Card key={user.id} className="shadow-sm border-slate-200 overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b py-3 px-4">
                    <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border shadow-sm"><AvatarFallback className="text-[10px] font-bold bg-white text-slate-600">{(user.name || user.email).charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="flex flex-col"><CardTitle className="text-xs font-bold text-slate-800">{user.name || user.email.split('@')[0]}</CardTitle></div>
                    <Badge variant="secondary" className="ml-auto text-[9px] font-bold">{user.assignments.length} JOBY</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                    {user.assignments.length === 0 ? (
                        <div className="p-6 text-center text-[10px] text-slate-400 italic">Bez priradení.</div>
                    ) : (
                        user.assignments.map((assign) => (
                            <div key={assign.id} className="p-3 flex justify-between items-center group hover:bg-slate-50/50">
                                <div className="min-w-0 pr-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">{assign.job?.campaign?.client?.name}</p>
                                    <h4 className="text-xs font-bold text-slate-800 truncate">{assign.job?.title}</h4>
                                </div>
            
                                {role !== 'CREATIVE' ? (
                                    <Select onValueChange={(val) => handleDirectReassign(assign.id, val)} disabled={loadingId === assign.id}>
                                    <SelectTrigger className="h-7 text-[8px] w-28 font-bold bg-white shadow-sm"><SelectValue placeholder="PREHODIŤ" /></SelectTrigger>
                                    <SelectContent>
                                        {(allActiveUsers || []).filter(u => u.id !== user.id).map(other => (
                                        <SelectItem key={other.id} value={other.id} className="text-xs">{other.name || other.email.split('@')[0]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                ) : (
                                    // CREATIVE VIDÍ IBA SVOJE TLAČIDLO
                                    assign.userId === user.id && (
                                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black text-blue-600 uppercase" onClick={() => { setActiveAssign(assign); setRequestOpen(true) }}>
                                            <MessageSquareShare className="h-3 w-3 mr-1" /> Presunúť
                                        </Button>
                                    )
                                )}
                            </div>
                        ))
                    )}
                    </div>
                </CardContent>
                </Card>
            ))}

            <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Žiadosť o presun</DialogTitle><DialogDescription>Dôvod pre Traffic managera.</DialogDescription></DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2"><Label>Navrhnúť kolegu</Label>
                            <Select onValueChange={setTargetUserId} value={targetUserId}>
                                <SelectTrigger><SelectValue placeholder="Vyberte..." /></SelectTrigger>
                                <SelectContent>{(allActiveUsers || []).map(u => <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2"><Label>Dôvod</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Napr. Nestíham..." /></div>
                    </div>
                    <DialogFooter><Button onClick={handleRequestSend} disabled={loadingId === 'request' || !reason} className="bg-slate-900 text-white">{loadingId === 'request' ? <Loader2 className="animate-spin" /> : "Odoslať"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    </>
  )
}