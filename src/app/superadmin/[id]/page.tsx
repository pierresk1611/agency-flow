'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LogIn, KeyRound, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  role: string
  active: boolean
}

export default function AgencyAdminDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [agencyName, setAgencyName] = useState('')

  useEffect(() => {
    // 1. Načítame zoznam ľudí
    fetch(`/api/superadmin/agencies/${params.id}/users`)
        .then(res => res.json())
        .then(data => { if(Array.isArray(data)) setUsers(data) })
    
    // (Tu by sme mohli načítať aj meno agentúry cez iné API, ale pre rýchlosť stačí zoznam)
  }, [params.id])

  // FUNKCIA: Vstúpiť do agentúry (Impersonate)
  const handleImpersonate = async () => {
    if(!confirm("POZOR: Prihlásite sa do tejto agentúry ako Superadmin. Budete vidieť ich dáta.")) return

    try {
        const res = await fetch('/api/auth/impersonate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agencyId: params.id })
        })
        
        if (res.ok) {
            const data = await res.json()
            // Prepíšeme cookie a presmerujeme
            document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`
            window.location.href = '/dashboard' // Presmeruje ťa do ICH dashboardu
        }
    } catch (e) {
        console.error(e)
        alert("Chyba pri prepínaní")
    }
  }

  // FUNKCIA: Zmeniť na Admina
  const makeAdmin = async (userId: string) => {
      if(!confirm("Zmeniť tohto užívateľa na ADMINA agentúry?")) return
      await fetch(`/api/superadmin/agencies/${params.id}/users`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId, role: 'ADMIN' })
      })
      window.location.reload()
  }

  // FUNKCIA: Reset hesla
  const resetPassword = async (userId: string) => {
      const newPass = prompt("Zadajte nové heslo pre užívateľa:")
      if (!newPass) return
      
      await fetch(`/api/superadmin/agencies/${params.id}/users`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId, newPassword: newPass })
      })
      alert("Heslo zmenené.")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b pb-6">
            <div className="flex items-center gap-4">
                <Link href="/superadmin"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Správa Agentúry</h2>
                    <p className="text-slate-500">ID: {params.id}</p>
                </div>
            </div>
            
            <Button onClick={handleImpersonate} className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg">
                <LogIn className="h-4 w-4" /> Vstúpiť do Agentúry (God Mode)
            </Button>
        </div>

        <Card>
            <CardHeader><CardTitle>Užívatelia v agentúre</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Rola</TableHead><TableHead>Akcie</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {users.map(u => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.email}</TableCell>
                                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                                <TableCell className="flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => resetPassword(u.id)} title="Reset Hesla">
                                        <KeyRound className="h-3 w-3 mr-1" /> Heslo
                                    </Button>
                                    {u.role !== 'ADMIN' && (
                                        <Button size="sm" variant="outline" onClick={() => makeAdmin(u.id)} title="Spraviť Adminom">
                                            <ShieldAlert className="h-3 w-3 mr-1" /> Make Admin
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}