import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          AgencyFlow
        </h1>
        <p className="text-lg text-slate-600">
          Kompletný operačný systém pre reklamné agentúry.
          Manažujte projekty, financie a tím na jednom mieste.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/login">
            <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-slate-900 hover:bg-slate-800">
              Prihlásiť sa
            </Button>
          </Link>

          <Link href="/register">
            <Button variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg border-slate-300 hover:bg-white text-slate-900">
              Registrovať agentúru
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}