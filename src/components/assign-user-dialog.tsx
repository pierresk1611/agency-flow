'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

export function AssignUserDialog({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([]) // Inicializované ako prázdne pole
  
  const [selectedUser, setSelectedUser] = useState('')
  const [roleOnJob, setRoleOnJob] = useState('')

  // Načítanie užívateľov pri otvorení okna
  useEffect(() => {
    if (open) {
        fetch('/api/agency/users')
            .then(res => res.json())
            .then(data => {
                // KRITICKÁ KONTROLA: Ak dáta nie sú pole, nastavíme prázdne pole
                if (Array.isArray(data)) {
                    setUsers(data)
                } else {
                    console.error("API nevrátilo pole užívateľov:", data)
                    setUsers([])
                }
            })
            .catch(err => {
                console.error("Chyba pri načítaní užívateľov:", err)
                setUsers([])
            })
    }
  }, [open])

  const handleAssign = async () => {
    if (!selectedUser) return
    setLoading(true)
    
    try {
        const res = await fetch('/api/jobs/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                jobId, 
                userId: selectedUser, 
                roleOnJob: roleOnJob || 'Člen tímu' 
            })
        })
        
        if (res.ok) {
            setOpen(false)
            setRoleOnJob('')
            setSelectedUser('')
            router.refresh()
        }
    } catch (e) {
        console.error(e)
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto hover:bg-slate-100">
            <Plus className="h-4 w-4 text-slate-600" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pridať kolegu na projekt</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label>Vybrať užívateľa</Label>
            <Select onValueChange={setSelectedUser} value={selectedUser}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Načítavam..." : "Vyberte kolegu..."} />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                    <div className="p-2 text-xs text-center text-muted-foreground">Žiadni užívatelia k dispozícii</div>
                ) : (
                    users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                            {u.name || u.email} ({u.role})
                        </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Rola na tomto jobe</Label>
            <Input 
                placeholder="Napr. Art Director, Copywriter..." 
                value={roleOnJob}
                onChange={(e) => setRoleOnJob(e.target.value)}
            />
          </div>

        </div>
        <DialogFooter>
            <Button onClick={handleAssign} disabled={loading || !selectedUser} className="bg-slate-900 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Priradiť na job
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}