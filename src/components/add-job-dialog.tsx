'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox" // Pridanie Checkboxu
import { Plus, Loader2 } from 'lucide-react'

export function AddJobDialog({ campaignId, agencyId }: { campaignId: string, agencyId?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creatives, setCreatives] = useState<any[]>([]) // Načítaní kreatívci
  const [selectedCreatives, setSelectedCreatives] = useState<string[]>([]) // Vybrané IDčka

  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('0')
  const [externalLink, setExternalLink] = useState('')

  // Načítanie kreatívcov pri otvorení
  useEffect(() => {
    if (open && agencyId) {
      fetch(`/api/agency/users?agencyId=${agencyId}&role=CREATIVE`)
        .then(res => res.json())
        .then(data => setCreatives(data))
        .catch(err => console.error(err))
    }
  }, [open, agencyId])

  const toggleCreative = (userId: string) => {
    setSelectedCreatives(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleCreate = async () => {
    if (!title || !deadline) return
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
          campaignId,
          creativeIds: selectedCreatives // Posielame aj vybraných kreatívcov
        })
      })

      if (res.ok) {
        setOpen(false)
        setTitle('')
        setDeadline('')
        setBudget('0')
        setExternalLink('')
        setSelectedCreatives([])
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold uppercase tracking-wider">
          + Nový job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Pridať Job do kampane</DialogTitle>
          <DialogDescription>Vytvorte novú úlohu a priraďte kreatívcov.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
          <div className="grid gap-2">
            <Label>Link na Asanu / ClickUp / Freelo</Label>
            <Input value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://app.asana.com/..." />
          </div>

          <div className="grid gap-3">
            <Label>Priradiť kreatívcov</Label>
            <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-slate-50">
              {creatives.length === 0 ? (
                <p className="text-xs text-slate-400 col-span-2 text-center italic">Žiadni kreatívci v agentúre.</p>
              ) : (
                creatives.map(user => (
                  <div key={user.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded">
                    <Checkbox
                      id={user.id}
                      checked={selectedCreatives.includes(user.id)}
                      onCheckedChange={() => toggleCreative(user.id)}
                    />
                    <Label htmlFor={user.id} className="text-xs cursor-pointer font-medium text-slate-700">
                      {user.name || user.email}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading || !title || !deadline} className="bg-slate-900 text-white w-full sm:w-auto">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Vytvoriť Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}