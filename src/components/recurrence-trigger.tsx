'use client'

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function RecurrenceTrigger() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function triggerRecurrence() {
        setLoading(true)
        try {
            const res = await fetch('/api/cron/recurrence')
            const data = await res.json()
            if (data.success) {
                alert(`Checked ${data.checked} jobs. Created ${data.created} new recurring jobs.`)
                router.refresh()
            } else {
                alert('Error: ' + data.error)
            }
        } catch (e) {
            alert('Failed to trigger recurrence')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="ghost" size="sm" onClick={triggerRecurrence} disabled={loading} title="Check Recurring Jobs">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
    )
}
