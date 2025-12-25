'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Clock, Users, LogOut, TrendingUp, Trophy, Building2, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Sidebar({ slug, role }: { slug: string; role: string }) {
  const pathname = usePathname()

  // Cesty sú teraz definované s dynamickým slugom a sú všetky na rovnakej úrovni
  const routes = [
    { label: 'Dashboard', icon: LayoutDashboard, href: `/${slug}`, color: 'text-sky-500' },
    { label: 'Plánovač', icon: CalendarDays, href: `/${slug}/planner`, color: 'text-emerald-500' },
    { label: 'Klienti', icon: Building2, href: `/${slug}/clients`, color: 'text-blue-500' },
    { label: 'Joby & Kampane', icon: Briefcase, href: `/${slug}/jobs`, color: 'text-violet-500' },
    { label: 'Traffic / Kapacita', icon: TrendingUp, href: `/${slug}/traffic`, color: 'text-orange-500' },
    { label: 'Timesheety', icon: Clock, href: `/${slug}/timesheets`, color: 'text-pink-700' },
  ]

  if (role !== 'CREATIVE') {
    routes.push({ label: 'Tendre & Pitching', icon: Trophy, href: `/${slug}/tenders`, color: 'text-yellow-400' })
    routes.push({ label: 'Administrácia', icon: Users, href: `/${slug}/agency`, color: 'text-slate-400' })
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white border-r border-white/10 shadow-xl">
      <div className="px-3 py-2 flex-1">
        <Link href={`/${slug}`} className="flex items-center pl-3 mb-10 hover:opacity-80 transition">
          <h1 className="text-xl font-bold italic">
            Agency<span className="text-blue-500 text-2xl">.</span>Flow
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => {
            // Logika pre aktiváciu linku: Presná zhoda alebo začiatok cesty (napr. /slug/jobs/id)
            const isActive = pathname === route.href || pathname.startsWith(route.href + '/');
            
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'text-sm group flex p-3 w-full justify-start font-bold cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition-all',
                  isActive ? 'text-white bg-white/20 shadow-sm' : 'text-zinc-400'
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn('h-5 w-5 mr-3', route.color)} />
                  {route.label}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="px-3 py-4 border-t border-white/10">
        <Button variant="ghost" classNa