'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label' // <--- OVERENÝ IMPORT
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { UserPlus, Loader2, Edit2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  id: string; email: string; name: string | null; position: string | null; role: string; hourlyRate: number; costRate: number; active: boolean;
}

export function TeamList() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [positions, setPositions] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('password123')
  const [role, setRole] = useState('CREATIVE')
  const [position, setPosition] = useState('')
  const [hourlyRate, setHourlyRate] = useState('50')
  const [costRate, setCostRate] = useState('30')
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [uRes, pRes] = await Promise.all([fetch('/api/agency/users'), fetch('/api/agency/positions')])
      const uData = await uRes.json(); const pData = await pRes.json()
      setUsers(Array.isArray(uData) ? uData : [])
      setPositions(Array.isArray(pData) ? pData : [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setEmail(user.email); setName(user.name || ''); setPosition(user.position || ''); 
    setRole(user.role); setHourlyRate(user.hourlyRate.toString()); 
    setCostRate(user.costRate.toString()); setActive(user.active);
    setOpen(true)
  }

  const handleSave = async () => {
    setSubmitting(true)
    const url = editingUser ? `/api/agency/users/${editingUser.id}` : '/api/agency/users'
    const method = editingUser ? 'PATCH' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role, position, hourlyRate, costRate, active })
      })
      if (res.ok) { setOpen(false); fetchData(); router.refresh() }
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Členovia tímu</h3>
        <Button onClick={() => { setEditingUser(null); setOpen(true) }} className="bg-slate-900 text-white">
            <UserPlus className="mr-2 h-4 w-4" /> Pridať člena
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Upraviť údaje' : 'Nový kolega'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Celé meno</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            {!editingUser && <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Rola</Label>
                <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ADMIN">ADMIN</SelectItem><SelectItem value="TRAFFIC">TRAFFIC</SelectItem><SelectItem value="ACCOUNT">ACCOUNT</SelectItem><SelectItem value="CREATIVE">CREATIVE</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Pozícia</Label><Input value={position} onChange={e => setPosition(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Billable (€/h)</Label><Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Cost (€/h)</Label><Input type="number" value={costRate} onChange={e => setCostRate(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={submitting} className="bg-slate-900 text-white w-full">{submitting ? <Loader2 className="animate-spin" /> : "Uložiť"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow><TableHead>Meno</TableHead><TableHead>Email</TableHead><TableHead>Rola</TableHead><TableHead className="text-right">Akcia</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-10">Načítavam...</TableCell></TableRow> : 
              users.map(u => (
                <TableRow key={u.id}>
                  <TableCell><div className="flex flex-col"><span className="font-bold text-sm">{u.name || 'Nezadané'}</span><span className="text-[10px] text-blue-600 uppercase font-black">{u.position}</span></div></TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{u.role}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEditClick(u)}><Edit2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    </div>
  )
}