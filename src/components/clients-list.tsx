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
import { Building, Plus, Loader2, ArrowRight, Trash2, RotateCcw, Pencil } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation' // <--- IMPORT usePathname
import Link from 'next/link'

interface Client {
    id: string; name: string; priority: number; scope: string | null; _count: { campaigns: number }
}
interface ScopeOption { id: string; name: string }

export function ClientsList() {
    const router = useRouter()
    const pathname = usePathname()
    // Vytiahneme slug z URL (napr. /super-creative/clients -> super-creative)
    const slug = pathname.split('/')[1]

    const [clients, setClients] = useState<Client[]>([])
    const [scopesList, setScopesList] = useState<ScopeOption[]>([])
    const [loading, setLoading] = useState(true)

    // Stavy pre Dialog
    const [open, setOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [showArchived, setShowArchived] = useState(false)

    const [newName, setNewName] = useState('')
    const [newPriority, setNewPriority] = useState('3')
    const [selectedScope, setSelectedScope] = useState<string[]>([])
    const [isOtherSelected, setIsOtherSelected] = useState(false)
    const [customScope, setCustomScope] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

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

    useEffect(() => { refreshData() }, [showArchived])

    const openNewDialog = () => {
        setEditingClient(null); setNewName(''); setNewPriority('3'); setSelectedScope([]); setIsOtherSelected(false); setCustomScope(''); setError(''); setOpen(true)
    }

    const openEditDialog = (client: Client) => {
        setEditingClient(client)
        setNewName(client.name)
        setNewPriority(client.priority.toString())
        const currentScopes = client.scope ? client.scope.split(',').map(s => s.trim()) : []
        const standardScopeNames = scopesList.map(s => s.name)
        const standard = currentScopes.filter(s => standardScopeNames.includes(s))
        const custom = currentScopes.filter(s => !standardScopeNames.includes(s))
        setSelectedScope(standard)
        if (custom.length > 0) { setIsOtherSelected(true); setCustomScope(custom.join(', ')) }
        else { setIsOtherSelected(false); setCustomScope('') }
        setOpen(true)
    }

    const toggleScope = (scopeName: string) => {
        setSelectedScope(prev => prev.includes(scopeName) ? prev.filter(s => s !== scopeName) : [...prev, scopeName])
    }

    const handleSave = async () => {
        if (!newName.trim()) return
        setSubmitting(true)

        let finalScopeList = [...selectedScope]
        if (isOtherSelected && customScope.trim()) {
            const customs = customScope.split(',').map(s => s.trim())
            finalScopeList = [...finalScopeList, ...customs]
        }

        try {
            const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
            const method = editingClient ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, priority: newPriority, scope: finalScopeList })
            })

            if (res.ok) {
                setOpen(false)
                if (isOtherSelected) {
                    const sRes = await fetch('/api/agency/scopes')
                    if (sRes.ok) setScopesList(await sRes.json())
                }
                await refreshData()
                router.refresh()
            } else {
                const data = await res.json()
                setError(data.error || 'Nastala chyba pri ukladaní.')
            }
        } catch (e) {
            console.error(e)
            setError('Nepodarilo sa spojiť so serverom.')
        } finally { setSubmitting(false) }
    }

    const handleArchive = async (id: string, restore = false) => {
        const url = restore ? `/api/clients/${id}/restore` : `/api/clients/${id}/archive`
        if (!confirm(restore ? "Obnoviť?" : "Archivovať?")) return
        try {
            const res = await fetch(url, { method: 'PATCH' })
            if (res.ok) await refreshData()
        } catch (e) { console.error(e) }
    }

    const getPriorityBadge = (p: number) => {
        if (p >= 5) return <Badge className="bg-red-600 hover:bg-red-700">VIP</Badge>
        if (p === 4) return <Badge className="bg-orange-500 hover:bg-orange-600">Vysoká</Badge>
        if (p === 3) return <Badge variant="outline" className="border-blue-500 text-blue-600">Stredná</Badge>
        return <Badge variant="secondary">Nízka</Badge>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium text-slate-800">Manažment Klientov</h3>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setShowArchived(false)} className={`px-3 py-1 text-[10px] font-bold rounded-md ${!showArchived ? 'bg-white shadow' : 'text-slate-500'}`}>AKTÍVNI</button>
                        <button onClick={() => setShowArchived(true)} className={`px-3 py-1 text-[10px] font-bold rounded-md ${showArchived ? 'bg-white shadow' : 'text-slate-500'}`}>ARCHÍV</button>
                    </div>
                </div>
                {!showArchived && (
                    <Button onClick={openNewDialog} className="bg-slate-900 text-white"><Plus className="mr-2 h-4 w-4" /> Nový Klient</Button>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'Upraviť Klienta' : 'Nový Klient'}</DialogTitle>
                        <DialogDescription>Zadajte údaje o klientovi.</DialogDescription>
                        {error && <div className="text-red-500 text-sm font-medium mt-2 p-2 bg-red-50 rounded-md">{error}</div>}
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2"><Label>Názov</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Priorita</Label>
                            <Select value={newPriority} onValueChange={setNewPriority}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 - Nízka</SelectItem>
                                    <SelectItem value="2">2 - Mierna</SelectItem>
                                    <SelectItem value="3">3 - Stredná</SelectItem>
                                    <SelectItem value="4">4 - Vysoká</SelectItem>
                                    <SelectItem value="5">5 - VIP</SelectItem>
                                </SelectContent>
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
                    <DialogFooter><Button onClick={handleSave} disabled={submitting || !newName} className="bg-slate-900 text-white">{submitting ? <Loader2 className="animate-spin" /> : "Uložiť"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

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
                                                    <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleArchive(client.id, true)}><RotateCcw className="h-4 w-4 mr-1" /> Obnoviť</Button>
                                                ) : (
                                                    <>
                                                        {/* OPRAVENÝ LINK NA DETAIL */}
                                                        <Link href={`/${slug}/clients/${client.id}`}><Button variant="ghost" size="sm" className="text-blue-600 font-bold text-xs h-7">DETAIL</Button></Link>
                                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(client)} className="h-7 w-7 p-0"><Pencil className="h-3.5 w-3.5 text-slate-400" /></Button>
                                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 h-7 w-7 p-0" onClick={() => handleArchive(client.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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