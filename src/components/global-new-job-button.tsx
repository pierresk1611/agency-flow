'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2, Briefcase, ArrowRight, User } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'

type ClientWithCampaigns = {
    id: string
    name: string
    campaigns: { id: string, name: string }[]
}

type UserFn = {
    id: string
    name: string | null
    email: string
}

export function GlobalNewJobButton({
    clients,
    colleagues,
    agencyId
}: {
    clients: ClientWithCampaigns[],
    colleagues: UserFn[],
    agencyId: string
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1) // 1: Client, 2: Campaign, 3: Job Details
    const [loading, setLoading] = useState(false)

    // Step 1 & 2 Data
    const [selectedClientId, setSelectedClientId] = useState<string>('')
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
    const [newCampaignName, setNewCampaignName] = useState('')
    const [localClients, setLocalClients] = useState<ClientWithCampaigns[]>(clients)

    // Step 3 Data (Job)
    const [title, setTitle] = useState('')
    const [deadline, setDeadline] = useState('')
    const [budget, setBudget] = useState('0')
    const [externalLink, setExternalLink] = useState('')
    const [selectedCreatives, setSelectedCreatives] = useState<string[]>([])

    const selectedClient = localClients.find(c => c.id === selectedClientId)
    const currentClientCampaigns = selectedClient?.campaigns || []

    const reset = () => {
        setStep(1)
        setSelectedClientId('')
        setSelectedCampaignId('')
        setNewCampaignName('')
        setTitle('')
        setDeadline('')
        setBudget('0')
        setExternalLink('')
        setSelectedCreatives([])
        setOpen(false)
    }

    const handleCreateCampaign = async () => {
        if (!newCampaignName || !selectedClientId) return
        setLoading(true)
        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCampaignName, clientId: selectedClientId })
            })
            if (res.ok) {
                const newCamp = await res.json()
                // Update local state to show new campaign immediately
                setLocalClients(prev => prev.map(c => {
                    if (c.id === selectedClientId) {
                        return { ...c, campaigns: [...c.campaigns, { id: newCamp.id, name: newCamp.name }] }
                    }
                    return c
                }))
                setSelectedCampaignId(newCamp.id)
                setNewCampaignName('')
                setStep(3) // Auto advance
            } else {
                const err = await res.json()
                alert("Chyba pri vytváraní kampane: " + (err.error || "Neznáma chyba"))
            }
        } catch (e) {
            console.error(e)
            alert("Nepodarilo sa spojiť so serverom pri vytváraní kampane.")
        } finally {
            setLoading(false)
        }
    }

    const handleNext = () => {
        if (step === 1 && selectedClientId) setStep(2)
        else if (step === 2 && selectedCampaignId) setStep(3)
    }

    const handleCreate = async () => {
        if (!title || !deadline || !selectedCampaignId) return
        setLoading(true)

        try {
            const res = await fetch(`/api/create-job`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    deadline,
                    budget,
                    externalLink,
                    campaignId: selectedCampaignId,
                    creativeIds: selectedCreatives
                })
            })

            if (res.ok) {
                reset()
                router.refresh()
            } else {
                const err = await res.json()
                alert("Chyba: " + (err.error || "Neznáma chyba"))
            }
        } catch (e) {
            console.error(e)
            alert("Nepodarilo sa spojiť so serverom.")
        } finally {
            setLoading(false)
        }
    }

    const toggleCreative = (userId: string) => {
        setSelectedCreatives(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        )
    }

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) reset(); setOpen(val) }}>
            <DialogTrigger asChild>
                <Button className="bg-slate-900 text-white hover:bg-slate-800 gap-2 shadow-lg">
                    <Plus className="h-4 w-4" /> Nový Job
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                        {step === 1 && "Krok 1: Výber Klienta"}
                        {step === 2 && "Krok 2: Výber Kampane"}
                        {step === 3 && "Krok 3: Detaily Jobu"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Pre ktorého klienta chcete vytvoriť nový job?"}
                        {step === 2 && `Kampaň pre klienta ${selectedClient?.name}`}
                        {step === 3 && "Vyplňte informácie o úlohe."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* STEP 1: CLIENT SELECT */}
                    {step === 1 && (
                        <div className="grid gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                                {clients.map(client => (
                                    <div
                                        key={client.id}
                                        onClick={() => { setSelectedClientId(client.id); setStep(2) }}
                                        className="flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-slate-50 hover:border-purple-300 transition-all group"
                                    >
                                        <span className="font-bold text-slate-700">{client.name}</span>
                                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-purple-600" />
                                    </div>
                                ))}
                            </div>
                            {clients.length === 0 && <p className="text-center text-slate-400 italic">Žiadni klienti.</p>}
                        </div>
                    )}

                    {/* STEP 2: CAMPAIGN SELECT */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {/* ADD NEW CAMPAIGN UI */}
                            <div className="flex gap-2 items-center pb-2 border-b">
                                <Input
                                    placeholder="Názov nového projektu..."
                                    value={newCampaignName}
                                    onChange={(e) => setNewCampaignName(e.target.value)}
                                    className="h-8 text-sm"
                                />
                                <Button
                                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs whitespace-nowrap"
                                    disabled={!newCampaignName || loading}
                                    onClick={handleCreateCampaign}
                                >
                                    {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                                    Vytvoriť Projekt
                                </Button>
                            </div>

                            <div className="grid gap-2 max-h-[250px] overflow-y-auto">
                                {currentClientCampaigns.length === 0 ? (
                                    <p className="text-center text-slate-400 italic py-4">Tento klient nemá žiadne aktívne projekty.</p>
                                ) : (
                                    currentClientCampaigns.map(camp => (
                                        <div
                                            key={camp.id}
                                            onClick={() => { setSelectedCampaignId(camp.id); setStep(3) }}
                                            className="flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-slate-50 hover:border-purple-300 transition-all group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{camp.name}</span>
                                                <span className="text-[10px] text-slate-400 uppercase">Projekt / Kampaň</span>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-purple-600" />
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="flex justify-start">
                                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600">
                                    ← Späť na výber klienta
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: JOB FORM */}
                    {step === 3 && (
                        <div className="grid gap-6">
                            <div className="bg-slate-50 p-3 rounded-lg border flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase text-slate-400 font-bold">Kampan & Klient</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedClient?.name} — {selectedClient?.campaigns.find(c => c.id === selectedCampaignId)?.name}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="h-6 text-xs text-blue-600">Zmeniť</Button>
                            </div>

                            <div className="grid gap-2">
                                <Label>Názov jobu</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Napr. Produkcia TV spotu" autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Deadline</Label>
                                    <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Budget (€)</Label>
                                    <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Link (Asana/Jira...)</Label>
                                <Input value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://..." />
                            </div>

                            <div className="grid gap-3">
                                <Label>Priradiť ľudí (Notifikácia príde automaticky)</Label>
                                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-slate-50 custom-scrollbar">
                                    {colleagues.map(user => (
                                        <div key={user.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded">
                                            <Checkbox
                                                id={`g-${user.id}`}
                                                checked={selectedCreatives.includes(user.id)}
                                                onCheckedChange={() => toggleCreative(user.id)}
                                            />
                                            <Label htmlFor={`g-${user.id}`} className="text-xs cursor-pointer font-medium text-slate-700 flex items-center gap-2">
                                                <User className="h-3 w-3 text-slate-400" />
                                                {user.name || user.email}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 3 && (
                        <Button onClick={handleCreate} disabled={loading || !title || !deadline} className="bg-slate-900 text-white w-full sm:w-auto shadow-lg hover:bg-black">
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Vytvoriť Job"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
