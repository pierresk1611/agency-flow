'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, Pause, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface TimerButtonProps {
  jobId: string
  initialStartTime?: string | null 
  initialIsPaused?: boolean
  initialPausedMinutes?: number
  initialLastPauseStart?: string | null
}

export function TimerButton({ 
    jobId, 
    initialStartTime, 
    initialIsPaused = false,
    initialPausedMinutes = 0,
    initialLastPauseStart
}: TimerButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [description, setDescription] = useState('')
  
  const [startTime, setStartTime] = useState<Date | null>(initialStartTime ? new Date(initialStartTime) : null)
  const [isPaused, setIsPaused] = useState(initialIsPaused)
  const [pausedMinutes, setPausedMinutes] = useState(initialPausedMinutes)
  
  const [elapsed, setElapsed] = useState('00:00:00')

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (startTime && !isPaused) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = now.getTime() - startTime.getTime() - (pausedMinutes * 60 * 1000)
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [startTime, isPaused, pausedMinutes])

  // Funkcia na volanie API
  const callApi = async (body: any) => {
    setLoading(true)
    try {
        console.log("Odosielam:", body) // Debug
        const res = await fetch('/api/timesheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        
        const data = await res.json()
        
        if (!res.ok) {
            alert(`Chyba: ${data.error || 'Neznáma chyba servera'}`)
            return null
        }
        return data
    } catch (e) { 
        console.error(e)
        alert("Nepodarilo sa spojiť so serverom.")
        return null
    } finally { 
        setLoading(false) 
    }
  }

  const handleTogglePause = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const data = await callApi({ jobId, action: 'TOGGLE_PAUSE' })
    if (data) {
        setIsPaused(data.status === 'paused')
        if (data.status === 'resumed') {
            setPausedMinutes(data.data.totalPausedMinutes)
        }
        router.refresh()
    }
  }

  const handleStopClick = () => {
    setShowStopDialog(true)
  }

  const sendStopRequest = async () => {
    const data = await callApi({ jobId, description })
    if (data) {
        setStartTime(null); setIsPaused(false); setPausedMinutes(0);
        setShowStopDialog(false); setDescription('');
        router.refresh()
    }
  }

  const startTimer = async () => {
    const data = await callApi({ jobId }) // Štart (bez akcie)
    if (data) {
        setStartTime(new Date(data.data.startTime))
        router.refresh()
    }
  }

  if (startTime) {
    return (
      <div className="flex items-center gap-2">
        <Button 
            onClick={handleStopClick}
            variant="destructive" 
            className={`${!isPaused ? 'animate-pulse' : ''} font-mono min-w-[120px] shadow-md`} 
            disabled={loading}
        >
            <Square className="mr-2 h-4 w-4 fill-current" />
            {elapsed}
        </Button>

        <Button
            onClick={handleTogglePause}
            variant="outline"
            className={`w-10 px-0 ${isPaused ? 'bg-amber-100 text-amber-700 border-amber-300' : 'text-slate-500'}`}
            disabled={loading}
            title={isPaused ? "Pokračovať" : "Pauza"}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
        </Button>

        <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Ukončiť prácu</DialogTitle>
                <DialogDescription>Popíšte vykonanú prácu.</DialogDescription>
            </DialogHeader>
            <div className="py-4"><Textarea placeholder="Napr. Úprava loga..." value={description} onChange={e => setDescription(e.target.value)} /></div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowStopDialog(false)}>Zrušiť</Button>
                <Button onClick={sendStopRequest} disabled={!description.trim() || loading} className="bg-slate-900 text-white">Uložiť</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <Button onClick={startTimer} className="bg-green-600 hover:bg-green-700 text-white shadow-md min-w-[140px]" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
        Štart Práce
    </Button>
  )
}