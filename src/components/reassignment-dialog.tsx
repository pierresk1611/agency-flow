'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ReassignmentDialog({ assignmentId, currentUserId, colleagues }: { assignmentId: string, currentUserId: string, colleagues: { id: string, name: string | null, email: string }[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [targetUserId, setTargetUserId] = useState('')
    const [reason, setReason] = useState('')

    const handleSubmit = async () => {
        if (!targetUserId || !reason) return
        setLoading(true)

        try {
            const res = await fetch(`/api/reassign/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId,
                    targetUserId,
                    reason
                })
            })

            if (res.ok) {
                setOpen(false)
                setTargetUserId('')
                setReason('')
                alert("Žiadosť odoslaná")
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

    // Filter colleagues (exclude current user)
    const availableColleagues = colleagues.filter(c => c.id !== currentUserId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-full justify-start text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold uppercase tracking-wider px-1">
                    <ArrowLeftRight className="h-3 w-3 mr-1" /> Požiadať o presun
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Požiadať o presun úlohy</DialogTitle>
                    <DialogDescription>Ak nestíhate, môžete požiadať o presun na kolegu. Musí schváliť Traffic Manager.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Vyberte kolegu</Label>
                        <Select onValueChange={setTargetUserId} value={targetUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Vyberte..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableColleagues.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name || c.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Dôvod presunu</Label>
                        <Textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Nestíham kvôli inému projektu..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading || !targetUserId || !reason} className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto">
                        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Odoslať žiadosť"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
