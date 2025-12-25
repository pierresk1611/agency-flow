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

export function TrafficWorkloadManager({ initialUsers, role, slug }: { initialUsers: UserWithJobs[], role: string, slug: string }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  const [requestOpen, setRequestOpen] = useState(false)
  const [activeAssign, setActiveAssign] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [targetUserId, setTargetUserId] = useState('')

  // Priame prehodenie (Admin/Traffic)
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

  // Odoslanie žiadosti (Creative)
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
        alert("Žiadosť odoslaná!")
        setRequestOpen(false)
        router.refresh()
      }
    } catch (e) { console.error(e) }
    finally { setLoadingId(null) }
  }

  return (
    <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
      {initialUsers.map(user => (
        <Card key={user.id} className="shadow-sm border-slate-200 overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b py-4 px-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarFallback className="bg-slate-900 text-white font-black text-sm uppercase">
                    {(user.name || user.email).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <CardTitle className="text-sm font-bold text-slate-800 truncate">
                    {user.name || user.email.split('@')[0]}
                </CardTitle>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate">
                    {user.position || 'Bez pozície'}
                </span>
              </div>
              <Badge variant="secondary" className="ml-auto bg-white border-slate-200 text-slate-700 font-bold text-[10px]">
                {user.assignments?.length || 0} Úlohy
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {user.assignments.length === 0 ? (
                  <div className="p-6 text-center text-[10px] text-slate-400 italic uppercase tracking-widest">
                      Bez aktívnych priradení.
                  </div>
              ) : (
                user.assignments.map((assign: any) => (
                    <div key={assign.id} className="p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group transition-colors hover:bg-slate-50/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase">{assign.job?.campaign?.client?.name || 'Interný Job'}</p>
                        <h4 className="text-xs font-bold text-slate-800 truncate">{assign.job?.title}</h4>
                      </div>
    
                      {role !== 'CREATIVE' ? (
                        <Select 
                          onValueChange={(val) => handleDirectReassign(assign.id, val)}
                          disabled={loadingId === assign.id}
                        >
                          <SelectTrigger className="h-8 text-[9px] w-full sm:w-28 font-bold uppercase tracking-tighter bg-white shadow-sm">
                              <ArrowRightLeft className="h-3 w-3 mr-2 text-slate-400" />
                              <SelectValue placeholder="PREHODIŤ" />
                          </SelectTrigger>
                          <SelectContent>
                            {initialUsers.filter(u => u.id !== user.id).map(other => (
                              <SelectItem key={other.id} value={other.id} className="text-xs">
                                {other.name || other.email.split('@')[0]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase w-full sm:w-auto" 
                            onClick={() => { setActiveAssign(assign); setRequestOpen(true) }}
                        >
                            <MessageSquareShare className="h-3 w-3 mr-1" /> Žiadať presun
                        </Button>
                      )}
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* DIALÓG ŽIADOSTI */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle className="text-lg">Žiadosť o presun práce</DialogTitle></DialogHeader>
              <div className="grid gap-6 py-4">
                  <div className="grid gap-2"><Label>Navrhnúť kolegu</Label>
                      <Select onValueChange={setTargetUserId} value={targetUserId}>
                          <SelectTrigger><SelectValue placeholder="Vyberte kolegu..." /></SelectTrigger>
                          <SelectContent>
                              {initialUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-2"><Label>Dôvod (pre Admina)</Label>
                      <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Napr. Preťaženie..." />
                  </div>
              </div>
              <DialogFooter>
                  <Button onClick={handleRequestSend} disabled={loadingId === 'request'} className="bg-slate-900 text-white w-full">
                    {loadingId === 'request' ? <Loader2 className="animate-spin" /> : "Odoslať žiadosť"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  )
}