import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientsList } from "@/components/clients-list"
import { TeamList } from "@/components/team-list"
import { AgencySettings } from "@/components/agency-settings"
import { TrafficWorkloadManager } from "@/components/traffic-workload-manager" // <--- IMPORT
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default function AgencyPage() {
  const session = getSession()
  
  if (session?.role === 'CREATIVE') {
    redirect('/')
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Agentúrna Správa</h2>
        <p className="text-muted-foreground text-sm font-medium">Nastavenia, ľudia a riadenie kapacity tímu.</p>
      </div>

      <Tabs defaultValue="traffic" className="space-y-6">
        <div className="border-b">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger value="traffic" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-bold uppercase tracking-widest">
                    Traffic / Kapacita
                </TabsTrigger>
                <TabsTrigger value="clients" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-bold uppercase tracking-widest">
                    Klienti
                </TabsTrigger>
                <TabsTrigger value="team" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-bold uppercase tracking-widest">
                    Kolegovia
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-bold uppercase tracking-widest">
                    Nastavenia
                </TabsTrigger>
            </TabsList>
        </div>

        {/* ZÁLOŽKA TRAFFIC (NOVÁ) */}
        <TabsContent value="traffic" className="space-y-4">
          <TrafficWorkloadManager />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientsList />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
           <TeamList />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
            <AgencySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}