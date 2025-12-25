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
import { Building, Plus, Loader2, ArrowRight, Trash2, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string; name: string; priority: number; scope: string | null; _count: { campaigns: number }
}
interface ScopeOption { id: string; name: string }

export function ClientsList() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [scopesList, setScopesList] = useState<ScopeOption[]>([]) 
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPriority, setNewPriority] = useState('3')
  const [selectedScope, setSelectedScope] = useState<string[]>([]) 
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [customScope, setCustomScope] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const refreshData = async () => {
    setLoading(true)
    try {
        const query = showArchived ? '?archived=true' : ''
        const [cRes, sRes] = await Promise.all([fetch(`/api/clients${query}`), fetch('/api/agency/scopes')])
        const cData = await cRes.json(); const sData = await sRes.json()
        if (Array.isArray(cData)) setClients(cData)
        if (Array.isArray(sData)) setScopesList(sData)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { refreshData() }, [showArchived])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSubmitting(true)
    let scope = [...selectedScope]
    if (isOtherSelected && customScope.trim()) scope.push(customScope.trim().toUpperCase())
    try {
        const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, priority: newPriority, scope })
        })
        if (res.ok) { setOpen(false); setNewName(''); setSelectedScope([]); refreshData(); router.refresh() }
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleArchive = async (id: string, restore = false) => {
      const url = restore ? `/api/clients/${id}/restore` : `/api/clients/${id}/archive`
      if(!confirm(restore ? "Obnoviť?" : "Archivovať?")) return
      try {
          const res = await fetch(url, { method: 'PATCH' })
          if(res.ok) refreshData()
      } catch(e) { console.error(e) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold">Zoznam Klientov</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setShowArchived(false)} className={`px-3 py-1 text-[10px] font-bold rounded-md ${!showArchived ? 'bg-white shadow' : 'text-slate-500'}`}>AKTÍVNI</button>
                <button onClick={() => setShowArchived(true)} className={`px-3 py-1 text-[10px] font-bold rounded-md ${showArchived ? 'bg-white shadow' : 'text-slate-500'}`}>ARCHÍV</button>
            </div>
        </div>
        {!showArchived && (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button className="bg-slate-900 text-white"><Plus className="h-4 w-4 mr-2" /> Nový Klient</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Pridať Klienta</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label>Názov</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Priorita</Label>
                            <Select value={newPriority} onValueChange={setNewPriority}><SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="1">Nízka</SelectItem><SelectItem value="3">Stredná</SelectItem><SelectItem value="5">VIP</SelectItem></SelectContent></Select>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreate} disabled={submitting} className="bg-slate-900 text-white">{submitting ? <Loader2 className="animate-spin" /> : "Uložiť"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-slate-50"><TableRow><TableHead>Klient</TableHead><TableHead>Priorita</TableHead><TableHead className="text-right">Akcia</TableHead></TableRow></TableHeader>
            <TableBody>
                {loading ? <TableRow><TableCell colSpan={3} className="text-center py-10 text-slate-400">Načítavam...</TableCell></TableRow> : 
                 clients.map(c => (
                    <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-slate-700 flex items-center gap-2"><Building className="h-4 w-4 text-slate-300" />{c.name}</TableCell>
                        <TableCell><Badge variant={c.priority >= 4 ? "destructive" : "outline"} className="text-[10px]">P{c.priority}</Badge></TableCell>
                        <TableCell className="text-right flex justify-end gap-2 py-4 pr-4">
                            {!showArchived ? (
                                <>
                                    <Link href={`/dashboard/agency/clients/${c.id}`}><Button variant="ghost" size="sm" className="text-blue-600">Detail</Button></Link>
                                    <Button variant="ghost" size="sm" onClick={() => handleArchive(c.id)}><Trash2 className="h-3.5 w-3.5 text-slate-400" /></Button>
                                </>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={() => handleArchive(c.id, true)}><RotateCcw className="h-3.5 w-3.5 text-green-600" /></Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}