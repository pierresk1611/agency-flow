'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowRightLeft, Calendar, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface UserWithJobs {
  id: string
  name: string | null
  email: string
  position: string | null
  assignments: {
    id: string
    roleOnJob: string
    job: {
      id: string
      title: string
      deadline: string
      campaign: { client: { name: string } }
    }
  }[]
}

export function TrafficWorkloadManager() {
  const router = useRouter()
  const [users, setUsers] = useState<UserWithJobs[]>([])
  const [loading, setLoading] = useState(true)
  const [reassigning, setReassigning] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/agency/users?includeJobs=true') // Upravíme GET v ďalšom kroku
      const data = await res.json()
      if (Array.isArray(data)) setUsers(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleReassign = async (assignmentId: string, newUserId: string) => {
    setReassigning(assignmentId)
    try {
      const res = await fetch('/api/jobs/reassign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, newUserId })
      })
      if (res.ok) {
        await fetchData()
        router.refresh()
      }
    } catch (e) { console.error(e) }
    finally { setReassigning(null) }
  }

  if (loading) return <div className="py-10 text-center animate-pulse text-slate-400">Načítavam vyťaženosť tímu...</div>

  return (
    <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
      {users.map(user => (
        <Card key={user.id} className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b py-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarFallback className="bg-slate-200 text-slate-600 font-bold uppercase">
                  {(user.name || user.email).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-sm font-bold text-slate-800">{user.name || user.email.split('@')[0]}</CardTitle>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{user.position || 'Člen tímu'}</span>
              </div>
              <Badge variant="secondary" className="ml-auto bg-white border-slate-200">
                {user.assignments.length} aktívne joby
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {user.assignments.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-400 italic">Tento kolega nemá priradenú žiadnu prácu.</p>
              ) : (
                user.assignments.map(assign => (
                  <div key={assign.id} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase">{assign.job.campaign.client.name}</p>
                        <h4 className="text-sm font-bold text-slate-800 truncate">{assign.job.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] flex items-center gap-1 text-slate-500 font-medium">
                            <Calendar className="h-3 w-3" /> {format(new Date(assign.job.deadline), 'dd.MM.yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* PREHADZOVACIE MENU */}
                      <div className="w-full sm:w-auto">
                        <Select 
                          onValueChange={(newId) => handleReassign(assign.id, newId)}
                          disabled={reassigning === assign.id}
                        >
                          <SelectTrigger className="h-8 text-[10px] font-bold border-slate-200 bg-white">
                            <ArrowRightLeft className="h-3 w-3 mr-2 text-slate-400" />
                            <SelectValue placeholder="PREHODIŤ NA..." />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter(u => u.id !== user.id).map(other => (
                              <SelectItem key={other.id} value={other.id} className="text-xs">
                                {other.name || other.email.split('@')[0]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}