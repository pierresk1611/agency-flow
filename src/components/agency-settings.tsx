'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Save, Building, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AgencySettings({ readOnly = false }: { readOnly?: boolean }) { // Accept readOnly prop if passed
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])

  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    companyId: '',
    vatId: '',
    address: '',
    email: '',

  })

  useEffect(() => {
    // Parallel fetch: settings + potential manager candidates
    Promise.all([
      fetch('/api/agency').then(res => res.json()),
      fetch('/api/agency/users?role=ACCOUNT').then(res => res.json()) // Fetch accounts only
    ]).then(([agencyData, accountsData]) => {
      if (agencyData && !agencyData.error) {
        setForm({
          name: agencyData.name || '',
          logoUrl: agencyData.logoUrl || '',
          companyId: agencyData.companyId || '',
          vatId: agencyData.vatId || '',
          address: agencyData.address || '',
          email: agencyData.email || '',

        })
      }
      if (Array.isArray(accountsData)) {
        setAccounts(accountsData)
      }
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    // Convert 'TRAFFIC_ONLY' back to null for DB
    const payload = {
      ...form,
      ...form,
    }

    try {
      const res = await fetch('/api/agency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        alert("Nastavenia úspešne uložené!")
        router.refresh()
      }
    } catch (e) {
      console.error(e)
      alert("Chyba pri ukladaní")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Načítavam nastavenia agentúry...</div>

  return (
    <div className="grid gap-6">


      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Profil Agentúry</CardTitle>
          </div>
          <CardDescription>Základná identita vášho AgencyFlow.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="agency-name">Názov agentúry</Label>
              <Input id="agency-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={readOnly} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo-url">Logo URL (odkaz na obrázok)</Label>
              <Input id="logo-url" placeholder="https://..." value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} disabled={readOnly} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-lg">Fakturačné údaje</CardTitle>
          </div>
          <CardDescription>Údaje potrebné pre internú administratívu.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="company-id">IČO</Label>
                <Input id="company-id" value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} disabled={readOnly} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vat-id">DIČ / IČ DPH</Label>
                <Input id="vat-id" value={form.vatId} onChange={e => setForm({ ...form, vatId: e.target.value })} disabled={readOnly} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Sídlo / Adresa</Label>
              <Input id="address" placeholder="Ulica, Mesto, PSČ" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} disabled={readOnly} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agency-email">Oficiálny kontaktný Email</Label>
              <Input id="agency-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={readOnly} />
            </div>
          </div>
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white min-w-[180px] h-11">
            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Uložiť všetky zmeny
          </Button>
        </div>
      )}
    </div>
  )
}