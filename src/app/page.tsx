import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import {
  ArrowRight,
  BarChart3,
  Clock,
  Users,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Eye,
  Trophy,
  Layout,
  CheckCircle2,
  Mail
} from 'lucide-react'

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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">

      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-black italic tracking-tighter">
            Agency<span className="text-blue-600">Flow</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href={session.role === 'SUPERADMIN' ? '/superadmin' : `/${agencySlug || session.agencyId}`}>
                <Button className="font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                  Otvoriť Appku <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 hidden sm:block">
                  Prihlásenie
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105">
                    Vyskúšať zadarmo
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-24 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest mb-8 border border-blue-100 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Operačný systém pre agentúry
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-8 text-slate-900">
          Prestaňte riadiť firmu <br />
          v <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Exceli.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
          Kompletný systém pre <strong>menšie aj väčšie agentúry</strong>. Od zadania jobu cez traffic manažment až po schválenie výkazu a fakturáciu.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto font-bold shadow-xl">
              Začať 14-dňový Trial
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto border-slate-300 font-bold hover:bg-slate-50">
              Čo všetko dokáže?
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-400 font-medium uppercase tracking-wider">
          Bez kreditnej karty • Okamžitý prístup
        </p>
      </section>

      {/* --- PROBLEM / SOLUTION (ZOZNAM FUNKCIONALÍT) --- */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Všetko pod jednou strechou</h2>
            <p className="text-slate-500">Zabudnite na prepínanie medzi 5 rôznymi aplikáciami.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 text-center font-bold text-sm uppercase tracking-widest">
              AgencyFlow Standard
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-y-6 gap-x-12">
              <CheckItem text="Dokonalý prehľad medzi zákazkami a projektami" />
              <CheckItem text="Prehľad klientov a ich histórie" />
              <CheckItem text="Traffic manažment a presúvanie jobov" />
              <CheckItem text="Všetky potrebné reporty na jeden klik" />
              <CheckItem text="Notifikácie a schvaľovanie výkazov" />
              <CheckItem text="Stopky a automatické timesheety" />
              <CheckItem text="Diskusie priamo pri joboch (žiadne maily)" />
              <CheckItem text="Upozornenia na meškajúce joby" />
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID (DETAILNÉ VYSVETLENIE) --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="features">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Funkcie, ktoré reálne potrebujete</h2>
          <p className="text-lg text-slate-500">
            Navrhnuté ľuďmi z agentúry pre ľudí z agentúry. Žiadny zbytočný balast, len nástroje na zvýšenie efektivity a zisku.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          <FeatureCard
            icon={MessageSquare}
            color="text-blue-600"
            bg="bg-blue-50"
            title="Kontextová Komunikácia"
            desc="Koniec strateným mailom. Komentujte priamo pri zákazke. Všetky podklady, linky and diskusia sú tam, kde majú byť."
          />

          <FeatureCard
            icon={AlertTriangle}
            color="text-red-600"
            bg="bg-red-50"
            title="Strážca Deadlinov"
            desc="Systém vás upozorní na blížiace sa termíny. Vidíte presne, čo horí (Burning Tasks), skôr než bude neskoro."
          />

          <FeatureCard
            icon={Clock}
            color="text-emerald-600"
            bg="bg-emerald-50"
            title="Smart Plánovač"
            desc="Plánujte kapacity na 2 týždne dopredu. Stopky automaticky premenia prácu na timesheet a porovnajú plán s realitou."
          />

          <FeatureCard
            icon={Eye}
            color="text-violet-600"
            bg="bg-violet-50"
            title="Čistý Focus"
            desc="Každý člen tímu vidí len svoje úlohy. Kreatívcov nezaťažujú financie, manažéri majú naopak plný prehľad."
          />

          <FeatureCard
            icon={BarChart3}
            color="text-amber-600"
            bg="bg-amber-50"
            title="Okamžité Reporty"
            desc="Prehľadné grafy ziskovosti a vyťaženosti. Exporty výkazov pre klienta v slovenskom formáte na jeden klik."
          />

          <FeatureCard
            icon={Trophy}
            color="text-pink-600"
            bg="bg-pink-50"
            title="Tendre & Archív"
            desc="Separátny pipeline pre New Business. Vyhraté tendre jedným klikom preklopíte na ostrých klientov, staré sa archivujú."
          />

          <FeatureCard
            icon={Users}
            color="text-indigo-600"
            bg="bg-indigo-50"
            title="Traffic & Reassign"
            desc="Nestíha kolega? Jedným klikom požiadajte o presun jobu. Manažér to schváli a úloha sa presunie aj s históriou."
          />

          <FeatureCard
            icon={Layout}
            color="text-cyan-600"
            bg="bg-cyan-50"
            title="Intuitívne Rozhranie"
            desc="Žiadne zložité školenia. Jednoduché a čisté prostredie, v ktorom sa nový kolega zorientuje za 15 minút."
          />

          <FeatureCard
            icon={ShieldCheck}
            color="text-slate-600"
            bg="bg-slate-100"
            title="Schvaľovanie"
            desc="Dvojstupňová kontrola. Account manažér musí schváliť alebo vrátiť každý výkaz pred tým, než ide do fakturácie."
          />

        </div>
      </section>

      {/* --- CENNÍK / EARLY ACCESS (NOVÁ SEKCE) --- */}
      <section className="py-24 border-t border-slate-100 bg-slate-50" id="pricing">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block mb-4 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest rounded-full">
            Early Access Benefit
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-6 text-slate-900">
            Cenník je zatiaľ otvorený
          </h2>

          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200">
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Finálna cena služby je momentálne predmetom diskusií a ešte nie je pevne stanovená.
              Preto máme pre vás férovú ponuku:
            </p>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
              <p className="font-bold text-slate-900 mb-2">
                📢 Pre všetkých, ktorí sa zapoja v tejto testovacej fáze:
              </p>
              <p className="text-slate-600">
                Ponúkame <strong className="text-blue-600">neobmedzené predĺženie bezplatného členstva (Trial)</strong> až do momentu oficiálneho oznámenia cenníka.
              </p>
            </div>

            <div className="flex justify-center">
              <Link href="/register">
                <Button className="w-full sm:w-auto h-14 px-8 text-lg bg-slate-900 text-white font-bold shadow-xl hover:scale-105 transition-transform">
                  Využiť Early Access ponuku
                </Button>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <p>
                Schválenie registrácie môže trvať <strong className="text-slate-700">48 hodín</strong> (manuálna kontrola).
              </p>
              <div className="pt-1">
                <a href="mailto:agencyflowapp@gmail.com" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium">
                  <Mail className="h-3 w-3" /> agencyflowapp@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 text-center text-slate-400 text-sm bg-white border-t border-slate-100">
        <p className="mb-4 font-black text-slate-900 text-lg italic">Agency<span className="text-blue-600">Flow</span></p>
        <div className="flex justify-center gap-6 mb-6">
          <Link href="#" className="hover:text-slate-600 transition">Kontakt</Link>
          <Link href="#" className="hover:text-slate-600 transition">Podmienky</Link>
          <Link href="#" className="hover:text-slate-600 transition">GDPR</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Všetky práva vyhradené.</p>
      </footer>
    </div>
  )
}

// --- POMOCNÉ KOMPONENTY ---

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 bg-green-100 text-green-600 rounded-full p-1">
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <span className="font-bold text-slate-700">{text}</span>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color, bg }: { icon: any, title: string, desc: string, color: string, bg: string }) {
  return (
    <div className="p-8 border rounded-2xl hover:shadow-xl transition-all hover:border-blue-200 group bg-white flex flex-col items-start">
      <div className={`h-14 w-14 ${bg} ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-bold text-xl text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  )
}