'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { UserPlus, Loader2, Edit2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserMember {
  id: string; email: string; name: string | null; position: string | null; role: string; hourlyRate: number; costRate: number; active: boolean;
}

interface Position {
  id: string
  name: string
  category: string | null
}

export function TeamList() {
  const router = useRouter()
  const [users, setUsers] = useState<UserMember[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserMember | null>(null)

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
  const [activeCategory, setActiveCategory] = useState<string>('')

  const fetchData = async () => {
    try {
      const [uRes, pRes] = await Promise.all([fetch('/api/agency/users'), fetch('/api/agency/positions')])
      const uData = await uRes.json()
      const pData = await pRes.json()
      if (Array.isArray(uData)) setUsers(uData)
      if (Array.isArray(pData)) setPositions(pData)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleEditClick = (user: UserMember) => {
    setEditingUser(user)
    setEmail(user.email); setName(user.name || '');
    const userPositions = user.position ? user.position.split(',').map(p => p.trim()) : []
    setSelectedPositions(userPositions)

    // Auto-select category based on first position
    const firstPosName = userPositions[0]
    const foundPos = positions.find(p => p.name === firstPosName)
    setActiveCategory(foundPos?.category || '')
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
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, position: finalPositions.join(', '), hourlyRate, costRate, active, password: 'password123' })
      })
      if (res.ok) {
        setOpen(false)
        await fetchData()
        router.refresh()
      }
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  // Zoskupenie pozícií pre zobrazenie
  const groupedPositions: Record<string, Position[]> = {}
  positions.forEach(p => {
    const cat = p.category || "Ostatné"
    if (!groupedPositions[cat]) groupedPositions[cat] = []
    groupedPositions[cat].push(p)
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Tímový adresár</h3>
        <Button onClick={() => { setEditingUser(null); setOpen(true); setSelectedPositions([]); setName(''); setEmail(''); setActiveCategory(''); }} className="bg-slate-900 text-white">
          <UserPlus className="mr-2 h-4 w-4" /> Pridať člena
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{editingUser ? 'Upraviť údaje' : 'Nový kolega'}</DialogTitle>
            <DialogDescription>Nastavte meno a pracovné zaradenie.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2"><Label>Celé meno</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Peter Novák" /></div>
              {!editingUser && <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@agentura.sk" /></div>}

              <div className="grid gap-2">
                <Label>Rola v systéme</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ADMIN (Plný prístup)</SelectItem>
                    <SelectItem value="TRAFFIC">TRAFFIC (Riadenie)</SelectItem>
                    <SelectItem value="ACCOUNT">ACCOUNT (Schvaľovanie)</SelectItem>
                    <SelectItem value="CREATIVE">CREATIVE (Stopky)</SelectItem>
                  </SelectContent></Select>
              </div>

              <div className="space-y-3">
                <Label>Oddelenie & Pozície</Label>

                {/* Filter Oddelenia */}
                <Select
                  value={activeCategory}
                  onValueChange={setActiveCategory}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Vyberte oddelenie..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(groupedPositions).sort().map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="border rounded-lg bg-slate-50/50 p-4 space-y-6 min-h-[150px]">
                  {Object.entries(groupedPositions)
                    .filter(([category]) => activeCategory ? category === activeCategory : true)
                    .sort()
                    .map(([category, items]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-1">{category}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {items.map(p => (
                            <div key={p.id} className="flex items-center space-x-3">
                              <Checkbox id={p.id} checked={selectedPositions.includes(p.name)} onCheckedChange={() => togglePos(p.name)} />
                              <label htmlFor={p.id} className="text-xs font-medium cursor-pointer text-slate-700">{p.name}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  {(!activeCategory || Object.keys(groupedPositions).find(c => c === activeCategory)) && (
                    <div className="pt-2 border-t flex items-center space-x-3">
                      <Checkbox id="other" checked={isOtherSelected} onCheckedChange={(c) => setIsOtherSelected(!!c)} />
                      <label htmlFor="other" className="text-xs font-bold text-blue-700 cursor-pointer">+ Pridať vlastnú pozíciu</label>
                    </div>
                  )}
                  {isOtherSelected && <Input value={customPos} onChange={e => setCustomPos(e.target.value)} placeholder="Názov pozície..." className="bg-white border-blue-200" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Billable (€/h)</Label><Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Cost (€/h)</Label><Input type="number" value={costRate} onChange={e => setCostRate(e.target.value)} /></div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 bg-slate-50 border-t">
            <Button onClick={handleSave} disabled={submitting} className="w-full bg-slate-900 text-white h-11">
              {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Uložiť a zavrieť"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow><TableHead className="pl-6">Meno / Pozícia</TableHead><TableHead>Rola</TableHead><TableHead>Sadzba</TableHead><TableHead className="text-right pr-6">Akcia</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse font-bold text-slate-300 uppercase tracking-widest">Sťahujem tím...</TableCell></TableRow> :
              users.map(u => (
                <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase border border-slate-200">{(u.name || u.email).charAt(0)}</div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{u.name || u.email.split('@')[0]}</span>
                        <span className="text-[10px] text-blue-600 font-black uppercase tracking-tight truncate max-w-[200px]">{u.position || "Bez pozície"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-bold uppercase">{u.role}</Badge></TableCell>
                  <TableCell className="text-[10px] font-mono font-bold text-slate-500">{u.hourlyRate}€</TableCell>
                  <TableCell className="text-right pr-6"><Button variant="ghost" size="sm" onClick={() => handleEditClick(u)} className="h-8 w-8 p-0 border hover:bg-white shadow-sm"><Edit2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    </div>
  )
}