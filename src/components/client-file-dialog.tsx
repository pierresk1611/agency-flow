'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Paperclip } from 'lucide-react'

export function ClientFileDialog({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('TENDER')

  const handleUpload = async () => {
    if (!fileUrl) return
    setLoading(true)
    try {
      const res = await fetch('/api/clients/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, fileUrl, fileType })
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
        <Button variant="outline" size="sm" className="h-8 gap-2">
            <Plus className="h-3.5 w-3.5" /> Pridať dokument
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Pridať dokument ku klientovi</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov / URL súboru</Label>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="Napr. tendrove-zadanie-v1.pdf" />
          </div>
          <div className="grid gap-2">
            <Label>Typ dokumentu</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TENDER">Tendrové zadanie</SelectItem>
                <SelectItem value="PROPOSAL">Vypracovanie / Prezentácia</SelectItem>
                <SelectItem value="CONTRACT">Zmluva / Právne</SelectItem>
                <SelectItem value="MANUAL">Brand manuál</SelectItem>
                <SelectItem value="OTHER">Iné</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={loading || !fileUrl} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Uložiť do archívu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}