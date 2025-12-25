'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

export function AddTenderDialog({ slug }: { slug: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('0')

  const handleCreate = async () => {
    if (!title || !deadline) return
    setLoading(true)
    try {
      // Voláme naše API pre tendre
      const res = await fetch(`/${slug}/tenders/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          deadline, 
          budget: parseFloat(budget) 
        })
      })
      
      if (res.ok) {
        setOpen(false)
        setTitle(''); setDeadline(''); setBudget('0')
        router.refresh()
      } else {
        alert("Chyba pri vytváraní tendra")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2 shadow-md">
            <Plus className="h-4 w-4" /> Nový Pitch / Tender
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nový Tender / Výberové konanie</DialogTitle>
          <DialogDescription>Zadajte základné info o novom pitchi.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Názov tendra</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Napr. Rebranding Telecom 2025" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline odovzdania</Label>
                <Input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="budget">Predpokladané Fee (€)</Label>
                <Input id="budget" type="number" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading || !title || !deadline} className="bg-purple-700 text-white w-full">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Vytvoriť a sledovať"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}