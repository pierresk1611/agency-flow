'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from 'lucide-react'

export function AddCampaignDialog({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })
      if (res.ok) {
        setOpen(false); setName(''); setDescription('');
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Nová kampaň</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Vytvoriť kampaň</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov kampane</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Napr. Letný výpredaj 2025" />
          </div>
          <div className="grid gap-2">
            <Label>Popis (Brief)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Zadanie pre kampaň..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading || !name} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="animate-spin" /> : "Vytvoriť"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}