'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TimesheetActionsProps {
  id: string
  status: string
  isRunning: boolean
}

export function TimesheetActions({ id, status, isRunning }: TimesheetActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleReview = async (newStatus: 'APPROVED' | 'REJECTED') => {
    setLoading(true)
    try {
      const res = await fetch('/api/timesheets/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timesheetId: id, status: newStatus }),
      })
      
      if (res.ok) {
        setIsDone(true) // Okamžite skryť
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (status !== 'PENDING' || isRunning || isDone) {
    return null
  }

  return (
    <div className="flex gap-1 justify-end">
      <Button 
        onClick={() => handleReview('APPROVED')} 
        size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 border-green-200" disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button 
        onClick={() => handleReview('REJECTED')} 
        size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 border-red-200" disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      </Button>
    </div>
  )
}