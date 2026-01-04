'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2, CheckCircle2, Mail } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
    const [formData, setFormData] = useState({ agencyName: '', adminName: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Chyba registrácie')

            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full text-center p-6 shadow-xl border-green-100">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 mb-2">Žiadosť odoslaná!</CardTitle>
                    <CardDescription className="text-base mb-6 text-slate-600">
                        Vašu registráciu sme úspešne prijali. Po schválení administrátorom (zvyčajne do 48 hodín) vám zašleme potvrdzovací e-mail a budete môcť začať využívať svoj 14-dňový trial.
                    </CardDescription>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">Späť na prihlásenie</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-blue-600">
                <CardHeader className="space-y-1 text-center pb-6">
                    <CardTitle className="text-2xl font-black text-slate-900">Registrácia Agentúry</CardTitle>
                    <CardDescription>Vytvorte si pracovný priestor v AgencyFlow</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && <div className="p-3 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded text-center">{error}</div>}

                        <div className="space-y-2">
                            <Label>Názov Agentúry</Label>
                            <Input
                                value={formData.agencyName}
                                onChange={e => setFormData({ ...formData, agencyName: e.target.value })}
                                placeholder="Napr. Creative Studio s.r.o."
                                required
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Meno Administrátora</Label>
                            <Input
                                value={formData.adminName}
                                onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                placeholder="Vaše meno a priezvisko"
                                required
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Prihlasovací Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="admin@firma.sk"
                                required
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Heslo</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                                className="h-10"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-2">
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 font-bold text-base shadow-md transition-all" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Odoslať žiadosť o registráciu'}
                        </Button>

                        <div className="text-center text-sm text-slate-500">
                            Už máte účet? <Link href="/login" className="text-blue-600 hover:underline font-semibold">Prihlásiť sa</Link>
                        </div>

                        {/* --- NOVÁ INFORMÁCIA NA SPODKU --- */}
                        <div className="mt-4 pt-5 border-t border-slate-100 w-full text-center space-y-2">
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Dôležité informácie</p>
                            <div className="text-xs text-slate-500 leading-relaxed px-2">
                                <p>Schválenie registrácie môže trvať <strong className="text-slate-700">48 hodín</strong>.</p>
                                <p>Získavate <strong className="text-slate-700">14 dní zadarmo</strong> (s možnosťou predĺženia).</p>
                            </div>
                            <div className="pt-2">
                                <a href="mailto:agencyflowapp@gmail.com" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium">
                                    <Mail className="h-3 w-3" /> agencyflowapp@gmail.com
                                </a>
                            </div>
                        </div>

                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
