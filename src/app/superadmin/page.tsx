'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from '@/components/ui/badge'
import { Building, Plus, Users, Loader2, Inbox } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Agency {
  id: string
  name: string
  slug: string
  createdAt: string
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED'
  _count: { users: number, clients: number }
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fetchAgencies = async () => {
    setLoading(true)
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
    if (!name || !email || !password) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/superadmin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, adminEmail: email, adminPassword: password })
      })
      if (res.ok) {
        setOpen(false); setName(''); setEmail(''); setPassword('');
        await fetchAgencies()
      } else {
        const err = await res.json()
        alert(err.error || "Chyba")
      }
    } catch (e) { alert("Chyba spojenia") }
    finally { setSubmitting(false) }
  }

  const pendingCount = agencies.filter(a => a.status === 'PENDING').length

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-8">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Správa platformy</h2>
          <p className="text-slate-500 text-sm">Prehľad všetkých agentúr v systéme</p>
        </div>

        <div className="flex gap-3">
          <Link href="/superadmin/requests">
            <Button variant="outline" className="h-11 font-bold border-slate-300 relative">
              <Inbox className="h-4 w-4 mr-2" />
              Žiadosti
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                  {pendingCount}
                </span>
              )}
            </Button>
          </Link>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-6 shadow-lg transition-all active:scale-95">
                <Plus className="h-5 w-5 mr-2" /> Nová Agentúra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vytvoriť novú agentúru</DialogTitle>
                <DialogDescription>Systém automaticky vygeneruje unikátnu URL adresu a vytvorí účet pre Admina.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Názov firmy</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Napr. Kreatívne Štúdio s.r.o." /></div>
                <div className="grid gap-2"><Label>Email hlavného admina</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@firma.sk" /></div>
                <div className="grid gap-2"><Label>Heslo pre admina</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={submitting} className="w-full bg-slate-900 text-white h-11">
                  {submitting ? <Loader2 className="animate-spin mr-2" /> : "Vytvoriť a aktivovať inštanciu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-xl border-none ring-1 ring-slate-200">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-slate-50">
              <TableHead className="pl-6 font-bold uppercase text-[10px] tracking-widest text-slate-500">Agentúra</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center text-slate-500">Status</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center text-slate-500">Tím</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center text-slate-500">Klienti</TableHead>
              <TableHead className="text-right pr-6 font-bold uppercase text-[10px] tracking-widest text-slate-500">Akcia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 animate-pulse font-medium">Načítavam zoznam tenantov...</TableCell></TableRow> :
              agencies.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400">Zatiaľ žiadne agentúry.</TableCell></TableRow> :
                agencies.map(a => (
                  <TableRow key={a.id} className="hover:bg-slate-50 transition-colors group">
                    <TableCell className="pl-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-base">{a.name}</span>
                        <span className="text-xs text-blue-600 font-mono font-medium tracking-tight">https://agency-flow.com/{a.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {a.status === 'PENDING' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none">Čaká na schválenie</Badge>
                      ) : a.status === 'REJECTED' ? (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none">Zamietnuté</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Aktívna</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none"><Users className="h-3 w-3 mr-1.5" /> {a._count.users}</Badge></TableCell>
                    <TableCell className="text-center font-bold text-slate-700">{a._count.clients}</TableCell>
                    <TableCell className="text-right pr-6">
                      {a.status === 'PENDING' ? (
                        <Link href={`/superadmin/requests`}>
                          <Button size="sm" className="h-9 bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-bold">Schváliť</Button>
                        </Link>
                      ) : (
                        <Link href={`/superadmin/${a.id}`}>
                          <Button variant="outline" size="sm" className="h-9 border-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">Spravovať</Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}