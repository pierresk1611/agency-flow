'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Paperclip } from 'lucide-react'

export function AddFileDialog({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('PDF')

  const handleUpload = async () => {
    if (!fileUrl) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, fileType })
      })
      if (res.ok) {
        setOpen(false)
        setFileUrl('')
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Pridať súbor k jobu</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov alebo Odkaz na súbor</Label>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="Napr. final-vizual-v1.pdf" />
          </div>
          <div className="grid gap-2">
            <Label>Formát</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">Dokument (PDF)</SelectItem>
                <SelectItem value="IMAGE">Obrázok (JPG/PNG)</SelectItem>
                <SelectItem value="ARCHIVE">Archív (ZIP)</SelectItem>
                <SelectItem value="LINK">Externý odkaz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={loading || !fileUrl} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pridať prílohu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}