'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building, Users, Mail, LayoutDashboard, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function SuperAdminNav() {
    const pathname = usePathname()
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const token = document.cookie
                    .split('; ')
                    .find((row) => row.startsWith('token='))
                    ?.split('=')[1]

                const res = await fetch('/api/superadmin/requests', {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                })
                if (res.ok) {
                    const data = await res.json()
                    setPendingCount(data.length)
                }
            } catch (e) {
                console.error('Failed to fetch pending requests', e)
            }
        }

        fetchPendingCount()
        // Optional: Refresh every 60 seconds
        const interval = setInterval(fetchPendingCount, 60000)
        return () => clearInterval(interval)
    }, [])

    const navItems = [
        { label: 'Agentúry', href: '/superadmin/agencies', icon: Building },
        { label: 'Žiadosti', href: '/superadmin/requests', icon: Users, showBadge: pendingCount > 0 },
        { label: 'Emailové šablóny', href: '/superadmin/emails', icon: Mail },
    ]

    return (
        <div className="flex items-center gap-6">
            <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all relative",
                                isActive
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                            {item.showBadge && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border-2 border-slate-900"></span>
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {pathname !== '/superadmin' && (
                <Link href="/superadmin">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1 px-2">
                        <ChevronLeft className="h-4 w-4" />
                        Späť na Prehľad
                    </Button>
                </Link>
            )}
        </div>
    )
}
