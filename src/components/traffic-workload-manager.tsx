'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, MessageSquareShare, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function TrafficWorkloadManager({
  initialUsers,
  allUsersList = [],
  role,
  currentUserId,
  slug
}: {
  initialUsers: any[],
  allUsersList: any[],
  role: string,
  currentUserId: string,
  slug: string
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Auto-scroll and highlight logic based on URL hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.substring(1) // remove #
      const element = document.getElementById(id)
      if (element) {
        // Delay slightly to ensure layout is ready
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.setAttribute('data-highlighted', 'true')
          setTimeout(() => element.removeAttribute('data-highlighted'), 3000)
        }, 500)
      }
    }
  }, [])

  // State pre Reassignment Request
  const [requestedIds, setRequestedIds] = useState<string[]>([])
  const [requestOpen, setRequestOpen] = useState(false)
  const [activeAssign, setActiveAssign] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [targetUserId, setTargetUserId] = useState('')

  const isManager = ['ADMIN', 'TRAFFIC', 'ACCOUNT', 'SUPERADMIN'].includes(role)

  const handleDirectReassign = async (assignmentId: string, newUserId: string) => {
    setLoadingId(assignmentId)
    try {
      const res = await fetch('/api/jobs/reassign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, newUserId })
      })
      if (res.ok) {
        router.refresh()
        setTimeout(() => window.location.reload(), 500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      // setLoadingId(null) // Keep lock
    }
  }

  const handleRequestSend = async () => {
    if (!targetUserId || !reason || !activeAssign) return
    setLoadingId('request')
    try {
      const res = await fetch('/api/jobs/reassign/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: activeAssign.id, targetUserId, reason }),
        cache: 'no-store'
      })

      if (res.ok) {
        setRequestedIds(prev => [...prev, activeAssign.id])
        setRequestOpen(false)
        setReason('')
        setTargetUserId('')

        router.refresh()
        setTimeout(() => window.location.reload(), 500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      // setLoadingId(null) // Keep lock for reload
    }
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {initialUsers.map((user: any) => (
        <Card key={user.id} id={`user-${user.id}`} className="shadow-sm border-slate-200 overflow-hidden bg-white scroll-mt-20 data-[highlighted=true]:ring-2 data-[highlighted=true]:ring-amber-400 transition-all duration-1000">
          <CardHeader className="bg-slate-50/50 border-b py-3 px-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-8 w-8 border shadow-sm">
                <AvatarFallback className="text-[10px] font-bold bg-white text-slate-600 uppercase">
                  {(user.name || user.email).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-xs font-bold text-slate-800">
                  {user.name || user.email.split('@')[0]}
                </CardTitle>
              </div>
              <Badge variant="secondary" className="ml-auto text-[9px] font-bold uppercase">
                {(user.assignments || []).length} ÚLOHY
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {(!user.assignments || user.assignments.length === 0) ? (
                <div className="p-6 text-center text-[10px] text-slate-400 italic uppercase tracking-widest">
                  Bez aktívnych priradení.
                </div>
              ) : (
                user.assignments.map((assign: any) => (
                  <div key={assign.id} className="p-3 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0 pr-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                        {assign.job?.campaign?.client?.name || 'Interný Projekt'}
                      </p>
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {assign.job?.title}
                      </h4>
                    </div>

                    <TrafficActionColumn
                      assign={assign}
                      user={user}
                      isManager={isManager}
                      currentUserId={currentUserId}
                      loadingId={loadingId}
                      allUsersList={allUsersList}
                      requestedIds={requestedIds}
                      onDirectReassign={handleDirectReassign}
                      onRequestOpen={(a) => { setActiveAssign(a); setRequestOpen(true) }}
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-lg">Žiadosť o presun práce</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2"><Label>Kolega na prevzatie</Label>
              <Select onValueChange={setTargetUserId} value={targetUserId}>
                <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Vyberte kolegu..." /></SelectTrigger>
                <SelectContent>{allUsersList.filter(u => u.id !== currentUserId).map(u => (<SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Dôvod</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Preťaženie, dovolenka..." className="min-h-[100px] bg-slate-50 border-slate-200" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRequestOpen(false)}>Zrušiť</Button>
            <Button onClick={handleRequestSend} disabled={loadingId === 'request' || !targetUserId || !reason} className="bg-slate-900 text-white">Odoslať žiadost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TrafficActionColumn({
  assign,
  user,
  isManager,
  currentUserId,
  loadingId,
  allUsersList,
  requestedIds,
  onDirectReassign,
  onRequestOpen
}: any) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-7 w-28" />
  }

  // MANAGER VIEW
  if (isManager) {
    // Check if there is a pending request
    const pendingReq = assign.reassignmentRequests?.find((r: any) => r.status === 'PENDING')

    if (pendingReq) {
      // Find target user name
      const targetUser = allUsersList.find((u: any) => u.id === pendingReq.targetUserId)
      const targetName = targetUser ? (targetUser.name || targetUser.email || 'Neznámy').split(' ')[0] : '?'

      return (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="h-7 text-[9px] font-bold text-amber-700 bg-amber-50 border-amber-200 mr-1 flex flex-col items-start leading-none py-0.5 px-2">
            <span className="text-[7px] text-amber-400 uppercase">Žiada o presun</span>
            <span>{targetName}</span>
          </Badge>
          <div className="flex gap-0.5">
            <Button
              size="sm"
              variant="default"
              className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
              title="Schváliť presun"
              onClick={() => onDirectReassign(assign.id, pendingReq.targetUserId)}
              disabled={!!loadingId}
            >
              <Check className="h-3 w-3" />
            </Button>
            {/* Reject Logic to be implemented if needed */}
            <Button
              size="sm"
              variant="destructive"
              className="h-7 w-7 p-0 rounded-lg shadow-sm"
              title="Zamietnuť (TODO)"
              onClick={() => alert("Zamietnutie zatiaľ nie je implementované.")}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <Select onValueChange={(val) => onDirectReassign(assign.id, val)} disabled={loadingId === assign.id}>
        <SelectTrigger className="h-7 text-[8px] w-28 font-bold uppercase tracking-tighter bg-white shadow-sm">
          <SelectValue placeholder="PREHODIŤ" />
        </SelectTrigger>
        <SelectContent>
          {allUsersList.filter((u: any) => u.id !== user.id).map((other: any) => (
            <SelectItem key={other.id} value={other.id} className="text-xs">
              {other.name || other.email.split('@')[0]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // CREATIVE/USER VIEW
  if (assign.userId === currentUserId) {
    const isRequested = (assign.reassignmentRequests && assign.reassignmentRequests.length > 0) || requestedIds.includes(assign.id)

    if (isRequested) {
      return (
        <Badge variant="outline" className="h-7 text-[9px] font-bold text-amber-600 bg-amber-50 uppercase border-amber-200">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Požiadané o presun
        </Badge>
      )
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase"
        onClick={() => onRequestOpen(assign)}
      >
        <MessageSquareShare className="h-3 w-3 mr-1" /> Žiadať presun
      </Button>
    )
  }

  return null
}