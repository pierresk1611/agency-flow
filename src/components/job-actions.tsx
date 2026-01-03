'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Archive, RotateCcw } from 'lucide-react'

export function JobActions({ jobId, isArchived }: { jobId: string; isArchived?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleArchive = async () => {
    if (!confirm('Naozaj chcete uzavrieť tento job? Presunie sa do archívu.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/archive`, { method: 'PATCH' })
      const data = await res.json()

      if (res.ok) {
        router.push(window.location.pathname.replace(/\/jobs\/.*/, '/jobs'))
        router.refresh()
      } else {
        alert(`Chyba pri uzatváraní: ${data.error || 'Neznáma chyba'}`)
        console.error('Archive error:', data)
      }
    } catch (e) {
      console.error('Archive exception:', e)
      alert('Chyba pri uzatváraní: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm('Naozaj chcete obnoviť tento job?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/restore`, { method: 'PATCH' })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Chyba pri obnove')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (isArchived) {
    return (
      <Button onClick={handleRestore} disabled={loading} variant="outline" size="sm" className="gap-2">
        <RotateCcw className="h-4 w-4" />
        Obnoviť Job
      </Button>
    )
  }

  return (
    <Button onClick={handleArchive} disabled={loading} variant="outline" size="sm" className="gap-2 text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50">
      <Archive className="h-4 w-4" />
      Uzavrieť Job
    </Button>
  )
}