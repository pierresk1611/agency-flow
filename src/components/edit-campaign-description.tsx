'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Loader2 } from 'lucide-react'

export function EditCampaignDescription({ campaignId, initialDescription }: { campaignId: string, initialDescription: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState(initialDescription)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })
      if (res.ok) {
        setOpen(false)
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Upraviť zadanie kampane</DialogTitle></DialogHeader>
        <div className="py-4">
          <Textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Vložte detailný brief pre celý tím..."
            className="min-h-[300px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Zrušiť</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Aktualizovať Brief"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}