'use client'

import React, { useState, useEffect } from 'react'
// Force rebuild
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        agencyName: '',
        adminName: '',
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        // Check if token exists
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))
        if (token) {
            setIsLoggedIn(true)
        }
    }, [])

    const handleLogout = () => {
        document.cookie = 'token=; path=/; max-age=0; SameSite=Strict'
        setIsLoggedIn(false)
        router.refresh()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Registrácia zlyhala')
            }

            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
                <Card className="w-full max-w-md shadow-lg border-t-4 border-t-green-600 rounded-xl overflow-hidden">
                    <CardHeader className="space-y-1 pb-6 text-center">
                        <CardTitle className="text-2xl font-bold text-green-700">Žiadosť obdržaná</CardTitle>
                        <CardDescription>
                            Vaša registrácia bola úspešná.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <div className="p-4 bg-green-50 text-green-800 rounded-md text-sm">
                            Čakajte na schválenie administrátorom. O výsledku vás budeme informovať.
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white" onClick={() => router.push('/login')}>
                            Späť na prihlásenie
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-slate-900 rounded-xl overflow-hidden">
                <CardHeader className="space-y-1 pb-6 text-center">
                    <CardTitle className="text-2xl font-bold italic text-slate-900">Registrácia</CardTitle>
                    <CardDescription>Vytvorte si nový účet pre vašu agentúru</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {isLoggedIn && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm mb-4 flex flex-col gap-2">
                                <p className="font-bold">⚠️ Ste prihlásený v inom účte.</p>
                                <p>Pre registráciu novej agentúry sa odporúča odhlásiť.</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="self-start border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                                >
                                    Odhlásiť sa a pokračovať
                                </Button>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-md text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="agencyName">Názov agentúry</Label>
                            <Input
                                id="agencyName"
                                value={formData.agencyName}
                                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                                required
                                placeholder="Napr. Best Agency s.r.o."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminName">Vaše Meno a Priezvisko</Label>
                            <Input
                                id="adminName"
                                value={formData.adminName}
                                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                required
                                placeholder="Janko Hraško"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Emailová adresa</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="meno@agentura.sk"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Heslo</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                placeholder="Min. 6 znakov"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Odoslať žiadosť'}
                        </Button>

                        <div className="flex items-center justify-between gap-2 w-full">
                            <span className="text-sm text-slate-500">Už máte účet?</span>
                            <Link href="/login" className="text-sm font-medium text-slate-900 hover:underline">
                                Prihlásiť sa
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
