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

      // 1. Uloženie tokenu do cookies na 1 deň (OPRAVENÝ RIADOK)
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;

      // 2. INTELIGENTNÉ PRESMEROVANIE
      if (data.user.role === 'SUPERADMIN') {
          router.push('/superadmin')
      } else if (data.user.agencySlug) {
          router.push(`/${data.user.agencySlug}`)
      } else {
          router.push('/dashboard')
      }
      
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-slate-900 rounded-xl overflow-hidden">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-2xl font-bold">AgencyFlow</CardTitle>
          <CardDescription>
            Prihláste sa do svojho agentúrneho prostredia
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Emailová adresa</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="meno@agentura.sk"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Prihlásiť sa'}
            </Button>
            <div className="text-center text-[10px] text-gray-400 uppercase tracking-widest pt-2">
              Secure SaaS Environment
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}