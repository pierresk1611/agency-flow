'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { sk } from 'date-fns/locale'

interface RunningTimerProps {
    startTime: string | Date
    totalPausedMinutes?: number
}

export function RunningTimer({ startTime, totalPausedMinutes = 0 }: RunningTimerProps) {
    const [duration, setDuration] = useState('')

    useEffect(() => {
        const updateTimer = () => {
            const start = new Date(startTime).getTime()
            const now = new Date().getTime()
            const diffMs = now - start - (totalPausedMinutes * 60 * 1000)

            const hours = Math.floor(diffMs / (1000 * 60 * 60))
            const minutes = Math.floor((diffMs / (1000 * 60)) % 60)

            setDuration(`${hours}h ${minutes}m`)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [startTime, totalPausedMinutes])

    return (
        <span className="font-mono text-xs font-black text-blue-600 tracking-tighter">
            {duration}
        </span>
    )
}
