import { getSession } from '@/lib/session'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, ArrowRight, BarChart3, Clock, Users, ShieldCheck } from 'lucide-react'


import { prisma } from '@/lib/prisma'

export default async function LandingPage() {
  const session = await getSession()
  let agencySlug = ''

  if (session?.agencyId) {
    const agency = await prisma.agency.findUnique({
      where: { id: session.agencyId },
      select: { slug: true }
    })
    if (agency) agencySlug = agency.slug
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 1. NAVBAR */}
      <nav className="border-b py-4 px-6 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="font-black text-xl italic tracking-tighter text-slate-900">
          Agency<span className="text-blue-600">Flow</span>
        </div>
        <div className="flex gap-4">
          {session ? (
            <Link href={session.role === 'SUPERADMIN' ? '/superadmin' : `/${agencySlug || session.agencyId}`}>
              <Button className="bg-slate-900 text-white font-bold">
                Otvoriť Aplikáciu <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="font-bold text-slate-600">Prihlásiť sa</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg">
                  Vytvoriť Agentúru
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto space-y-6">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight">
          Koniec chaosu <br /> v <span className="text-blue-600">Exceloch.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Kompletný operačný systém pre reklamné agentúry.
          Timesheety, Traffic, Schvaľovanie a Reporty na jednom mieste.
          <strong>Registrujte sa na DEMO verziu a otestujte AgencyFlow v plnej verzii.</strong>
        </p>
        <p className="text-sm text-blue-600 font-medium">
          🎁 Tip: Pre testerov platí špeciálna zľava pri ostrom spustení.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/register">
            <Button size="lg" className="h-14 px-8 text-lg bg-slate-900 text-white font-bold hover:scale-105 transition-transform">
              Začať zadarmo
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold">
              Ako to funguje?
            </Button>
          </Link>
        </div>
      </section>

      {/* 3. PROBLEM VS SOLUTION (Excel vs App) */}
      <section className="py-20 bg-slate-50 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Prečo prejsť z Excelu?</h2>
            <p className="text-slate-500 mt-2">Rozdiel je v automatizácii a prehľade.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* EXCEL */}
            <Card className="border-red-100 shadow-sm bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-6 w-6" /> Bežný Excel / Tabuľky
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <li className="flex gap-2 text-slate-700"><span className="text-red-500">✕</span> Manuálne a chybové zadávanie dát</li>
                <li className="flex gap-2 text-slate-700"><span className="text-red-500">✕</span> Žiadne notifikácie o deadlineoch</li>
                <li className="flex gap-2 text-slate-700"><span className="text-red-500">✕</span> Ťažké reportovanie ziskovosti</li>
                <li className="flex gap-2 text-slate-700"><span className="text-red-500">✕</span> Chaos vo verziách súborov</li>
              </CardContent>
            </Card>

            {/* AGENCY FLOW */}
            <Card className="border-green-100 shadow-xl bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">Odporúčané</div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-6 w-6" /> AgencyFlow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <li className="flex gap-2 text-slate-900 font-medium"><span className="text-green-500">✓</span> Traffic manažment vyťaženosti</li>
                <li className="flex gap-2 text-slate-900 font-medium"><span className="text-green-500">✓</span> Finančné reporty na jeden klik</li>
                <li className="flex gap-2 text-slate-900 font-medium"><span className="text-green-500">✓</span> Notifikácie a schvaľovanie práce</li>
                <li className="flex gap-2 text-slate-900 font-medium"><span className="text-green-500">✓</span> Stopky a automatické timesheety</li>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. FEATURES GRID */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Všetko pod jednou strechou</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={ArrowRight}
            title="Rýchla implementácia"
            desc="Žiadne zložité nastavovanie. Registrácia Vám zaberie len 5 minút, po schválení môžete začať okamžite."
          />
          <FeatureCard
            icon={CheckCircle2}
            title="Job Pipeline"
            desc="Prehľad všetkých zákaziek od zadania (Brief) až po odovzdanie (Done)."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Schvaľovací proces"
            desc="Account manažér musí schváliť každý odpracovaný čas pred fakturáciou."
          />
          <FeatureCard
            icon={BarChart3}
            title="Finančné Reporty"
            desc="Okamžitý prehľad o tom, ktorý klient je ziskový a kde prerábate peniaze."
          />
          <FeatureCard
            icon={Users}
            title="Traffic Manažment"
            desc="Vidíte, kto je preťažený a kto má voľno. Presúvajte úlohy jedným klikom."
          />
          <FeatureCard
            icon={Clock}
            title="Smart Timesheety"
            desc="Kreatívci môžu využiť presné stopky alebo zadávať čas na zákazkách manuálne."
          />
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-10 border-t bg-slate-50 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AgencyFlow. Všetky práva vyhradené.</p>
        <div className="flex justify-center gap-4 mt-4">
          <Link href="#" className="hover:text-slate-900">Podmienky používania</Link>
          <Link href="#" className="hover:text-slate-900">Ochrana súkromia</Link>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 border rounded-xl hover:shadow-lg transition-all hover:border-blue-200 group bg-white">
      <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}