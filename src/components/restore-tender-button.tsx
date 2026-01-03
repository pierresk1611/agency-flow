'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function RestoreTenderButton({ tenderId, slug }: { tenderId: string, slug: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleRestore = async () => {
        if (!confirm("Naozaj chcete vrátiť tento tender do aktívnych?")) return

        setLoading(true)
        try {
            const res = await fetch(`/api/tenders/${tenderId}/restore`, { method: 'POST' })
            if (res.ok) {
                router.refresh()
            } else {
                alert("Chyba pri obnove tendra.")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleRestore}
            disabled={loading}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold gap-2"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Vrátiť do Aktívnych
        </Button>
    )
}
