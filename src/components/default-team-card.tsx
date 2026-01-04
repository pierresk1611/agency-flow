import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function DefaultTeamCard({ clientId, initialAssigneeIds }: { clientId: string; initialAssigneeIds: string[] }) {
    const [usersList, setUsersList] = useState<Array<{ id: string; name: string | null; email: string; role?: string; position?: string }>>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(initialAssigneeIds)

    useEffect(() => {
        fetch('/api/settings/users')
            .then(res => res.json())
            .then(data => setUsersList(data))
            .catch(err => console.error(err))
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
                // reload to reflect changes
                window.location.reload()
            }
        } catch (e) {
            console.error(e)
            alert('Failed to save default team')
        }
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/30 py-3">
                <CardTitle className="text-lg">Predvolený tím</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid gap-2">
                    {(() => {
                        const grouped: Record<string, Array<(typeof usersList)[0]>> = {}
                        usersList.forEach(u => {
                            const key = u.role || u.position || 'Ostatné'
                            if (!grouped[key]) grouped[key] = []
                            grouped[key].push(u)
                        })
                        return Object.entries(grouped).map(([group, users]) => (
                            <div key={group} className="mb-4">
                                <div className="font-bold text-[10px] uppercase text-slate-400 mb-2 tracking-wider">{group}</div>
                                <div className="grid grid-cols-1 gap-1">
                                    {users.map(u => (
                                        <div key={u.id} className="flex items-center space-x-2 p-1 hover:bg-slate-50 rounded transition-colors">
                                            <Checkbox id={u.id} checked={selectedUserIds.includes(u.id)} onCheckedChange={() => toggleUser(u.id)} />
                                            <Label htmlFor={u.id} className="text-xs cursor-pointer font-medium text-slate-700">
                                                {u.name || u.email}{u.position ? ` (${u.position})` : ''}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    })()}
                </div>
                <Button onClick={saveDefaultTeam} className="mt-4 bg-slate-900 text-white" disabled={selectedUserIds.length === 0 && initialAssigneeIds.length === 0}>Uložiť tím</Button>
            </CardContent>
        </Card>
    )
}
