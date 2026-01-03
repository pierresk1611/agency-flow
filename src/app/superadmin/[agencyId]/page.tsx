'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LogIn, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface User {
    id: string; email: string; role: string; active: boolean;
}

export default function AgencyAdminDetail({ params }: { params: { agencyId: string } }) {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [impersonating, setImpersonating] = useState(false)

    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/superadmin/agencies/${params.agencyId}/users`)
            const data = await res.json()
            if (Array.isArray(data)) setUsers(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchUsers() }, [params.agencyId])

    const [showGodModeDialog, setShowGodModeDialog] = useState(false)

    const handleImpersonate = async () => {
        setShowGodModeDialog(false)
        setImpersonating(true)
        try {
            const res = await fetch('/api/auth/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agencyId: params.agencyId })
            })
            if (res.ok) {
                const data = await res.json()
                document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`
                window.location.href = `/${data.slug}`
            }
        } catch (e) { alert("Chyba") }
        finally { setImpersonating(false) }
    }

    const resetPassword = async (userId: string) => {
        const newPass = prompt("Zadajte nové heslo:")
        if (!newPass) return
        await fetch(`/api/superadmin/agencies/${params.agencyId}/users`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, newPassword: newPass })
        })
        alert("Heslo bolo úspešne zmenené.")
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center border-b pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/superadmin"><Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button></Link>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Správa Inštancie</h2>
                        <p className="text-slate-400 font-mono text-[10px] mt-1 uppercase tracking-tighter">ID: {params.agencyId}</p>
                    </div>
                </div>
                <Button onClick={() => setShowGodModeDialog(true)} disabled={impersonating} className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-xl">
                    {impersonating ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                    VSTÚPIŤ DO AGENTÚRY (GOD MODE)
                </Button>
            </div>

            <Card className="shadow-lg border-none ring-1 ring-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4"><CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Užívatelia v tejto agentúre</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader><TableRow><TableHead className="pl-6">Email</TableHead><TableHead>Prístup</TableHead><TableHead className="text-right pr-6">Akcie</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {loading ? <TableRow><TableCell colSpan={3} className="text-center py-20 animate-pulse text-slate-400 font-medium">Načítavam členov...</TableCell></TableRow> :
                                users.map(u => (
                                    <TableRow key={u.id} className="hover:bg-slate-50/50">
                                        <TableCell className="pl-6 font-bold text-slate-700">{u.email}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">{u.role}</Badge></TableCell>
                                        <TableCell className="text-right pr-6 py-4">
                                            <Button size="sm" variant="secondary" onClick={() => resetPassword(u.id)} className="h-9 font-bold">
                                                <KeyRound className="h-4 w-4 mr-2" /> Reset Hesla
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={showGodModeDialog} onOpenChange={setShowGodModeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 font-bold">⚠️ GOD MODE Prístup</DialogTitle>
                        <DialogDescription>
                            Chystáte sa vstúpiť do tejto agentúry ako Superadmin s plným prístupom ku všetkým dátam a funkciám.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowGodModeDialog(false)}>
                            Zrušiť
                        </Button>
                        <Button onClick={handleImpersonate} className="bg-red-600 hover:bg-red-700">
                            Potvrdiť GOD MODE
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}