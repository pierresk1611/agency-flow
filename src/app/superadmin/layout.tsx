import Link from 'next/link'
import { SuperAdminNav } from './SuperAdminNav'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Edit2, Clock } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'SUPERADMIN') {
    redirect('/login')
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-8">
          <Link href="/superadmin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <h1 className="font-bold text-xl">AgencyFlow</h1>
            <span className="bg-red-600 text-xs px-2 py-0.5 rounded font-bold">SUPERADMIN</span>
          </Link>

          <SuperAdminNav />
        </div>
        <a href="/login" className="text-sm hover:underline text-slate-300">Odhlásiť sa</a>
      </nav>
      <main className="p-8">
        {children}
      </main>
    </div>
  )
}