import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientsList } from "@/components/clients-list"
import { TeamList } from "@/components/team-list"
import { AgencySettings } from "@/components/agency-settings"
import { TrafficWorkloadManager } from "@/components/traffic-workload-manager"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

// KRITICKÁ POISTKA PRE VERCEL:
export const dynamic = 'force-dynamic'

export default function AgencyPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  
  if (!session) {
      redirect('/login')
  }

  // Ak je creative, nemá tu čo robiť
  if (session.role === 'CREATIVE') {
    redirect(`/${params.slug}`)
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase italic">Správa Agentúry</h2>
        <p className="text-muted-foreground text-sm font-medium">Prehľad kapacít, klientov a nastavení tímu.</p>
      </div>

      <Tabs defaultValue="traffic" className="space-y-6">
        <div className="border-b">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger value="traffic" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-bold uppercase tracking-widest transition-all">
                    Traffic / Kapacita
                </TabsTrigger>
                <TabsTrigger value="clients" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-bold uppercase tracking-widest transition-all">
                    Klienti
                </TabsTrigger>
                <TabsTrigger value="team" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-bold uppercase tracking-widest transition-all">
                    Kolegovia
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-bold uppercase tracking-widest transition-all">
                    Nastavenia
                </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="traffic" className="space-y-4 outline-none">
          <TrafficWorkloadManager />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4 outline-none">
          <ClientsList />
        </TabsContent>

        <TabsContent value="team" className="space-y-4 outline-none">
           <TeamList />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 outline-none">
            <AgencySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}