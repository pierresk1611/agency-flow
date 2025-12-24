'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from '@/components/ui/badge'
import { Building, Plus, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Agency {
  id: string
  name: string
  slug: string
  createdAt: string
  _count: { users: number, clients: number }
}

export default function SuperAdminPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fetchAgencies = async () => {
    try {
      const res = await fetch('/api/superadmin/agencies')
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login'
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) setAgencies(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAgencies() }, [])

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/superadmin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, adminEmail: email, adminPassword: password })
      })
      if (res.ok) {
        setOpen(false)
        setName(''); setEmail(''); setPassword('')
        await fetchAgencies()
      } else {
        const err = await res.json()
        alert(err.error || "Chyba")
      }
    } catch (e) {
      alert("Chyba spojenia")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Správa platformy</h2>
          <p className="text-slate-500 text-sm italic">AgencyFlow Superadmin</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg h-11 px-6">
              <Plus className="h-5 w-5 mr-2" /> Nová Agentúra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vytvoriť nového tenanta</DialogTitle>
              <DialogDescription>Systém vygeneruje unikátnu URL a Admin účet.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Názov firmy</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Email Admina</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Heslo Admina</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={submitting} className="w-full bg-red-600 text-white">
                {submitting ? <Loader2 className="animate-spin" /> : "Vytvoriť a spustiť"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-xl py-4"><CardTitle className="text-sm uppercase tracking-widest">Aktívne inštancie</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6">Agentúra / URL</TableHead>
                <TableHead>Tím</TableHead>
                <TableHead>Klienti</TableHead>
                <TableHead>Dátum</TableHead>
                <TableHead className="text-right pr-6">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center py-10">Načítavam...</TableCell></TableRow> : 
               agencies.map(a => (
                <TableRow key={a.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{a.name}</span>
                      <span className="text-xs text-blue-600 font-mono italic">/{a.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> {a._count.users}</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-1 font-medium text-slate-600"><Building className="h-4 w-4" /> {a._count.clients}</div></TableCell>
                  <TableCell className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Link href={`/superadmin/${a.id}`}>
                      <Button variant="outline" size="sm" className="h-8 border-slate-300">Spravovať</Button>
                    </Link>
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