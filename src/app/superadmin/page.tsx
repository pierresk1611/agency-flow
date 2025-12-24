'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from '@/components/ui/badge'
import { Building, Plus, Users, Loader2 } from 'lucide-react'
import Link from 'next/link' // <--- TENTO IMPORT JE KĽÚČOVÝ

interface AgencyStats {
  id: string
  name: string
  createdAt: string
  _count: { users: number, clients: number }
}

export default function SuperAdminPage() {
  const [agencies, setAgencies] = useState<AgencyStats[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 1. BEZPEČNÉ NAČÍTANIE DÁT
  useEffect(() => {
    fetch('/api/superadmin/agencies')
        .then(async (res) => {
            // Ak nemáš práva (401/403), presmeruje na login
            if (res.status === 401 || res.status === 403) {
                window.location.href = '/login'
                return null
            }
            if (!res.ok) throw new Error("Chyba načítania")
            return res.json()
        })
        .then(data => {
            // Iba ak prišlo pole, nastavíme ho
            if (Array.isArray(data)) {
                setAgencies(data)
            } else if (data) {
                console.error("API vrátilo neplatné dáta:", data)
            }
        })
        .catch(err => console.error("Fetch error:", err))
  }, [])

  const handleCreate = async () => {
    if (!name || !email || !password) {
        alert("Vyplňte všetky polia")
        return
    }

    setLoading(true)
    try {
        const res = await fetch('/api/superadmin/agencies', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, adminEmail: email, adminPassword: password })
        })
        
        if (res.ok) {
            setOpen(false)
            setName(''); setEmail(''); setPassword('')
            window.location.reload()
        } else {
            const err = await res.json()
            alert("Chyba: " + (err.error || "Neznáma chyba"))
        }
    } catch (e) { 
        console.error(e)
        alert("Chyba spojenia")
    } 
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b pb-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Prehľad Agentúr</h2>
                <p className="text-slate-500">Superadmin Dashboard</p>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg">
                        <Plus className="h-4 w-4" /> Nová Agentúra
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Onboarding Novej Agentúry</DialogTitle>
                        <DialogDescription>Vytvorí sa agentúra a jej prvý ADMIN užívateľ.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Názov Agentúry</Label>
                            <Input placeholder="Napr. Best Marketing s.r.o." value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email Admina</Label>
                            <Input placeholder="admin@bestmarketing.sk" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Heslo Admina</Label>
                            <Input type="password" placeholder="******" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreate} disabled={loading} className="bg-red-600 text-white w-full">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Vytvoriť a aktivovať"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500 uppercase">Celkom Agentúr</CardTitle></CardHeader>
                <CardContent><div className="text-4xl font-bold text-slate-900">{agencies.length}</div></CardContent>
            </Card>
        </div>

        <Card className="shadow-md">
            <CardHeader className="bg-slate-50 border-b">
                <CardTitle>Zoznam Tenantov</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Názov</TableHead>
                            <TableHead>Užívatelia</TableHead>
                            <TableHead>Klienti</TableHead>
                            <TableHead>Dátum vzniku</TableHead>
                            <TableHead className="text-right pr-6">Akcie</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agencies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Načítavam dáta...</TableCell>
                            </TableRow>
                        ) : (
                            agencies.map(a => (
                                <TableRow key={a.id} className="hover:bg-slate-50">
                                    <TableCell className="font-bold flex items-center gap-3 pl-6 py-4">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Building className="h-5 w-5 text-slate-500" />
                                        </div>
                                        {a.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="gap-1">
                                            <Users className="h-3 w-3" /> {a._count.users}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{a._count.clients}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(a.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        {/* TLAČIDLO NA DETAIL / SPRAVOVANIE */}
                                        <Link href={`/superadmin/${a.id}`}>
                                            <Button variant="outline" size="sm" className="hover:bg-slate-100 text-slate-700">
                                                Spravovať
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}