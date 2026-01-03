'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Archive, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ArchiveTenderButton({ tenderId, slug }: { tenderId: string, slug: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleArchive = async () => {
        if (!confirm("Naozaj chcete tento tender archivovať (nevyhratý / ukončený)?")) return

        setLoading(true)
        try {
            const res = await fetch(`/api/tenders/${tenderId}/archive`, { method: 'POST' })
            if (res.ok) {
                router.push(`/${slug}/tenders`)
                router.refresh()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleArchive}
            disabled={loading}
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100 font-bold gap-2"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
            Archivovať (Nevyhraté)
        </Button>
    )
}
