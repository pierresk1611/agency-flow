'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Client {
    id: string
    name: string
    priority: number
    scope: string | null
    companyId?: string | null
    vatId?: string | null
    billingAddress?: string | null
    importantNote?: string | null
    agencyId: string
}

interface Scope {
    id: string
    name: string
}

export function ClientEditDialog({
    client,
    onSuccess,
    trigger
}: {
    client: Client,
    onSuccess?: () => void,
    trigger?: React.ReactNode
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [name, setName] = useState(client.name)
    const [priority, setPriority] = useState(client.priority.toString())
    const [companyId, setCompanyId] = useState(client.companyId || '')
    const [vatId, setVatId] = useState(client.vatId || '')
    const [billingAddress, setBillingAddress] = useState(client.billingAddress || '')
    const [importantNote, setImportantNote] = useState(client.importantNote || '')

    const [scopesList, setScopesList] = useState<Scope[]>([])
    const [selectedScope, setSelectedScope] = useState<string[]>([])
    const [isOtherSelected, setIsOtherSelected] = useState(false)
    const [customScope, setCustomScope] = useState('')

    useEffect(() => {
        if (open) {
            // Fetch latest scopes and initialize based on client
            fetch('/api/agency/scopes')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setScopesList(data)
                        const currentScopes = client.scope ? client.scope.split(',').map(s => s.trim()) : []
                        const standardNames = data.map(s => s.name)
                        const standard = currentScopes.filter(s => standardNames.includes(s))
                        const custom = currentScopes.filter(s => !standardNames.includes(s))

                        setSelectedScope(standard)
                        if (custom.length > 0) {
                            setIsOtherSelected(true)
                            setCustomScope(custom.join(', '))
                        }
                    }
                })
        }
    }, [open, client])

    const toggleScope = (scopeName: string) => {
        setSelectedScope(prev => prev.includes(scopeName) ? prev.filter(s => s !== scopeName) : [...prev, scopeName])
    }

    const handleSave = async () => {
        if (!name.trim()) return
        setSubmitting(true)
        setError('')

        let finalScopeList = [...selectedScope]
        if (isOtherSelected && customScope.trim()) {
            const customs = customScope.split(',').map(s => s.trim())
            finalScopeList = [...finalScopeList, ...customs]
        }

        try {
            const res = await fetch(`/api/clients/${client.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    priority,
                    scope: finalScopeList,
                    companyId,
                    vatId,
                    billingAddress,
                    importantNote
                })
            })

            if (res.ok) {
                setOpen(false)
                if (onSuccess) onSuccess()
                router.refresh()
            } else {
                const data = await res.json()
                setError(data.error || 'Nastala chyba pri ukladaní.')
            }
        } catch (e) {
            console.error(e)
            setError('Nepodarilo sa spojiť so serverom.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border hover:bg-white shadow-sm">
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Upraviť Klienta</DialogTitle>
                    <DialogDescription>Zadajte údajev o klientovi.</DialogDescription>
                    {error && <div className="text-red-500 text-sm font-medium mt-2 p-2 bg-red-50 rounded-md">{error}</div>}
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid gap-2"><Label>Názov</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>IČO</Label><Input value={companyId} onChange={e => setCompanyId(e.target.value)} placeholder="Napr. 12345678" /></div>
                        <div className="grid gap-2"><Label>DIČ / IČ DPH</Label><Input value={vatId} onChange={e => setVatId(e.target.value)} placeholder="SK202..." /></div>
                    </div>

                    <div className="grid gap-2"><Label>Fakturačná adresa</Label><Input value={billingAddress} onChange={e => setBillingAddress(e.target.value)} /></div>

                    <div className="grid gap-2"><Label>Priorita</Label>
                        <Select value={priority} onValueChange={setPriority}>
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

                    <div className="grid gap-2">
                        <Label>Interná poznámka (Dôležité upozornenie pre tím)</Label>
                        <Textarea
                            value={importantNote}
                            onChange={e => setImportantNote(e.target.value)}
                            placeholder="Napr. Pozor na platby, Vyžadujú modru farbu..."
                            className="bg-amber-50 border-amber-200 focus-visible:ring-amber-500"
                        />
                    </div>

                    <div className="grid gap-2"><Label>Rozsah</Label>
                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50/50 max-h-[180px] overflow-y-auto">
                            {scopesList.map(s => (
                                <div key={s.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`scope-${s.id}`}
                                        checked={selectedScope.includes(s.name)}
                                        onCheckedChange={() => toggleScope(s.name)}
                                    />
                                    <label htmlFor={`scope-${s.id}`} className="text-xs cursor-pointer">{s.name}</label>
                                </div>
                            ))}
                            <div className="col-span-2 pt-2 border-t">
                                <Checkbox
                                    id="scope-other"
                                    checked={isOtherSelected}
                                    onCheckedChange={(c) => setIsOtherSelected(!!c)}
                                />
                                <label htmlFor="scope-other" className="ml-2 text-xs font-bold text-blue-700 cursor-pointer">+ Iné</label>
                            </div>
                        </div>
                        {isOtherSelected && (
                            <Input
                                value={customScope}
                                onChange={e => setCustomScope(e.target.value)}
                                className="mt-2 bg-blue-50"
                                placeholder="Zadajte rozsahy oddelené čiarkou..."
                            />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={submitting || !name} className="bg-slate-900 text-white w-full">
                        {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Uložiť zmeny"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
