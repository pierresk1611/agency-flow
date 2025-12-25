'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // <--- Pridaný textarea
import { Plus, Loader2 } from 'lucide-react'

export function AddTenderDialog({ slug }: { slug: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('0')
  const [description, setDescription] = useState('')

  const handleCreate = async () => {
    if (!title || !deadline) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tenders`, { // <--- OPRAVENÁ URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          deadline, 
          budget,
          description
        })
      })
      
      if (res.ok) {
        setOpen(false)
        setTitle(''); setDeadline(''); setBudget('0'); setDescription('')
        router.refresh()
      } else {
        const err = await res.json()
        alert("Chyba: " + err.error)
      }
    } catch (e) {
      alert("Nepodarilo sa spojiť so serverom.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2">
            <Plus className="h-4 w-4" /> Nový Pitch / Tender
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nový Tender</DialogTitle>
          <DialogDescription>Zadajte základné zadanie pre tento pitching.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov tendra</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Napr. McDonalds – Social 2025" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Deadline</Label>
                <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label>Budget / Fee (€)</Label>
                <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Zadanie (Brief)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="O čom je tento tender?" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading || !title || !deadline} className="bg-purple-700 text-white">
            {loading ? <Loader2 className="animate-spin" /> : "Vytvoriť Tender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}