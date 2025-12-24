export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl">AgencyFlow</h1>
            <span className="bg-red-600 text-xs px-2 py-0.5 rounded font-bold">SUPERADMIN</span>
        </div>
        <a href="/login" className="text-sm hover:underline text-slate-300">Odhlásiť sa</a>
      </nav>
      <main className="p-8">
        {children}
      </main>
    </div>
  )
}