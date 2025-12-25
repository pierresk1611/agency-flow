'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { UserPlus, Loader2, Edit2, Trash2, Check, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserMember {
  id: string; email: string; name: string | null; position: string | null; role: string; hourlyRate: number; costRate: number; active: boolean;
}

export function TeamList() {
  const router = useRouter()
  const [users, setUsers] = useState<UserMember[]>([])
  const [positions, setPositions] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserMember | null>(null)
  
  // FORM STAVY
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('CREATIVE')
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [customPos, setCustomPos] = useState('')
  const [hourlyRate, setHourlyRate] = useState('50')
  const [costRate, setCostRate] = useState('30')
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [uRes, pRes] = await Promise.all([fetch('/api/agency/users'), fetch('/api/agency/positions')])
      const uData = await uRes.json(); const pData = await pRes.json()
      if (Array.isArray(uData)) setUsers(uData)
      if (Array.isArray(pData)) setPositions(pData)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleEditClick = (user: UserMember) => {
    setEditingUser(user)
    setEmail(user.email); setName(user.name || ''); 
    // Rozbijeme string "Art Director, Copywriter" na pole
    setSelectedPositions(user.position ? user.position.split(',').map(p => p.trim()) : [])
    setRole(user.role); setHourlyRate(user.hourlyRate.toString()); 
    setCostRate(user.costRate.toString()); setActive(user.active);
    setIsOtherSelected(false); setCustomPos('');
    setOpen(true)
  }

  const togglePos = (name: string) => {
      setSelectedPositions(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name])
  }

  const handleSave = async () => {
    setSubmitting(true)
    const url = editingUser ? `/api/agency/users/${editingUser.id}` : '/api/agency/users'
    const method = editingUser ? 'PATCH' : 'POST'
    
    let finalPositions = [...selectedPositions]
    if (isOtherSelected && customPos.trim()) finalPositions.push(customPos.trim())

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, name, role, 
            position: finalPositions.join(', '), 
            hourlyRate, costRate, active,
            password: 'password123' // default pre nových
        })
      })
      if (res.ok) {
        setOpen(false) // <--- TOTO ZAVRIE OKNO
        await fetchData()
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Tímový Adresár</h3>
        <Button onClick={() => { setEditingUser(null); setOpen(true); setSelectedPositions([]); setName(''); setEmail(''); }} className="bg-slate-900 text-white">
            <UserPlus className="mr-2 h-4 w-4" /> Pridať člena
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Upraviť profil' : 'Nový kolega'}</DialogTitle>
            <DialogDescription>Nastavte meno, rolu a pracovné pozície.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Celé meno</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Napr. Peter Novák" /></div>
            {!editingUser && <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@agentura.sk" /></div>}
            
            <div className="grid gap-2">
                <Label>Systémová Rola</Label>
                <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="ADMIN">ADMIN (Plný prístup)</SelectItem>
                    <SelectItem value="TRAFFIC">TRAFFIC (Riadenie prác)</SelectItem>
                    <SelectItem value="ACCOUNT">ACCOUNT (Schvaľovanie)</SelectItem>
                    <SelectItem value="CREATIVE">CREATIVE (Merač času)</SelectItem>
                </SelectContent></Select>
            </div>

            <div className="grid gap-2">
                <Label>Pracovné pozície (Checkboxy)</Label>
                <div className="grid grid-cols-1 gap-2 p-3 border rounded-lg bg-slate-50/50 max-h-[200px] overflow-y-auto">
                    {positions.map(p => (
                        <div key={p.id} className="flex items-center space-x-2 py-1">
                            <Checkbox id={p.id} checked={selectedPositions.includes(p.name)} onCheckedChange={() => togglePos(p.name)} />
                            <label htmlFor={p.id} className="text-xs font-medium cursor-pointer">{p.name}</label>
                        </div>
                    ))}
                    <div className="pt-2 mt-1 border-t flex items-center space-x-2">
                        <Checkbox id="other" checked={isOtherSelected} onCheckedChange={(c) => setIsOtherSelected(!!c)} />
                        <label htmlFor="other" className="text-xs font-bold text-blue-700 cursor-pointer">+ Pridať inú pozíciu</label>
                    </div>
                </div>
                {isOtherSelected && <Input value={customPos} onChange={e => setCustomPos(e.target.value)} placeholder="Vypíšte názov pozície..." className="mt-2 bg-blue-50 border-blue-200" />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Billable (€/h)</Label><Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Cost (€/h)</Label><Input type="number" value={costRate} onChange={e => setCostRate(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={submitting} className="w-full bg-slate-900 text-white">
              {submitting ? <Loader2 className="animate-spin mr-2" /> : "Uložiť a zavrieť"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow><TableHead>Meno / Pozícia</TableHead><TableHead>Rola</TableHead><TableHead>Sadzby</TableHead><TableHead className="text-right">Akcia</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-10">Načítavam...</TableCell></TableRow> : 
              users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] uppercase">{(u.name || u.email).charAt(0)}</div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-800">{u.name || u.email.split('@')[0]}</span>
                            <span className="text-[9px] text-blue-600 font-black uppercase tracking-tighter max-w-[200px] truncate">{u.position || "Bez pozície"}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-bold uppercase">{u.role}</Badge></TableCell>
                  <TableCell className="text-[10px] font-mono font-bold text-slate-500">{u.hourlyRate} / {u.costRate}€</TableCell>
                  <TableCell className="text-right pr-4"><Button variant="ghost" size="sm" onClick={() => handleEditClick(u)} className="h-8 w-8 p-0"><Edit2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    </div>
  )
}