'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LogIn, KeyRound, Loader2, Users, Infinity, Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface User {
    id: string; email: string; role: string; active: boolean;
}

interface Agency {
    id: string
    name: string
    slug: string
    status: string
    subscriptionPlan: 'TRIAL' | 'FULL'
    trialEndsAt: string | null
    _count: {
        users: number
    }
}

export default function AgencyAdminDetail({ params }: { params: { agencyId: string } }) {
    const router = useRouter()
    const [agency, setAgency] = useState<Agency | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [impersonating, setImpersonating] = useState(false)
    const [extending, setExtending] = useState(false)
    const [extendDays, setExtendDays] = useState('14')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [usersRes, agencyRes] = await Promise.all([
                fetch(`/api/superadmin/agencies/${params.agencyId}/users`),
                fetch(`/api/superadmin/agencies/${params.agencyId}`)
            ])
            const usersData = await usersRes.json()
            const agencyData = await agencyRes.json()

            if (Array.isArray(usersData)) setUsers(usersData)
            if (agencyData && !agencyData.error) setAgency(agencyData)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [params.agencyId])

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

    const handleExtend = async (plan?: 'FULL') => {
        setExtending(true)
        try {
            const body: any = {}
            if (plan === 'FULL') body.plan = 'FULL'
            else body.days = extendDays

            const res = await fetch(`/api/superadmin/agencies/${params.agencyId}/extend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            if (res.ok) {
                await fetchData()
                alert(plan === 'FULL' ? "Licencia bola prepnutá na FULL" : `Trial bol predĺžený o ${extendDays} dní.`)
            }
        } catch (e) { alert("Chyba pri predlžovaní") }
        finally { setExtending(false) }
    }

    if (loading && !agency) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
        </div>
    )

    const trialDaysLeft = agency?.trialEndsAt
        ? Math.ceil((new Date(agency.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* NEW HEADER DESIGN */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b">
                <div className="flex items-center gap-4">
                    <Link href="/superadmin">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border bg-white shadow-sm hover:bg-slate-50">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{agency?.name}</h1>
                            <Badge className={`${agency?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} border-none font-bold px-3 py-1`}>
                                {agency?.status === 'ACTIVE' ? 'Active' : 'Pending'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="bg-slate-100 text-slate-500 font-mono text-[10px] px-2 py-0.5 rounded tracking-tight">
                                {params.agencyId}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                <Users className="h-3.5 w-3.5" />
                                {agency?._count.users} users
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {/* LICENSE STATUS */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Licencie</span>
                        <div className="flex items-center gap-2">
                            {agency?.subscriptionPlan === 'FULL' ? (
                                <>
                                    <Infinity className="h-5 w-5 text-green-500" />
                                    <span className="text-xl font-black text-green-600">Full Version (Navždy)</span>
                                </>
                            ) : (
                                <>
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                    <span className="text-xl font-black text-blue-600">Trial ({trialDaysLeft} dní zostáva)</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-12 px-6 font-bold border-slate-300 hover:bg-slate-50">
                                    Predĺžiť Trial / Full
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Manažment Licencie</DialogTitle>
                                    <DialogDescription>Zmeňte dĺžku trialu alebo udeľte plnú verziu.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Počet dní na pridanie</label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={extendDays}
                                                onChange={e => setExtendDays(e.target.value)}
                                            />
                                            <Button onClick={() => handleExtend()} disabled={extending}>
                                                {extending ? <Loader2 className="animate-spin" /> : "Pridať dni"}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="border-t pt-4">
                                        <Button
                                            variant="destructive"
                                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold"
                                            onClick={() => handleExtend('FULL')}
                                            disabled={extending}
                                        >
                                            UDELIŤ FULL VERZIU (NAVŽDY)
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            onClick={() => setShowGodModeDialog(true)}
                            disabled={impersonating}
                            className="bg-red-600 hover:bg-red-700 text-white font-black h-12 px-8 shadow-xl tracking-wide"
                        >
                            {impersonating ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                            GOD MODE
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="shadow-2xl border-none ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-5 px-8">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        Zoznam prístupov v tejto agentúre
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="pl-8 py-4 font-bold uppercase text-[10px] tracking-widest">Uživateľ / Email</TableHead>
                                <TableHead className="py-4 font-bold uppercase text-[10px] tracking-widest text-center">Rola v systéme</TableHead>
                                <TableHead className="pr-8 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Manažment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id} className="hover:bg-slate-50/70 border-b border-slate-100 last:border-none group">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                                {u.email.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-700 text-base">{u.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={`
                                            ${u.role === 'ADMIN' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                u.role === 'ACCOUNT' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                    'bg-slate-50 text-slate-600 border-slate-200'}
                                            text-[10px] font-black uppercase tracking-widest border px-2 py-0.5
                                        `}>
                                            {u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-8 py-5">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => resetPassword(u.id)}
                                            className="h-9 font-bold text-slate-400 hover:text-slate-900 hover:bg-white border-transparent hover:border-slate-200 border"
                                        >
                                            <KeyRound className="h-4 w-4 mr-2" /> Reset hesla
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={showGodModeDialog} onOpenChange={setShowGodModeDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-red-600 flex items-center gap-2">
                            GOD MODE ⚠️
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 font-medium py-3">
                            Chystáte sa vstúpiť do tejto agentúry ako Superadmin s neobmedzeným prístupom.
                            Všetky vykonané zmeny budú reálne zapísané v databáze agentúry.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="ghost" onClick={() => setShowGodModeDialog(false)} className="font-bold text-slate-400">
                            Zrušiť
                        </Button>
                        <Button onClick={handleImpersonate} className="bg-red-600 hover:bg-red-700 h-12 px-8 font-black shadow-lg">
                            POTVRDIŤ VSTUP
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}