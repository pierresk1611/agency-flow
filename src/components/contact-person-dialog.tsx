'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

export function ContactPersonDialog({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')

  const handleCreate = async () => {
    if (!name) return
    setLoading(true)
    try {
        const res = await fetch('/api/clients/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, name, email, phone, position })
        })
        if (res.ok) {
            setOpen(false)
            setName(''); setEmail(''); setPhone(''); setPosition('')
            router.refresh()
        }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Plus className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nová Kontaktná Osoba</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>Meno a Priezvisko</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jozef Novák" />
            </div>
            <div className="grid gap-2">
                <Label>Pozícia</Label>
                <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="Marketing Manager" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="@" />
                </div>
                <div className="grid gap-2">
                    <Label>Telefón</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+421..." />
                </div>
            </div>
        </div>
        <DialogFooter>
            <Button onClick={handleCreate} disabled={loading || !name} className="bg-slate-900 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Uložiť
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}