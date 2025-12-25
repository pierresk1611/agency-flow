'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link2, Loader2, Plus } from 'lucide-react'

export function AddTenderFileDialog({ tenderId }: { tenderId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('')

  const handleAdd = async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tenders/${tenderId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: url, fileType: 'LINK' })
      })
      if (res.ok) {
        setUrl('')
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
            <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Pridať odkaz na podklady</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Link (Dropbox, Drive, WeTransfer...)</Label>
            <Input 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                placeholder="https://www.dropbox.com/s/..." 
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={loading || !url} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Pridať link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}