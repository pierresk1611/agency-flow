'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Clock, Users, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-sky-500',
  },
  {
    label: 'Joby & Kampane',
    icon: Briefcase,
    href: '/dashboard/jobs',
    color: 'text-violet-500',
  },
  {
    label: 'Timesheety',
    icon: Clock,
    href: '/dashboard/timesheets',
    color: 'text-pink-700',
  },
  {
    label: 'Agentúra',
    icon: Users,
    href: '/dashboard/agency',
    color: 'text-orange-700',
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold">
            Agency<span className="text-blue-500">Flow</span>
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition',
                pathname === route.href ? 'text-white bg-white/10' : 'text-zinc-400'
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn('h-5 w-5 mr-3', route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="px-3 py-2">
        <Button 
            variant="ghost" 
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10"
            onClick={() => {
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
                window.location.href = "/login"
            }}
        >
            <LogOut className="h-5 w-5 mr-3" />
            Odhlásiť sa
        </Button>
      </div>
    </div>
  )
}