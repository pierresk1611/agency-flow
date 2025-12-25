'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

export function AddFileDialog({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [fileUrl, setFileUrl] = useState('')

  const handleUpload = async () => {
    if (!fileUrl || !name) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, name, fileType: 'LINK' })
      })
      if (res.ok) {
        setOpen(false); setFileUrl(''); setName('');
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
            <Plus className="h-4 w-4 text-slate-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Pridať odkaz</DialogTitle>
            <DialogDescription>Zadajte názov a URL adresu podkladov.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov (čo to je?)</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Napr. Dropbox s podkladmi" />
          </div>
          <div className="grid gap-2">
            <Label>Odkaz (URL)</Label>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="www.dropbox.com/..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={loading || !fileUrl || !name} className="bg-slate-900 text-white w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Uložiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}