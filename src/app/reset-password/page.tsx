'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Heslá sa nezhodujú')
            return
        }
        if (password.length < 6) {
            setError('Heslo musí mať aspoň 6 znakov')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Chyba v procese obnovy')
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return <div className="p-4 text-center text-red-500">Chýba reset token.</div>
    }

    return (
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-slate-900 rounded-xl">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold">Nové heslo</CardTitle>
                <CardDescription>Zadajte svoje nové heslo</CardDescription>
            </CardHeader>
            <CardContent>
                {success ? (
                    <div className="text-center space-y-4">
                        <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                            Heslo bolo úspešne zmenené. Budete presmerovaný...
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-xs font-bold text-red-600 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="pass">Nové heslo</Label>
                            <Input
                                id="pass"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">Potvrdenie hesla</Label>
                            <Input
                                id="confirm"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full bg-slate-900" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Zmeniť heslo'}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    )

}

export default function ResetPasswordPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}
