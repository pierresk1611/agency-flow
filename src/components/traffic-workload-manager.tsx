'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowRightLeft, Calendar, MessageSquareShare } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

export function TrafficWorkloadManager({ initialUsers, role, slug }: { initialUsers: any[], role: string, slug: string }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Stavy pre žiadosť kreatívca
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
    } catch (e) { console.error(e) }
    finally { setLoadingId(null) }
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
        alert("Žiadosť bola odoslaná na schválenie Traffic manažérovi.")
        setRequestOpen(false); setReason(''); setTargetUserId('')
        router.refresh()
      }
    } catch (e) { console.error(e) }
    finally { setLoadingId(null) }
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {initialUsers.map(user => (
        <Card key={user.id} className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b py-3 px-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] font-bold">{(user.name || user.email).charAt(0)}</AvatarFallback></Avatar>
              <div className="flex flex-col"><CardTitle className="text-xs font-bold">{user.name || user.email.split('@')[0]}</CardTitle></div>
              <Badge variant="secondary" className="ml-auto text-[9px]">{user.assignments.length} joby</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {user.assignments.map((assign: any) => (
                <div key={assign.id} className="p-3 flex justify-between items-center group">
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase">{assign.job?.campaign?.client?.name}</p>
                    <h4 className="text-xs font-bold text-slate-800 truncate">{assign.job?.title}</h4>
                  </div>

                  {role !== 'CREATIVE' ? (
                    // ADMIN/TRAFFIC - PRIAME PREHODENIE
                    <Select onValueChange={(val) => handleDirectReassign(assign.id, val)} disabled={loadingId === assign.id}>
                      <SelectTrigger className="h-7 text-[8px] w-28 font-bold uppercase tracking-tighter"><SelectValue placeholder="PREHODIŤ" /></SelectTrigger>
                      <SelectContent>
                        {initialUsers.filter(u => u.id !== user.id).map(other => (
                          <SelectItem key={other.id} value={other.id} className="text-xs">{other.name || other.email.split('@')[0]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    // CREATIVE - TLAČIDLO ŽIADOSTI (len pre svoje joby)
                    assign.userId === user.id && (
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold text-blue-600 hover:text-blue-700" 
                                onClick={() => { setActiveAssign(assign); setRequestOpen(true) }}>
                            <MessageSquareShare className="h-3 w-3 mr-1" /> ŽIADAŤ PRESUN
                        </Button>
                    )
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* DIALÓG PRE ŽIADOSŤ KREATÍVCA */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>Žiadosť o presun úlohy</DialogTitle><DialogDescription>Úloha bude presunutá až po schválení Traffic manažérom.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label>Navrhnúť kolegu</Label>
                      <Select onValueChange={setTargetUserId} value={targetUserId}>
                          <SelectTrigger><SelectValue placeholder="Komu to dáme?" /></SelectTrigger>
                          <SelectContent>{initialUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-2"><Label>Dôvod (pre Accounta/Traffica)</Label>
                      <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Napr. Som preťažený, nestíham termín..." />
                  </div>
              </div>
              <DialogFooter><Button onClick={handleRequestSend} disabled={loadingId === 'request'} className="bg-slate-900 text-white">Odoslať na schválenie</Button></DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  )
}