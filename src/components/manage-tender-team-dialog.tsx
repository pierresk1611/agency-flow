'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'

type User = {
    id: string
    name: string | null
    email: string
}

type Assignment = {
    id: string
    user: User
    roleOnJob: string
}

export function ManageTenderTeamDialog({
    tenderId,
    initialAssignments,
    agencyUsers
}: {
    tenderId: string,
    initialAssignments: Assignment[],
    agencyUsers: User[]
}) {
    const [open, setOpen] = useState(false)
    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const [selectedRole, setSelectedRole] = useState<string>('CREATIVE')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const unassignedUsers = agencyUsers.filter(u => !assignments.some(a => a.user.id === u.id))

    const handleAdd = async () => {
        if (!selectedUserId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/tenders/${tenderId}/assignments`, {
                method: 'POST',
                body: JSON.stringify({ userId: selectedUserId, role: selectedRole })
            })
            if (res.ok) {
                const newAssignment = await res.json()
                setAssignments([...assignments, newAssignment])
                setSelectedUserId('')
                router.refresh()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (assignmentId: string) => {
        if (!confirm('Odstrániť tohto člena z pitch tímu?')) return
        try {
            const res = await fetch(`/api/tenders/${tenderId}/assignments?id=${assignmentId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setAssignments(assignments.filter(a => a.id !== assignmentId))
                router.refresh()
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/20 text-white">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        Spravovať Pitch Team
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* ADD NEW */}
                    <div className="flex gap-2 items-end border-b pb-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Člen tímu</label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Vybrať..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {unassignedUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.name || u.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[120px] space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Rola</label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACCOUNT">Account</SelectItem>
                                    <SelectItem value="CREATIVE">Creative</SelectItem>
                                    <SelectItem value="STRATEGY">Strategy</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleAdd} disabled={!selectedUserId || loading} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* LIST */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Aktuálny tím ({assignments.length})</label>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {assignments.map(a => (
                                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-bold">
                                                {(a.user.name || a.user.email).charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{a.user.name || a.user.email}</span>
                                            <span className="text-[10px] uppercase text-slate-400 font-bold">{a.roleOnJob}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(a.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
