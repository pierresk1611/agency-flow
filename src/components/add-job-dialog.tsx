'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox" // Pridanie Checkboxu
import { Plus, Loader2 } from 'lucide-react'

export function AddJobDialog({ campaignId, agencyId, defaultAssigneeIds = [] }: { campaignId: string, agencyId?: string, defaultAssigneeIds?: string[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creatives, setCreatives] = useState<any[]>([]) // Načítaní kreatívci
  const [selectedCreatives, setSelectedCreatives] = useState<{ userId: string, costType: 'hourly' | 'task', costValue: string }[]>([])

  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('0')
  const [externalLink, setExternalLink] = useState('')

  // Sync selection with defaults when dialog opens
  useEffect(() => {
    if (open && creatives.length > 0) {
      const initial = defaultAssigneeIds.map(id => {
        const u = creatives.find(user => user.id === id)
        const costType = u?.defaultTaskRate && u.defaultTaskRate > 0 && (!u.hourlyRate || u.hourlyRate === 0) ? 'task' : 'hourly'
        const costValue = (costType === 'task' ? u?.defaultTaskRate : u?.hourlyRate)?.toString() || '0'
        return { userId: id, costType, costValue }
      })
      setSelectedCreatives(initial as any)
    }
  }, [open, defaultAssigneeIds, creatives])

  // Načítanie kreatívcov pri otvorení
  useEffect(() => {
    if (open && agencyId) {
      fetch(`/api/agency/users`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCreatives(data)
          }
        })
        .catch(err => console.error(err));
    }
  }, [open, agencyId])

  const toggleCreative = (user: any) => {
    setSelectedCreatives(prev => {
      const exists = prev.find(p => p.userId === user.id)
      if (exists) {
        return prev.filter(p => p.userId !== user.id)
      } else {
        const costType = user.defaultTaskRate && user.defaultTaskRate > 0 && (!user.hourlyRate || user.hourlyRate === 0) ? 'task' : 'hourly'
        const costValue = (costType === 'task' ? user.defaultTaskRate : user.hourlyRate)?.toString() || '0'
        return [...prev, { userId: user.id, costType, costValue } as any]
      }
    })
  }

  const updateAssignment = (userId: string, field: 'costType' | 'costValue', value: string) => {
    setSelectedCreatives(prev => prev.map(p => p.userId === userId ? { ...p, [field]: value } : p))
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
          creativeIds: selectedCreatives.map(c => c.userId),
          creativeAssignments: selectedCreatives
        })
      })

      if (res.ok) {
        setOpen(false)
        setTitle('')
        setDeadline('')
        setBudget('0')
        setExternalLink('')
        setBudget('0')
        setExternalLink('')
        setSelectedCreatives(defaultAssigneeIds) // Reset to default
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
            <Label>Priradiť kreatívcov & Nastaviť sadzby</Label>
            <div className="grid gap-2 border rounded-md p-3 max-h-60 overflow-y-auto bg-slate-50">
              {creatives.length === 0 ? (
                <p className="text-xs text-slate-400 text-center italic">Žiadni používatelia v agentúre.</p>
              ) : (
                creatives.map(user => {
                  const assignment = selectedCreatives.find(p => p.userId === user.id)
                  const isSelected = !!assignment

                  return (
                    <div key={user.id} className={`flex flex-col gap-2 p-2 rounded border ${isSelected ? 'bg-white border-blue-200' : 'hover:bg-slate-100 border-transparent'}`}>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={user.id}
                          checked={isSelected}
                          onCheckedChange={() => toggleCreative(user)}
                        />
                        <Label htmlFor={user.id} className="text-xs cursor-pointer font-bold text-slate-700 flex-1">
                          {user.name || user.email} {user.role ? `(${user.role})` : ''}
                        </Label>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-2 pl-6 animate-in fade-in slide-in-from-left-2 duration-200">
                          <select
                            className="text-[10px] h-7 rounded border bg-white px-1 font-medium"
                            value={assignment.costType}
                            onChange={(e) => updateAssignment(user.id, 'costType', e.target.value)}
                          >
                            <option value="hourly">Hodinová</option>
                            <option value="task">Úkolová (Fix)</option>
                          </select>
                          <div className="relative flex-1 max-w-[100px]">
                            <Input
                              type="number"
                              step="0.01"
                              className="h-7 text-[10px] pr-4 font-mono"
                              value={assignment.costValue}
                              onChange={(e) => updateAssignment(user.id, 'costValue', e.target.value)}
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">€</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
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