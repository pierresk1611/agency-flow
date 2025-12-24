import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientsList } from "@/components/clients-list"
import { TeamList } from "@/components/team-list"
import { AgencySettings } from "@/components/agency-settings"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default function AgencyPage() {
  const session = getSession()
  
  // OCHRANA: Ak je niekto Creative, nesmie sem vstúpiť
  if (session?.role === 'CREATIVE') {
    redirect('/') // Hodíme ho na dashboard
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Agentúra</h2>
        <p className="text-muted-foreground">Správa vašich klientov, tímu a nastavení.</p>
      </div>

      <Tabs defaultValue="clients" className="space-y-6">
        <div className="border-b">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger value="clients" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-medium">
                    Klienti
                </TabsTrigger>
                <TabsTrigger value="team" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-medium">
                    Tím / Kolegovia
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-sm font-medium">
                    Nastavenia
                </TabsTrigger>
            </TabsList>
        </div>

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