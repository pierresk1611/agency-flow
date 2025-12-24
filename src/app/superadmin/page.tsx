'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LogIn, KeyRound, ShieldAlert, Loader2 } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/superadmin/agencies/${params.id}/users`)
        .then(res => res.json())
        .then(data => { if(Array.isArray(data)) setUsers(data) })
        .finally(() => setLoading(false))
  }, [params.id])

  // --- GOD MODE LOGIKA ---
  const handleImpersonate = async () => {
    if(!confirm("Vstúpiť do tejto agentúry ako Superadmin?")) return

    try {
        const res = await fetch('/api/auth/impersonate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agencyId: params.id })
        })
        
        if (res.ok) {
            const data = await res.json()
            // 1. Uložíme nový "God Mode" token
            document.cookie = `token=${data.token}; path=/; max-age=7200; SameSite=Strict`
            
            // 2. PRESMEROVANIE NA KONKRÉTNY SLUG AGENTÚRY
            console.log(`Vstupujem do agentúry: /${data.slug}`)
            window.location.href = `/${data.slug}` 
        } else {
            alert("Nepodarilo sa prepnúť identitu.")
        }
    } catch (e) {
        alert("Chyba spojenia.")
    }
  }

  const makeAdmin = async (userId: string) => {
      if(!confirm("Zmeniť na ADMINA?")) return
      await fetch(`/api/superadmin/agencies/${params.id}/users`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId, role: 'ADMIN' })
      })
      window.location.reload()
  }

  const resetPassword = async (userId: string) => {
      const newPass = prompt("Nové heslo:")
      if (!newPass) return
      await fetch(`/api/superadmin/agencies/${params.id}/users`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId, newPassword: newPass })
      })
      alert("Hotovo.")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b pb-6">
            <div className="flex items-center gap-4">
                <Link href="/superadmin"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Správa Agentúry</h2>
                    <p className="text-slate-500 font-mono text-xs">ID: {params.id}</p>
                </div>
            </div>
            
            {/* TLAČIDLO GOD MODE */}
            <Button onClick={handleImpersonate} className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg h-11 px-6">
                <LogIn className="h-4 w-4" /> Vstúpiť do Agentúry (GOD MODE)
            </Button>
        </div>

        <Card className="shadow-md">
            <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-sm uppercase tracking-wider">Užívatelia tejto inštancie</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Email</TableHead>
                            <TableHead>Rola</TableHead>
                            <TableHead className="text-right pr-6">Akcie</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={3} className="text-center py-10">Načítavam...</TableCell></TableRow> : 
                         users.map(u => (
                            <TableRow key={u.id} className="hover:bg-slate-50/50">
                                <TableCell className="pl-6 font-medium">{u.email}</TableCell>
                                <TableCell><Badge variant="outline" className="text-[10px] uppercase font-bold">{u.role}</Badge></TableCell>
                                <TableCell className="text-right pr-6 py-3 flex justify-end gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => resetPassword(u.id)} className="h-8">
                                        <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Heslo
                                    </Button>
                                    {u.role !== 'ADMIN' && (
                                        <Button size="sm" variant="outline" onClick={() => makeAdmin(u.id)} className="h-8">
                                            <ShieldAlert className="h-3.5 w-3.5 mr-1.5 text-orange-600" /> Admin
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