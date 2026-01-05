'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from 'lucide-react'

interface UserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingUser?: any
    onSuccess: () => void
    currentUserRole?: string
}

export function UserDialog({ open, onOpenChange, editingUser, onSuccess, currentUserRole }: UserDialogProps) {
    const [submitting, setSubmitting] = useState(false)
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [role, setRole] = useState('CREATIVE')
    const [position, setPosition] = useState('')
    const [hourlyRate, setHourlyRate] = useState('50')
    const [costRate, setCostRate] = useState('30')

    useEffect(() => {
        if (editingUser) {
            setEmail(editingUser.email || '')
            setName(editingUser.name || '')
            setRole(editingUser.role || 'CREATIVE')
            setPosition(editingUser.position || '')
            setHourlyRate(editingUser.hourlyRate?.toString() || '0')
            setCostRate(editingUser.costRate?.toString() || '0')
        } else {
            setEmail('')
            setName('')
            setRole('CREATIVE')
            setPosition('')
            setHourlyRate('50')
            setCostRate('30')
        }
    }, [editingUser, open])

    const handleSave = async () => {
        setSubmitting(true)
        const url = editingUser ? `/api/agency/users/${editingUser.id}` : '/api/agency/users'
        const method = editingUser ? 'PATCH' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    name,
                    role,
                    position,
                    hourlyRate: parseFloat(hourlyRate),
                    costRate: parseFloat(costRate),
                    active: true,
                    password: editingUser ? undefined : 'password123'
                })
            })
            if (res.ok) {
                onOpenChange(false)
                onSuccess()
            } else {
                const err = await res.json()
                alert('Chyba: ' + (err.error || 'Nepodarilo sa uložiť'))
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingUser ? 'Upraviť člena' : 'Pridať člena'}</DialogTitle>
                    <DialogDescription>Vyplňte údaje o kolegovi.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Celé meno</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Peter Novák" />
                    </div>
                    {!editingUser && (
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@agentura.sk" />
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label>Pozícia (napr. Senior Graphic Designer)</Label>
                        <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="Pozícia..." />
                    </div>
                    <div className="grid gap-2">
                        <Label>Rola v systéme</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">ADMIN (Plný prístup)</SelectItem>
                                <SelectItem value="TRAFFIC">TRAFFIC (Riadenie)</SelectItem>
                                <SelectItem value="ACCOUNT">ACCOUNT (Schvaľovanie)</SelectItem>
                                <SelectItem value="CREATIVE">CREATIVE (Stopky)</SelectItem>
                                {currentUserRole === 'SUPERADMIN' && (
                                    <SelectItem value="SUPERADMIN">SUPERADMIN (Global)</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Billable (€/h)</Label>
                            <Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Cost (€/h)</Label>
                            <Input type="number" value={costRate} onChange={e => setCostRate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušiť</Button>
                    <Button onClick={handleSave} disabled={submitting} className="bg-slate-900 text-white">
                        {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Uložiť"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
