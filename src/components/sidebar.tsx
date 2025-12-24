'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Clock, Users, LogOut, Settings, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Sidebar({ slug, role }: { slug: string; role: string }) {
  const pathname = usePathname()

  const routes = [
    { label: 'Dashboard', icon: LayoutDashboard, href: `/${slug}`, color: 'text-sky-500' },
    { label: 'Joby & Kampane', icon: Briefcase, href: `/${slug}/jobs`, color: 'text-violet-500' },
    { label: 'Timesheety', icon: Clock, href: `/${slug}/timesheets`, color: 'text-pink-700' },
  ]
  
  // ADMIN/TRAFFIC má vidieť Tendre, Nastavenia
  if (role === 'ADMIN' || role === 'TRAFFIC' || role === 'SUPERADMIN') {
      routes.push({ label: 'Tendre & Pitching', icon: Trophy, href: `/${slug}/tenders`, color: 'text-yellow-400' })
      routes.push({ label: 'Administrácia', icon: Users, href: `/${slug}/agency`, color: 'text-orange-400' })
  }
  // Ak je creative, vidí len tri základné (Dashboard, Joby, Timesheety)

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white border-r border-white/10 shadow-xl">
      <div className="px-3 py-2 flex-1">
        <Link href={`/${slug}`} className="flex items-center pl-3 mb-14 hover:opacity-80 transition">
          <h1 className="text-2xl font-bold tracking-tight">
            Agency<span className="text-blue-500">Flow</span>
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200',
                pathname === route.href ? 'text-white bg-white/20 shadow-sm' : 'text-zinc-400'
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
      <div className="px-3 py-4 border-t border-white/5">
        <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10 group"
          onClick={() => {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-5 w-5 mr-3 group-hover:text-red-400 transition-colors" /> Odhlásiť sa
        </Button>
      </div>
    </div>
  )
}