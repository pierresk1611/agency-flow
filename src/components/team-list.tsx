'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { UserPlus, Loader2, Edit2, Trash2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  id: string; email: string; name: string | null; position: string | null; role: string; hourlyRate: number; costRate: number; active: boolean;
}

export function TeamList() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [positions, setPositions] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog stavy
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  // Form stavy
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
    setLoading(true)
    try {
      const [uRes, pRes] = await Promise.all([fetch('/api/agency/users'), fetch('/api/agency/positions')])
      const uData = await uRes.json(); const pData = await pRes.json()
      setUsers(Array.isArray(uData) ? uData : [])
      setPositions(Array.isArray(pData) ? pData : [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // Otvorenie okna pre NOVÉHO užívateľa
  const handleAddClick = () => {
    setEditingUser(null)
    setEmail(''); setName(''); setPosition(''); setRole('CREATIVE'); setHourlyRate('50'); setCostRate('30'); setActive(true);
    setOpen(true)
  }

  // Otvorenie okna pre EDITÁCIU
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
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role, position, hourlyRate, costRate, active })
      })
      if (res.ok) {
        setOpen(false)
        await fetchData()
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || "Chyba pri ukladaní")
      }
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Naozaj chcete deaktivovať tohto užívateľa? Stratí prístup do systému.")) return
    try {
      const res = await fetch(`/api/agency/users/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchData()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Kolegovia v tíme</h3>
        <Button onClick={handleAddClick} className="bg-slate-900 text-white"><UserPlus className="mr-2 h-4 w-4" /> Pridať člena</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Upraviť kolegu' : 'Nový kolega'}</DialogTitle>
            <DialogDescription>Nastavte osobné údaje a hodinové sadzby.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Celé meno</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            {!editingUser && (
                <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                  <Label>Rola</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="TRAFFIC">TRAFFIC</SelectItem>
                        <SelectItem value="ACCOUNT">ACCOUNT</SelectItem>
                        <SelectItem value="CREATIVE">CREATIVE</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div className="grid gap-2">
                  <Label>Pozícia</Label>
                  <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="Art Director..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Billable (€/h)</Label><Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Cost (€/h)</Label><Input type="number" value={costRate} onChange={e => setCostRate(e.target.value)} /></div>
            </div>
            {editingUser && (
                <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="active" checked={active} onChange={e => setActive(e.target.checked)} className="h-4 w-4" />
                    <Label htmlFor="active">Užívateľ je aktívny</Label>
                </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={submitting} className="w-full bg-slate-900 text-white">
              {submitting ? <Loader2 className="animate-spin" /> : editingUser ? "Uložiť zmeny" : "Vytvoriť"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow><TableHead>Meno / Pozícia</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Sadzby</TableHead><TableHead className="text-right">Akcie</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center h-24">Načítavam...</TableCell></TableRow> : 
              users.map(user => (
                <TableRow key={user.id} className={!user.active ? "opacity-50 bg-slate-50" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{user.name || "Meno neuvedené"}</span>
                        <span className="text-[10px] text-blue-600 font-bold uppercase">{user.position || "Bez pozície"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "outline" : "secondary"} className={user.active ? "border-green-200 text-green-700" : ""}>
                      {user.active ? "Aktívny" : "Deaktivovaný"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{user.hourlyRate} / {user.costRate}€</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(user.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    </div>
  )
}