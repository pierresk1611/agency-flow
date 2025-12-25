'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BellRing, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function NudgeButton({ timesheetId }: { timesheetId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleNudge = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/timesheets/${timesheetId}/nudge`, { method: 'PATCH' })
      if (res.ok) router.refresh()
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Button 
      onClick={handleNudge} 
      variant="ghost" 
      size="sm" 
      disabled={loading}
      className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <BellRing className="h-3 w-3 mr-1" />}
      URGOVAŤ
    </Button>
  )
}