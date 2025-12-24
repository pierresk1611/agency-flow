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
import { Building, Plus, Loader2, ArrowRight, Trash2, Archive, RotateCcw } from 'lucide-react'
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
  
  // FILTER: Active vs Archived
  const [showArchived, setShowArchived] = useState(false)

  // Form
  const [newName, setNewName] = useState('')
  const [newPriority, setNewPriority] = useState('3')
  const [selectedScope, setSelectedScope] = useState<string[]>([]) 
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [customScope, setCustomScope] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Načítanie dát (závisí od filtra showArchived)
  const refreshData = async () => {
    setLoading(true)
    try {
        const query = showArchived ? '?archived=true' : ''
        const [cRes, sRes] = await Promise.all([
            fetch(`/api/clients${query}`), 
            fetch('/api/agency/scopes')
        ])
        
        if (cRes.ok) {
            const cData = await cRes.json()
            setClients(Array.isArray(cData) ? cData : [])
        }
        if (sRes.ok) {
            const sData = await sRes.json()
            setScopesList(Array.isArray(sData) ? sData : [])
        }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  // Keď prepneme filter, načítame dáta znova
  useEffect(() => { refreshData() }, [showArchived])

  const toggleScope = (scopeName: string) => {
      setSelectedScope(prev => prev.includes(scopeName) ? prev.filter(s => s !== scopeName) : [...prev, scopeName])
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSubmitting(true)
    let finalScopeList = [...selectedScope]
    if (isOtherSelected && customScope.trim()) finalScopeList.push(customScope.trim().toUpperCase())

    try {
        const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, priority: newPriority, scope: finalScopeList })
        })
        if (res.ok) {
            setOpen(false); setNewName(''); setNewPriority('3'); setSelectedScope([]); setIsOtherSelected(false); setCustomScope('')
            // Ak sme v archíve a pridáme nového, prepneme sa na aktívnych, aby sme ho videli
            if (showArchived) setShowArchived(false) 
            else await refreshData()
            
            router.refresh()
        }
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ARCHIVÁCIA
  const handleArchive = async (id: string) => {
      if(!confirm("Archivovať klienta?")) return
      try {
          const res = await fetch(`/api/clients/${id}/archive`, { method: 'PATCH' })
          if(res.ok) await refreshData()
      } catch(e) { console.error(e) }
  }

  // OBNOVENIE (Restore)
  const handleRestore = async (id: string) => {
      if(!confirm("Obnoviť klienta zo zálohy?")) return
      try {
          const res = await fetch(`/api/clients/${id}/restore`, { method: 'PATCH' })
          if(res.ok) await refreshData()
      } catch(e) { console.error(e) }
  }

  const getPriorityBadge = (p: number) => {
      if (p >= 5) return <Badge className="bg-red-600">VIP</Badge>
      if (p === 4) return <Badge className="bg-orange-500">Vysoká</Badge>
      if (p === 3) return <Badge variant="outline" className="border-blue-500 text-blue-600">Stredná</Badge>
      return <Badge variant="secondary">Nízka</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium text-slate-800">Manažment Klientov</h3>
            
            {/* PREPÍNAČ FILTRA */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setShowArchived(false)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${!showArchived ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Aktívni
                </button>
                <button 
                    onClick={() => setShowArchived(true)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${showArchived ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Archív
                </button>
            </div>
        </div>
        
        {/* Tlačidlo Nový Klient (len ak sme v Aktívnych) */}
        {!showArchived && (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button className="bg-slate-900 text-white"><Plus className="mr-2 h-4 w-4" /> Nový Klient</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Nový Klient</DialogTitle><DialogDescription>Zadajte údaje.</DialogDescription></DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2"><Label>Názov</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Priorita</Label>
                            <Select value={newPriority} onValueChange={setNewPriority}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="1">1 - Nízka</SelectItem><SelectItem value="3">3 - Stredná</SelectItem><SelectItem value="5">5 - VIP</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2"><Label>Rozsah</Label>
                            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50/50 max-h-[180px] overflow-y-auto">
                                {scopesList.map(s => (<div key={s.id} className="flex items-center space-x-2"><Checkbox checked={selectedScope.includes(s.name)} onCheckedChange={() => toggleScope(s.name)} /><label className="text-xs">{s.name}</label></div>))}
                                <div className="col-span-2 pt-2 border-t"><Checkbox checked={isOtherSelected} onCheckedChange={(c) => setIsOtherSelected(!!c)} /><label className="ml-2 text-xs font-bold text-blue-700">+ Iné</label></div>
                            </div>
                            {isOtherSelected && <Input value={customScope} onChange={e => setCustomScope(e.target.value)} className="mt-2 bg-blue-50" placeholder="Zadajte..." />}
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreate} disabled={submitting || !newName} className="bg-slate-900 text-white">{submitting ? <Loader2 className="animate-spin" /> : "Uložiť"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-slate-50"><TableRow><TableHead>Klient</TableHead><TableHead>Priorita</TableHead><TableHead>Rozsah</TableHead><TableHead className="text-right">Akcia</TableHead></TableRow></TableHeader>
            <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="text-center h-24">Načítavam...</TableCell></TableRow> : 
                 clients.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">{showArchived ? "Archív je prázdny." : "Žiadni klienti."}</TableCell></TableRow> : 
                 clients.map(client => (
                    <TableRow key={client.id} className={showArchived ? "bg-slate-50 opacity-75" : "hover:bg-slate-50/50"}>
                        <TableCell className="font-semibold text-slate-700 flex gap-2"><Building className="h-4 w-4 text-slate-400" />{client.name}</TableCell>
                        <TableCell>{getPriorityBadge(client.priority)}</TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{client.scope?.split(',').map(s => <span key={s} className="text-[10px] bg-slate-100 px-1 rounded">{s.trim()}</span>)}</div></TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                                {showArchived ? (
                                    // TLAČIDLO OBNOVIŤ (ak sme v archíve)
                                    <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleRestore(client.id)} title="Obnoviť">
                                        <RotateCcw className="h-4 w-4 mr-1" /> Obnoviť
                                    </Button>
                                ) : (
                                    // TLAČIDLO DETAIL A ARCHIVOVAŤ (ak sme v aktívnych)
                                    <>
                                        <Link href={`/dashboard/agency/clients/${client.id}`}><Button variant="ghost" size="sm" className="text-blue-600">Detail</Button></Link>
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600" onClick={() => handleArchive(client.id)} title="Archivovať"><Trash2 className="h-4 w-4" /></Button>
                                    </>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}