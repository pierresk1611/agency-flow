'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, MoreHorizontal, Clock, Euro, Lock, Unlock, Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AgencyActionsProps {
    agency: {
        id: string
        isSuspended: boolean
        name: string
        trialEndsAt: Date | null
    }
}

export function AgencyActions({ agency }: AgencyActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [extendOpen, setExtendOpen] = useState(false)
    const [days, setDays] = useState('14')

    const handleToggleSuspend = async () => {
        if (!confirm(agency.isSuspended ? 'Naozaj odblokovať?' : 'Naozaj zablokovať?')) return

        setLoading(true)
        // We invoke the server action via a simple fetch call wrapped in a transition or just reload
        // Note: In a real app we'd use Server Actions properly, but here we can just call an API to toggle 
        // OR we can keep the simple form action for toggle in parent and only use this for complex stuff.
        // Actually, let's just use the API pattern we established for consistency or standard Server Actions.
        // Since the parent uses server action, let's just do the complex parts here.
    }

    const handleExtend = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/superadmin/agencies/${agency.id}/extend`, {
                method: 'POST',
                body: JSON.stringify({ days })
            })
            if (res.ok) {
                setExtendOpen(false)
                router.refresh()
            } else {
                alert('Chyba pri predlžovaní')
            }
        } catch (e) {
            alert('Chyba')
        } finally {
            setLoading(false)
        }
    }

    const handleSendPayment = async () => {
        if (!confirm(`Naozaj poslať platobný link agentúre ${agency.name}?`)) return
        setLoading(true)
        try {
            const res = await fetch(`/api/superadmin/agencies/${agency.id}/send-payment`, {
                method: 'POST'
            })
            if (res.ok) {
                alert('Email odoslaný')
            } else {
                alert('Chyba pri odosielaní')
            }
        } catch (e) {
            alert('Chyba')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setExtendOpen(true)}>
                        <Clock className="mr-2 h-4 w-4" /> Predĺžiť Trial
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSendPayment}>
                        <Euro className="mr-2 h-4 w-4" /> Poslať Platbu
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Predĺžiť Trial</DialogTitle>
                        <DialogDescription>
                            Zadajte počet dní, o ktoré sa predĺži skúšobná verzia pre <strong>{agency.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Počet dní</Label>
                            <Input type="number" value={days} onChange={e => setDays(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleExtend} disabled={loading} className="bg-slate-900 text-white">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Uložiť"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
