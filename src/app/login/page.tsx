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

      // Uloženie tokenu
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`

      // --- LOGIKA PRESMEROVANIA ---
      if (data.user.role === 'SUPERADMIN') {
          console.log("Presmerujem na Superadmina...")
          router.push('/superadmin')
      } else {
          console.log("Presmerujem na Dashboard...")
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
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-slate-900">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">AgencyFlow</CardTitle>
          <CardDescription className="text-center">
            Vstúpte do systému
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
              <Label htmlFor="email">Email</Label>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Heslo</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Prihlásiť sa'}
            </Button>
          </CardFooter>
        </form>
        <div className="px-6 pb-6 text-center text-xs text-gray-400">
          © 2025 AgencyFlow. Všetky práva vyhradené.
        </div>
      </Card>
    </div>
  )
}