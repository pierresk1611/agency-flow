'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

export function AddJobDialog({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('0')

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, deadline, budget })
      })
      if (res.ok) {
        setOpen(false); setTitle(''); setDeadline(''); setBudget('0');
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-blue-600">+ Nový job</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Pridať Job do kampane</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov jobu</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Napr. Produkcia TV spotu" />
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
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading || !title || !deadline} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="animate-spin" /> : "Vytvoriť Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}