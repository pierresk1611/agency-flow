'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, // <--- KRITICKÝ IMPORT
  DialogFooter 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export function AddPlannerEntryDialog({ allJobs }: { allJobs: any[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [jobId, setJobId] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [minutes, setMinutes] = useState('60')
  const [title, setTitle] = useState('')

  const handleSave = async () => {
    if (!title || !date) return
    setLoading(true)
    const finalJobId = jobId === 'INTERNAL' ? '' : jobId;

    try {
      const res = await fetch(`/api/planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: finalJobId, 
          date, 
          minutes: minutes,
          title
        })
      })
      if (res.ok) {
        setOpen(false)
        setJobId(''); setDate(format(new Date(), 'yyyy-MM-dd')); setMinutes('60'); setTitle('')
        router.refresh()
      } else {
          alert("Chyba: Nepodarilo sa uložiť plán.")
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"><Plus className="h-4 w-4 mr-2" /> Naplánovať prácu</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nový záznam v Plánovači</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Job / Projekt (Voliteľné)</Label>
            <Select onValueChange={setJobId} value={jobId}>
              <SelectTrigger><SelectValue placeholder="Vyberte job, na ktorom budete pracovať" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL">INTERNÁ PRÁCA / BEZ KLIENTA</SelectItem> 
                {allJobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                        {job.title} ({job.campaign.client.name})
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Popis úlohy</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Napr. Príprava podkladov k tendru..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Dátum</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Odhad minút</Label><Input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading || !title || !date} className="bg-emerald-600 text-white w-full">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Uložiť do plánu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}