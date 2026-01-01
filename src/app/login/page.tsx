'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // register UI state
  const [showRegister, setShowRegister] = useState(false)
  const [regAgency, setRegAgency] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState<string | null>(null)
  const [regError, setRegError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Chyba pri prihlásení')
      }

      // Uloženie tokenu do cookies
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;

      // REDIRECT LOGIKA
      if (data.user.role === 'SUPERADMIN') {
        router.push('/superadmin')
      } else if (data.user.agencySlug) {
        router.push(`/${data.user.agencySlug}`)
      } else {
        router.push('/')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Registration submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)
    setRegSuccess(null)

    // Basic client validation
    if (!regAgency || !regName || !regEmail || !regPassword) {
      setRegError('Vyplňte prosím všetky polia.')
      return
    }

    setRegLoading(true)
    try {
      const res = await fetch('/api/auth/register-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: regAgency,
          fullName: regName,
          email: regEmail,
          password: regPassword
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Chyba pri odoslaní registrácie')
      }
      setRegSuccess('Registrácia odoslaná. Superadmin ťa bude kontaktovať.')
      setRegAgency(''); setRegName(''); setRegEmail(''); setRegPassword('')
      setShowRegister(false)
    } catch (err: any) {
      setRegError(err.message || 'Nepodarilo sa odoslať')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-slate-900 rounded-xl overflow-hidden">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-2xl font-bold italic text-slate-900">AgencyFlow</CardTitle>
          <CardDescription>Vstúpte do svojho agentúrneho prostredia</CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@agentura.sk" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Prihlásiť sa'}
            </Button>

            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-500">Nemáte účet?</span>
              <Button variant="ghost" className="text-sm" onClick={() => router.push('/register')}>
                Registrovať sa
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
