import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientsList } from "@/components/clients-list"
import { TeamList } from "@/components/team-list"
import { AgencySettings } from "@/components/agency-settings"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default function AgencyPage() {
  const session = getSession()
  
  if (!session) {
      redirect('/login')
  }

  // Kreatívec sem vôbec nesmie vstúpiť
  if (session.role === 'CREATIVE') {
    redirect('/')
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Administrácia</h2>
        <p className="text-muted-foreground text-sm font-medium">Správa klientskej bázy, tímu a firemných nastavení.</p>
      </div>

      <Tabs defaultValue="clients" className="space-y-6">
        <div className="border-b">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger value="clients" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-xs font-bold uppercase tracking-widest transition-all">
                    Klienti
                </TabsTrigger>
                <TabsTrigger value="team" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-xs font-bold uppercase tracking-widest transition-all">
                    Tím / Užívatelia
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-xs font-bold uppercase tracking-widest transition-all">
                    Moja Agentúra
                </TabsTrigger>
            </TabsList>
        </div>

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