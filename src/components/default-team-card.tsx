'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Edit2 } from 'lucide-react'
import { UserDialog } from './user-dialog'

export default function DefaultTeamCard({ clientId, initialAssigneeIds }: { clientId: string; initialAssigneeIds: string[] }) {
    const [usersList, setUsersList] = useState<Array<{ id: string; name: string | null; email: string; role?: string; position?: string; hourlyRate?: number; costRate?: number }>>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(initialAssigneeIds)
    const [loading, setLoading] = useState(true)

    // User Dialog State
    const [userDialogOpen, setUserDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)

    const fetchUsers = () => {
        setLoading(true)
        fetch('/api/agency/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUsersList(data)
                } else {
                    console.error('Expected array of users, got:', data)
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev => (prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]))
    }

    const saveDefaultTeam = async () => {
        try {
            const res = await fetch(`/api/clients/${clientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ defaultAssigneeIds: selectedUserIds })
            })
            if (!res.ok) {
                const err = await res.json()
                alert('Chyba pri ukladaní tímu: ' + (err.error || 'Neznáma chyba'))
            } else {
                window.location.reload()
            }
        } catch (e) {
            console.error(e)
            alert('Failed to save default team')
        }
    }

    const handleAddUser = () => {
        setEditingUser(null)
        setUserDialogOpen(true)
    }

    const handleEditUser = (u: any) => {
        setEditingUser(u)
        setUserDialogOpen(true)
    }

    return (
        <>
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/30 py-3">
                    <CardTitle className="text-lg">Predvolený tím</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border bg-white shadow-sm" onClick={handleAddUser}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid gap-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                            </div>
                        ) : usersList.length === 0 ? (
                            <p className="text-xs text-center py-6 text-slate-400 italic">Nenašli sa žiadni používatelia.</p>
                        ) : (
                            (() => {
                                const grouped: Record<string, Array<(typeof usersList)[0]>> = {}
                                usersList.forEach(u => {
                                    const key = u.role || u.position || 'Ostatné'
                                    if (!grouped[key]) grouped[key] = []
                                    grouped[key].push(u)
                                })
                                return Object.entries(grouped).map(([group, users]) => (
                                    <div key={group} className="mb-4 last:mb-0">
                                        <div className="font-bold text-[10px] uppercase text-slate-400 mb-2 tracking-wider">{group}</div>
                                        <div className="grid grid-cols-1 gap-1">
                                            {users.map(u => (
                                                <div key={u.id} className="flex items-center justify-between group p-1 hover:bg-slate-50 rounded transition-colors">
                                                    <div className="flex items-center space-x-2 flex-1">
                                                        <Checkbox id={u.id} checked={selectedUserIds.includes(u.id)} onCheckedChange={() => toggleUser(u.id)} />
                                                        <Label htmlFor={u.id} className="text-xs cursor-pointer font-medium text-slate-700 block flex-1">
                                                            {u.name || u.email}{u.position ? ` (${u.position})` : ''}
                                                        </Label>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditUser(u)}>
                                                        <Edit2 className="h-3 w-3 text-slate-400" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            })()
                        )}
                    </div>
                    <Button onClick={saveDefaultTeam} className="w-full mt-4 bg-slate-900 text-white" disabled={loading}>Uložiť zmeny v tíme</Button>
                </CardContent>
            </Card>

            <UserDialog
                open={userDialogOpen}
                onOpenChange={setUserDialogOpen}
                editingUser={editingUser}
                onSuccess={fetchUsers}
            />
        </>
    )
}

