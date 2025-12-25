'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ConvertTenderButton({ tenderId, slug }: { tenderId: string, slug: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleConvert = async () => {
    if (!confirm("GRATULUJEME K VÝHRE! Chcete tento tender preklopiť na reálneho klienta a spustiť job?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/tenders/${tenderId}/convert`, { method: 'POST' })
      if (res.ok) {
        alert("Úžasné! Tender bol úspešne skonvertovaný na Klienta. Nájdete ho v sekcii Agentúra.")
        router.push(`/${slug}/agency`) // Presmerujeme na zoznam klientov
        router.refresh()
      } else {
        alert("Chyba pri konverzii.")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleConvert} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 shadow-xl animate-bounce-slow">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
      VYHRALI SME TENDER!
    </Button>
  )
}