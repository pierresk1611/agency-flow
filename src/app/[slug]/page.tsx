import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Euro } from "lucide-react"

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  console.log(`--- FINAL DIAGNOSTIKA V.2 --- Užívateľ prichádza: ${session.role}, Agency: ${session.agencyId}`)

  try {
    const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
    if (!agency) return <div className="text-red-500 font-bold">CHYBA: Agentúra nenájdená!</div>;
    if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) redirect('/login');
    
    // POSLEDNÝ BOD PÁDU: POČÍTANIE TÍMU!
    const teamCount = await prisma.user.count({ 
      where: { agencyId: agency.id, active: true } 
    });

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-slate-900">MASTER DIAGNOSTIKA ÚSPEŠNÁ</h2>
        <p className="text-green-600 font-bold">Ak vidíte tento text, je to stabilné.</p>
        
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-slate-900 text-white"><CardContent className="pt-4">
                <p className="text-[10px] font-bold text-slate-400">STATUS</p>
                <div className="text-xl mt-1">LOGON SUCCEEDED</div>
            </CardContent></Card>
             <Card><CardContent className="pt-4"><p className="text-xs font-bold text-slate-500">Kolegovia (Iba count)</p>
                <div className="text-2xl font-bold">{teamCount}</div></CardContent>
            </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("DASHBOARD PADOL NA NAJNIŽŠEJ ÚROVNI:", error);
    return (
      <div className="p-4 bg-red-100 border border-red-500">
        <h3 className="text-lg text-red-700 font-bold">FATÁLNA CHYBA: Zlyhanie Databázy pri BASE FETCH!</h3>
        <p className="text-sm">Prosím, skontrolujte **DATABASE_URL** na Verceli.</p>
      </div>
    );
  }
}