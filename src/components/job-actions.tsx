'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function JobActions({ jobId, isArchived = false }: { jobId: string; isArchived?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleArchive = async () => {
    if (!confirm('Naozaj chcete archivovať tento job? Zmizne zo zoznamu aktívnych.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/archive`, { method: 'PATCH' })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Chyba pri archivácii')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm('Obnoviť tento job do aktívnych úloh?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/restore`, { method: 'PATCH' })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Chyba pri obnovení')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (isArchived) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRestore}
        disabled={loading}
        className="text-slate-400 hover:text-green-600 hover:bg-green-50"
        title="Obnoviť job"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleArchive}
      disabled={loading}
      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
      title="Archivovať job"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}