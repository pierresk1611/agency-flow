'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SubmitPlannerButtonProps {
  disabled?: boolean
}

export function SubmitPlannerButton({ disabled }: SubmitPlannerButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/planner/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        setIsDone(true)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (isDone) return null

  return (
    <Button
      onClick={handleSubmit}
      disabled={disabled || loading}
      className="bg-green-600 text-white hover:bg-green-700"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Odosielam…
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Odoslať na schválenie
        </>
      )}
    </Button>
  )
}
