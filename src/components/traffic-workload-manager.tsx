'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowRightLeft, Calendar } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)
  const [reassigning, setReassigning] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/agency/users?includeJobs=true')
      if (!res.ok) throw new Error("Nepodarilo sa načítať dáta o vyťaženosti.")
      const data = await res.json()
      if (Array.isArray(data)) {
          setUsers(data)
      } else {
          setUsers([])
      }
    } catch (e: any) { 
        console.error(e)
        setError(e.message)
    } finally { 
        setLoading(false) 
    }
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
      } else {
          alert("Chyba pri prehadzovaní úlohy.")
      }
    } catch (e) { 
        console.error(e) 
    } finally { 
        setReassigning(null) 
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Analyzujem kapacity tímu...</p>
    </div>
  )

  if (error) return (
    <div className="p-8 text-center border-2 border-dashed rounded-xl text-red-500 bg-red-50">
        Chyba: {error}
    </div>
  )

  return (
    <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
      {users.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed rounded-xl">
              Nenašli sa žiadni kolegovia.
          </div>
      ) : (
        users.map(user => (
            <Card key={user.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-slate-50/50 border-b py-4 px-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-slate-900 text-white font-black text-sm uppercase">
                      {(user.name || user.email).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <CardTitle className="text-base font-bold text-slate-900 truncate">
                        {user.name || user.email.split('@')[0]}
                    </CardTitle>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate">
                        {user.position || 'Bez pozície'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="ml-auto bg-white border-slate-200 text-slate-700 font-bold">
                    {user.assignments?.length || 0} joby
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {!user.assignments || user.assignments.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-400 italic">
                        Kolega je aktuálne voľný.
                    </div>
                  ) : (
                    user.assignments.map(assign => (
                      <div key={assign.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                {assign.job.campaign.client.name}
                            </p>
                            <h4 className="text-sm font-bold text-slate-800 truncate leading-tight">
                                {assign.job.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] flex items-center gap-1 text-slate-500 font-bold uppercase">
                                <Calendar className="h-3 w-3 text-slate-300" /> 
                                {format(new Date(assign.job.deadline), 'dd.MM.yyyy')}
                              </span>
                            </div>
                          </div>
    
                          <div className="w-full sm:w-auto">
                            <Select 
                              onValueChange={(newId) => handleReassign(assign.id, newId)}
                              disabled={reassigning === assign.id}
                            >
                              <SelectTrigger className="h-9 text-[10px] font-black border-slate-200 bg-white hover:border-blue-400 transition-all">
                                <ArrowRightLeft className="h-3 w-3 mr-2 text-slate-400" />
                                <SelectValue placeholder="PREHODIŤ" />
                              </SelectTrigger>
                              <SelectContent>
                                {users.filter(u => u.id !== user.id).map(other => (
                                  <SelectItem key={other.id} value={other.id} className="text-xs font-medium">
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
          ))
      )}
    </div>
  )
}