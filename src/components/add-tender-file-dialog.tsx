'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from 'lucide-react'

export function AddTenderFileDialog({ tenderId }: { tenderId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('LINK')

  const handleAdd = async () => {
    if (!fileUrl) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tenders/${tenderId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, fileType })
      })
      if (res.ok) {
        setFileUrl('')
        setOpen(false)
        router.refresh()
      } else {
        const err = await res.json()
        alert("Chyba: " + err.error)
      }
    } catch (e) { 
        alert("Chyba spojenia") 
    } finally { 
        setLoading(false) 
    }
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
            <DialogTitle>Pridať odkaz k tendru</DialogTitle>
            <DialogDescription>Vložte link na tendrové podklady alebo vypracovanie.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Odkaz na súbor (Link)</Label>
            <Input 
                value={fileUrl} 
                onChange={e => setFileUrl(e.target.value)} 
                placeholder="https://share.agency.sk/..." 
            />
          </div>
          <div className="grid gap-2">
            <Label>Typ</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TENDER">Tendrové zadanie</SelectItem>
                <SelectItem value="PROPOSAL">Naše vypracovanie</SelectItem>
                <SelectItem value="LINK">Iný odkaz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={loading || !fileUrl} className="bg-slate-900 text-white w-full sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Pridať odkaz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}