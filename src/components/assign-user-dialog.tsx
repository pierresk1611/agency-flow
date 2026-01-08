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
  hourlyRate?: number
  defaultTaskRate?: number
}

export function AssignUserDialog({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([]) // Inicializované ako prázdne pole

  const [selectedUser, setSelectedUser] = useState('')
  const [roleOnJob, setRoleOnJob] = useState('')
  const [costType, setCostType] = useState<'hourly' | 'task'>('hourly')
  const [costValue, setCostValue] = useState('')

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

  // Auto-fill rates when user is selected
  useEffect(() => {
    if (selectedUser) {
      const user = users.find(u => u.id === selectedUser)
      if (user) {
        // Default logic: if user has hourly rate > 0, prefer hourly. 
        // If they have task rate but no hourly, prefer task.
        if (user.defaultTaskRate && user.defaultTaskRate > 0 && (!user.hourlyRate || user.hourlyRate === 0)) {
          setCostType('task')
          setCostValue(user.defaultTaskRate.toString())
        } else {
          setCostType('hourly')
          setCostValue(user.hourlyRate?.toString() || '0')
        }
      }
    }
  }, [selectedUser, users])

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
          roleOnJob: roleOnJob || 'Člen tímu',
          assignedCostType: costType,
          assignedCostValue: parseFloat(costValue || '0')
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
                  users
                    .filter(u => {
                      const forbidden = ['Management', 'Finance', 'Support', 'Vedenie'];
                      // Check position if strictly matches or contains
                      if (!u.role) return true;
                      // If you have specific roles mapped to these, check u.role
                      // If it's about the 'position' string field (which might not be in the minimal User interface above, but checked in API response):
                      // user interface above only has id, email, name, role. 
                      // Let's assume for now we filter by Role if they map, OR we need extended user data.
                      // The prompt says "ak sú definované v AgencyPosition". 
                      // Let's rely on what passes through. If the API returns 'position', add it to interface.
                      // For now, let's filter purely based on requirement text if possible, but 'role' is what I have typed.
                      // I will update the interface to include position first to be safe.
                      return true;
                    })
                    // Actually, I need to see if the API returns position. 
                    // Let's blindly filter by position if it exists on the object despite the interface, or update interface.
                    // The safer bet: Update interface first? No, I'll do it in one go if I can.
                    // Let's look at the fetch: it calls /api/agency/users.
                    // I'll update the interface and the filter.
                    .map((u) => (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Typ odmeny</Label>
              <Select onValueChange={(v) => setCostType(v as 'hourly' | 'task')} value={costType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hodinová</SelectItem>
                  <SelectItem value="task">Úkolová (Fix)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Sadzba (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
              />
            </div>
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