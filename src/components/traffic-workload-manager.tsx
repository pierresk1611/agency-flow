'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label" // <--- TENTO IMPORT CHÝBAL
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
  
  // Stavy pre žiadosť kreatívca o presun
  const [requestOpen, setRequestOpen] = useState(false)
  const [activeAssign, setActiveAssign] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [targetUserId, setTargetUserId] = useState('')

  // Akcia pre ADMIN/TRAFFIC: Priame prehodenie úlohy
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
      }
    } catch (e) { 
        console.error(e) 
    } finally { 
        setLoadingId(null) 
    }
  }

  // Akcia pre CREATIVE: Odoslanie žiadosti o presun
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
        alert("Žiadosť bola odoslaná Traffic manažérovi.")
        setRequestOpen(false)
        setReason('')
        setTargetUserId('')
        router.refresh()
      }
    } catch (e) { 
        console.error(e) 
    } finally { 
        setLoadingId(null) 
    }
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {initialUsers.map(user => (
        <Card key={user.id} className="shadow-sm border-slate-200 overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b py-3 px-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border shadow-sm">
                <AvatarFallback className="text-[10px] font-bold bg-white text-slate-600">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-xs font-bold text-slate-800">
                    {user.name || user.email.split('@')[0]}
                </CardTitle>
              </div>
              <Badge variant="secondary" className="ml-auto text-[9px] font-bold">
                {user.assignments.length} AKTÍVNE ÚLOHY
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {user.assignments.length === 0 ? (
                  <div className="p-6 text-center text-[10px] text-slate-400 italic">
                      Žiadne priradené úlohy.
                  </div>
              ) : (
                user.assignments.map((assign) => (
                    <div key={assign.id} className="p-3 flex justify-between items-center group transition-colors hover:bg-slate-50/50">
                      <div className="min-w-0 pr-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                            {assign.job?.campaign?.client?.name || 'Interný Job'}
                        </p>
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                            {assign.job?.title}
                        </h4>
                      </div>
    
                      {role !== 'CREATIVE' ? (
                        /* ADMIN/TRAFFIC - dropdown pre okamžitý presun */
                        <Select 
                            onValueChange={(val) => handleDirectReassign(assign.id, val)} 
                            disabled={loadingId === assign.id}
                        >
                          <SelectTrigger className="h-7 text-[8px] w-28 font-bold uppercase tracking-tighter bg-white shadow-sm">
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
                        /* CREATIVE - tlačidlo žiadosti o presun */
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-tighter" 
                            onClick={() => { setActiveAssign(assign); setRequestOpen(true) }}
                        >
                            <MessageSquareShare className="h-3 w-3 mr-1" /> Žiadať pre