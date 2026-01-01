# Codebase Export

## File: src/.DS_Store

Error reading file: 'utf-8' codec can't decode byte 0xff in position 554: invalid start byte

## File: src/app/favicon.ico

[Binary File]

## File: src/app/.DS_Store

Error reading file: 'utf-8' codec can't decode byte 0x80 in position 3131: invalid start byte

## File: src/app/[slug].textClipping

Error reading file: 'utf-8' codec can't decode byte 0xd1 in position 8: invalid continuation byte

## File: src/app/superadmin/[agencyId]/page.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LogIn, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string; email: string; role: string; active: boolean;
}

export default function AgencyAdminDetail({ params }: { params: { agencyId: string } }) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/superadmin/agencies/${params.agencyId}/users`)
      const data = await res.json()
      if (Array.isArray(data)) setUsers(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [params.agencyId])

  const handleImpersonate = async () => {
    if(!confirm("Chcete sa prihlásiť do tejto agentúry ako GOD MODE?")) return
    setImpersonating(true)
    try {
        const res = await fetch('/api/auth/impersonate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agencyId: params.agencyId })
        })
        if (res.ok) {
            const data = await res.json()
            document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`
            window.location.href = `/${data.slug}` 
        }
    } catch (e) { alert("Chyba") }
    finally { setImpersonating(false) }
  }

  const resetPassword = async (userId: string) => {
      const newPass = prompt("Zadajte nové heslo:")
      if (!newPass) return
      await fetch(`/api/superadmin/agencies/${params.agencyId}/users`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId, newPassword: newPass })
      })
      alert("Heslo bolo úspešne zmenené.")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b pb-6">
            <div className="flex items-center gap-4">
                <Link href="/superadmin"><Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <div>
                    <h2 className="text-3xl font-black text-slate-900">Správa Inštancie</h2>
                    <p className="text-slate-400 font-mono text-[10px] mt-1 uppercase tracking-tighter">ID: {params.agencyId}</p>
                </div>
            </div>
            <Button onClick={handleImpersonate} disabled={impersonating} className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-xl">
                {impersonating ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                VSTÚPIŤ DO AGENTÚRY (GOD MODE)
            </Button>
        </div>

        <Card className="shadow-lg border-none ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50 border-b py-4"><CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Užívatelia v tejto agentúre</CardTitle></CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader><TableRow><TableHead className="pl-6">Email</TableHead><TableHead>Prístup</TableHead><TableHead className="text-right pr-6">Akcie</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={3} className="text-center py-20 animate-pulse text-slate-400 font-medium">Načítavam členov...</TableCell></TableRow> : 
                         users.map(u => (
                            <TableRow key={u.id} className="hover:bg-slate-50/50">
                                <TableCell className="pl-6 font-bold text-slate-700">{u.email}</TableCell>
                                <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">{u.role}</Badge></TableCell>
                                <TableCell className="text-right pr-6 py-4">
                                    <Button size="sm" variant="secondary" onClick={() => resetPassword(u.id)} className="h-9 font-bold">
                                        <KeyRound className="h-4 w-4 mr-2" /> Reset Hesla
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
```

## File: src/app/superadmin/layout.tsx

```typescript
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
```

## File: src/app/superadmin/page.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from '@/components/ui/badge'
import { Building, Plus, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Agency {
  id: string
  name: string
  slug: string
  createdAt: string
  _count: { users: number, clients: number }
}

export default function SuperAdminPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fetchAgencies = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/agencies')
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login'
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) setAgencies(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAgencies() }, [])

  const handleCreate = async () => {
    if (!name || !email || !password) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/superadmin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, adminEmail: email, adminPassword: password })
      })
      if (res.ok) {
        setOpen(false); setName(''); setEmail(''); setPassword('');
        await fetchAgencies()
      } else {
        const err = await res.json()
        alert(err.error || "Chyba")
      }
    } catch (e) { alert("Chyba spojenia") } 
    finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 text-[32px] tracking-tight">Správa platformy</h2>
          <p className="text-slate-500 text-sm">Prehľad všetkých agentúr v systéme</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold h-11 px-6 shadow-lg transition-all active:scale-95">
              <Plus className="h-5 w-5 mr-2" /> Nová Agentúra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vytvoriť novú agentúru</DialogTitle>
              <DialogDescription>Systém automaticky vygeneruje unikátnu URL adresu a vytvorí účet pre Admina.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Názov firmy</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Napr. Kreatívne Štúdio s.r.o." /></div>
              <div className="grid gap-2"><Label>Email hlavného admina</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@firma.sk" /></div>
              <div className="grid gap-2"><Label>Heslo pre admina</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={submitting} className="w-full bg-red-600 text-white h-11">
                {submitting ? <Loader2 className="animate-spin mr-2" /> : "Vytvoriť a aktivovať inštanciu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-xl border-none ring-1 ring-slate-200">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="hover:bg-slate-900">
              <TableHead className="pl-6 text-white font-bold uppercase text-[10px] tracking-widest">Agentúra / URL</TableHead>
              <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Tím</TableHead>
              <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Klienti</TableHead>
              <TableHead className="text-right pr-6 text-white font-bold uppercase text-[10px] tracking-widest">Akcia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 animate-pulse font-medium">Načítavam zoznam tenantov...</TableCell></TableRow> : 
             agencies.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400">Zatiaľ žiadne agentúry.</TableCell></TableRow> :
             agencies.map(a => (
              <TableRow key={a.id} className="hover:bg-slate-50 transition-colors group">
                <TableCell className="pl-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-base">{a.name}</span>
                    <span className="text-xs text-blue-600 font-mono font-medium tracking-tight">https://agency-flow.com/{a.slug}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center"><Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none"><Users className="h-3 w-3 mr-1.5" /> {a._count.users}</Badge></TableCell>
                <TableCell className="text-center font-bold text-slate-700">{a._count.clients}</TableCell>
                <TableCell className="text-right pr-6">
                  <Link href={`/superadmin/${a.id}`}>
                    <Button variant="outline" size="sm" className="h-9 border-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">Spravovať</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
```

## File: src/app/layout.tsx

```typescript
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

```

## File: src/app/api/timesheets/[timesheetId]/nudge/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: Request,
  { params }: { params: { timesheetId: string } }
) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updated = await prisma.timesheet.update({
      where: { id: params.timesheetId },
      data: { isUrgent: true }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Nudge failed' }, { status: 500 })
  }
}
```

## File: src/app/api/timesheets/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let userId: string
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      userId = decoded.userId
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, action, description } = body // action: 'TOGGLE_TIMER' | 'TOGGLE_PAUSE'

    if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 })

    let assignment = await prisma.jobAssignment.findFirst({
        where: { jobId, userId }
    })

    if (!assignment) {
        assignment = await prisma.jobAssignment.create({
            data: { jobId, userId, roleOnJob: 'Contributor' }
        })
    }

    const runningTimer = await prisma.timesheet.findFirst({
        where: { jobAssignmentId: assignment.id, endTime: null }
    })

    // --- LOGIKA: PAUZA / RESUME ---
    if (action === 'TOGGLE_PAUSE' && runningTimer) {
        const now = new Date()
        
        if (runningTimer.isPaused) {
            // RESUME: Vypočítaj koľko trvala pauza a pripočítaj ju k totalPausedMinutes
            const pauseDiffMs = now.getTime() - new Date(runningTimer.lastPauseStart!).getTime()
            const pauseMinutes = Math.round(pauseDiffMs / 1000 / 60)

            const updated = await prisma.timesheet.update({
                where: { id: runningTimer.id },
                data: {
                    isPaused: false,
                    lastPauseStart: null,
                    totalPausedMinutes: runningTimer.totalPausedMinutes + pauseMinutes
                }
            })
            return NextResponse.json({ status: 'resumed', data: updated })
        } else {
            // PAUSE: Zapíš začiatok pauzy
            const updated = await prisma.timesheet.update({
                where: { id: runningTimer.id },
                data: {
                    isPaused: true,
                    lastPauseStart: now
                }
            })
            return NextResponse.json({ status: 'paused', data: updated })
        }
    }

    // --- LOGIKA: START / STOP ---
    if (runningTimer) {
        // ZASTAVIŤ
        const now = new Date()
        const totalElapsedMs = now.getTime() - new Date(runningTimer.startTime).getTime()
        
        // Ak zastavujeme počas pauzy, musíme pripočítať aj tú poslednú nedokončenú pauzu
        let finalPausedMinutes = runningTimer.totalPausedMinutes
        if (runningTimer.isPaused) {
            const lastPauseMs = now.getTime() - new Date(runningTimer.lastPauseStart!).getTime()
            finalPausedMinutes += Math.round(lastPauseMs / 1000 / 60)
        }

        const durationMinutes = Math.max(0, Math.round(totalElapsedMs / 1000 / 60) - finalPausedMinutes)

        const updated = await prisma.timesheet.update({
            where: { id: runningTimer.id },
            data: { 
                endTime: now, 
                durationMinutes,
                description: description || "",
                isPaused: false,
                lastPauseStart: null
            }
        })
        return NextResponse.json({ status: 'stopped', data: updated })
    } else {
        // SPUSTIŤ
        const newTimer = await prisma.timesheet.create({
            data: {
                jobAssignmentId: assignment.id,
                startTime: new Date(),
                status: 'PENDING',
                totalPausedMinutes: 0,
                isPaused: false
            }
        })
        return NextResponse.json({ status: 'started', data: newTimer })
    }

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}
```

## File: src/app/api/timesheets/review/route.ts

```typescript
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const currentUserId = decoded.userId

    const { timesheetId, status } = await request.json()
    if (!timesheetId || !['APPROVED','REJECTED'].includes(status)) 
      return NextResponse.json({ error: 'Neplatné údaje' }, { status: 400 })

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: { jobAssignment: { include: { user: true, job: true } } }
    })
    if (!timesheet) return NextResponse.json({ error: 'Timesheet nenájdený' }, { status: 404 })

    if (timesheet.status === status) 
      return NextResponse.json({ success: true, message: 'Already set' })

    if (status === 'APPROVED') {
      const hours = (timesheet.durationMinutes || 0) / 60
      const rate = timesheet.jobAssignment.user.hourlyRate ?? 0
      const amount = hours * rate

      await prisma.$transaction(async (tx) => {
        await tx.timesheet.update({
          where: { id: timesheetId },
          data: { status: 'APPROVED', approvedBy: currentUserId, approvedAt: new Date() }
        })
        await tx.budgetItem.upsert({
          where: { timesheetId },
          update: { hours, rate, amount },
          create: { jobId: timesheet.jobAssignment.jobId, timesheetId, hours, rate, amount }
        })
      })
    } else {
      await prisma.timesheet.update({
        where: { id: timesheetId },
        data: { status: 'REJECTED', approvedBy: currentUserId, approvedAt: new Date() }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Review error DETAIL:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

```

## File: src/app/api/traffic/requests/route.ts

```typescript
// app/api/traffic/requests/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Filter pre kreatívnych používateľov: iba joby, kde sú priradení
    const userJobFilter = session.role === 'CREATIVE'
      ? { assignments: { some: { userId: session.userId } } }
      : {}

    // Načítanie používateľov agentúry
    const rawUsers = await prisma.user.findMany({
      where: { 
        agencyId: session.agencyId,
        active: true
      },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        role: true,
        assignments: {
          where: { job: { status: { not: 'DONE' }, archivedAt: null, ...userJobFilter } },
          include: { 
            job: { 
              select: {
                id: true,
                title: true,
                deadline: true,
                campaign: { select: { name: true, client: { select: { name: true } } } }
              } 
            }
          }
        }
      }
    })

    // Serializácia dát (pre všetky dátumy)
    const serializedUsers = JSON.parse(JSON.stringify(rawUsers))

    // Zoskupenie podľa pozície
    const usersByPosition: Record<string, any[]> = {}
    serializedUsers.forEach((user: any) => {
      const pos = user.position || 'Ostatní'
      if (!usersByPosition[pos]) usersByPosition[pos] = []
      usersByPosition[pos].push(user)
    })

    return NextResponse.json({
      users: serializedUsers,
      usersByPosition
    })
  } catch (error: any) {
    console.error('CRITICAL TRAFFIC FETCH ERROR:', error)
    return NextResponse.json(
      { error: 'Chyba servera pri načítaní vyťaženosti: ' + error.message },
      { status: 500 }
    )
  }
}

```

## File: src/app/api/clients/[clientId]/archive/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    await prisma.client.update({
      where: { id: params.clientId },
      data: { archivedAt: new Date() }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Chyba' }, { status: 500 })
  }
}
```

## File: src/app/api/clients/[clientId]/notes/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, isPinned } = await request.json()

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text poznámky je povinný' }, { status: 400 })
    }

    // Overíme, že klient patrí do agentúry session
    const client = await prisma.client.findUnique({
      where: { id: params.clientId }
    })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const note = await prisma.clientNote.create({
      data: {
        text: text.trim(),
        isPinned: Boolean(isPinned),
        clientId: params.clientId,
        userId: session.userId
      },
      include: { user: true } // Zahrnutie informácií o užívateľovi
    })

    return NextResponse.json(note)
  } catch (error: any) {
    console.error('CREATE_CLIENT_NOTE_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Chyba servera' }, { status: 500 })
  }
}

```

## File: src/app/api/clients/[clientId]/campaigns/[campaignId]/jobs/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, deadline, budget } = body

    if (!title || !deadline) return NextResponse.json({ error: 'Názov a termín sú povinné' }, { status: 400 })

    const job = await prisma.job.create({
      data: {
        title,
        deadline: new Date(deadline),
        budget: parseFloat(budget || '0'),
        campaignId: params.campaignId,
        status: 'TODO'
      }
    })

    return NextResponse.json(job)

  } catch (error) {
    return NextResponse.json({ error: 'Chyba pri vytváraní jobu' }, { status: 500 })
  }
}
```

## File: src/app/api/clients/[clientId]/campaigns/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role === 'CREATIVE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Názov kampane je povinný' }, { status: 400 })
    }

    // Skontrolujeme, či klient patrí do agentúry
    const client = await prisma.client.findUnique({
      where: { id: params.clientId }
    })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        clientId: params.clientId,
        createdById: session.userId
      }
    })

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('CREATE_CAMPAIGN_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Chyba pri vytváraní kampane' }, { status: 500 })
  }
}

```

## File: src/app/api/clients/[clientId]/restore/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Overenie, že klient patrí do agentúry session
    const client = await prisma.client.findUnique({
      where: { id: params.clientId }
    })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.clientId },
      data: { archivedAt: null }
    })

    return NextResponse.json(updatedClient)
  } catch (error: any) {
    console.error('RESTORE_CLIENT_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Chyba pri obnovovaní klienta' }, { status: 500 })
  }
}

```

## File: src/app/api/clients/contacts/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, name, email, phone, position } = body

    if (!clientId || !name) {
      return NextResponse.json({ error: 'Chýba meno alebo ID klienta' }, { status: 400 })
    }

    // Overenie, či klient patrí do agentúry session
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const contact = await prisma.contactPerson.create({
      data: { clientId, name, email, phone, position }
    })

    return NextResponse.json(contact)
  } catch (error: any) {
    console.error('CREATE_CONTACT_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

```

## File: src/app/api/clients/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get('archived') === 'true'

    const where: any = {
      agencyId: session.agencyId,
      archivedAt: showArchived ? { not: null } : null
    }

    // ✅ KĽÚČOVÁ OPRAVA
    if (session.role === 'CREATIVE') {
      where.AND = [
        {
          campaigns: {
            some: {
              jobs: {
                some: {
                  assignments: {
                    some: { userId: session.userId }
                  }
                }
              }
            }
          }
        }
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { campaigns: true }
        }
      }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('CLIENTS_GET_ERROR:', error)
    return NextResponse.json(
      { error: 'Error fetching clients' },
      { status: 500 }
    )
  }
}

```

## File: src/app/api/clients/files/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, fileUrl, fileType } = body

    if (!clientId || !fileUrl) {
      return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    // Overenie, či klient patrí do agentúry užívateľa
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const file = await prisma.file.create({
      data: {
        clientId,
        fileUrl,
        fileType: fileType || 'DOCUMENT',
        uploadedBy: session.userId
      }
    })

    return NextResponse.json(file)
  } catch (error: any) {
    console.error('UPLOAD_FILE_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

```

## File: src/app/api/tenders/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { JobStatus } from '@prisma/client'

export async function PATCH(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    /* 1️⃣ AUTH */
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* 2️⃣ ROLE CHECK */
    const allowedRoles = ['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    /* 3️⃣ BODY */
    const body = await request.json()
    const { title, description, budget, status } = body

    /* 4️⃣ LOAD JOB + TENANT CHECK */
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        campaign: {
          client: {
            select: { agencyId: true },
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    /* 5️⃣ VALIDATION */
    const parsedBudget =
      budget !== undefined ? Number(budget) : undefined

    if (parsedBudget !== undefined && isNaN(parsedBudget)) {
      return NextResponse.json(
        { error: 'Invalid budget' },
        { status: 400 }
      )
    }

    if (status && !Object.values(JobStatus).i

```

## File: src/app/api/tenders/[tenderId]/files/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { tenderId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { fileUrl, fileType } = body

    if (!fileUrl || !fileUrl.trim()) {
      return NextResponse.json({ error: 'Chýba odkaz na súbor' }, { status: 400 })
    }

    // Overíme, či tender existuje
    const tenderExists = await prisma.tender.findUnique({
      where: { id: params.tenderId }
    })
    if (!tenderExists) {
      return NextResponse.json({ error: 'Tender nenájdený' }, { status: 404 })
    }

    // Vytvorenie záznamu súboru priradeného k tendru
    const file = await prisma.file.create({
      data: {
        tenderId: params.tenderId,
        fileUrl: fileUrl.trim(),
        fileType: fileType?.toUpperCase() || 'LINK',
        uploadedBy: session.userId
      }
    })

    return NextResponse.json(file)
  } catch (error: any) {
    console.error("TENDER FILE ERROR:", error)
    return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 })
  }
}

```

## File: src/app/api/tenders/[tenderId]/convert/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { tenderId: string } }
) {
  const session = await getSession()
  
  // Povolené role: ADMIN, TRAFFIC, SUPERADMIN, ACCOUNT
  const allowedRoles = ['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT']
  if (!session || !allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
  }

  try {
    // 1. Načítanie tendra
    const tender = await prisma.tender.findUnique({
      where: { id: params.tenderId },
      include: { assignments: true, files: true }
    })

    if (!tender) return NextResponse.json({ error: 'Tender nenájdený' }, { status: 404 })

    // 2. Transakcia: vytvorenie klienta, kampane, jobu a presun dát
    const result = await prisma.$transaction(async (tx) => {
      // A. Vytvorenie klienta
      const newClient = await tx.client.create({
        data: {
          name: tender.title.replace(/^Tender:\s*/i, ''),
          priority: 3,
          agencyId: tender.agencyId,
          scope: 'Získané z tendra'
        }
      })

      // B. Vytvorenie kampane
      const newCampaign = await tx.campaign.create({
        data: {
          name: 'Úvodná kampaň (po výhre)',
          clientId: newClient.id
        }
      })

      // C. Vytvorenie jobu
      const newJob = await tx.job.create({
        data: {
          title: tender.title,
          campaignId: newCampaign.id,
          deadline: tender.deadline,
          budget: tender.budget,
          status: 'IN_PROGRESS'
        }
      })

      // D. Presun assignments
      const tenderAssignments = await tx.tenderAssignment.findMany({
        where: { tenderId: tender.id }
      })

      if (tenderAssignments.length > 0) {
        const jobAssignments = tenderAssignments.map(ta => ({
          jobId: newJob.id,
          userId: ta.userId,
          roleOnJob: ta.roleOnJob
        }))
        await tx.jobAssignment.createMany({ data: jobAssignments })
      }

      // E. Presun súborov
      if (tender.files.length > 0) {
        const fileUpdates = tender.files.map(f => ({
          where: { id: f.id },
          data: { jobId: newJob.id, tenderId: null }
        }))
        for (const update of fileUpdates) {
          await tx.file.update(update)
        }
      }

      // F. Označenie tendra ako vyhratého
      await tx.tender.update({
        where: { id: tender.id },
        data: { isConverted: true, status: 'DONE' }
      })

      return { client: newClient, job: newJob }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("CONVERT TENDER ERROR:", error)
    return NextResponse.json({ error: 'Chyba pri konverzii: ' + error.message }, { status: 500 })
  }
}

```

## File: src/app/api/comments/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    // 1. Načítanie tokenu z cookies
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Overenie tokenu
    let userId: string
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      userId = decoded.userId
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 3. Načítanie dát z requestu
    const { jobId, text } = await request.json()
    if (!jobId || !text) {
      return NextResponse.json({ error: 'Chýba text alebo ID jobu' }, { status: 400 })
    }

    console.log(`Ukladám komentár: User=${userId}, Job=${jobId}, Text=${text}`)

    // 4. Vytvorenie komentára
    const comment = await prisma.comment.create({
      data: {
        jobId,
        userId,
        text
      },
      include: { user: true } // vrátime meno autora
    })

    return NextResponse.json(comment)

  } catch (error: any) {
    console.error('Comment error DETAIL:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

```

## File: src/app/api/reassign/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { assignmentId, targetUserId, reason } = body

    if (!assignmentId || !targetUserId || !reason) {
      return NextResponse.json({ error: 'Chýbajúce údaje žiadosti' }, { status: 400 })
    }

    // Voliteľná kontrola: assignment patrí užívateľovi alebo je vhodný
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } })
    if (!assignment) {
      return NextResponse.json({ error: 'Neplatný assignment' }, { status: 404 })
    }

    const newRequest = await prisma.reassignmentRequest.create({
      data: {
        assignmentId,
        targetUserId,
        requestByUserId: session.userId,
        reason,
        status: 'PENDING'
      }
    })

    return NextResponse.json(newRequest)
  } catch (error) {
    console.error("REASSIGN REQUEST ERROR:", error)
    return NextResponse.json({ error: 'Chyba servera' }, { status: 500 })
  }
}

```

## File: src/app/api/.DS_Store

Error reading file: 'utf-8' codec can't decode byte 0x80 in position 3131: invalid start byte

## File: src/app/api/auth/impersonate/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  // 1. Overenie Superadmina
  const session = await getSession() // ✅ must await
  if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
  }

  try {
    const body: { agencyId?: string } = await request.json()
    const { agencyId } = body

    if (!agencyId) return NextResponse.json({ error: 'Chýba ID agentúry' }, { status: 400 })

    // 2. Nájdeme agentúru, aby sme získali jej SLUG
    const targetAgency = await prisma.agency.findUnique({ 
        where: { id: agencyId } 
    })
    
    if (!targetAgency) return NextResponse.json({ error: 'Agentúra neexistuje' }, { status: 404 })

    // 3. Vygenerujeme GOD MODE Token
    const token = jwt.sign(
      {
        userId: session.userId,
        role: 'SUPERADMIN',
        agencyId: targetAgency.id
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    // 4. Vrátime token a slug
    return NextResponse.json({ 
        token, 
        slug: targetAgency.slug
    })

  } catch (error: any) {
    console.error("SUPERADMIN GODMODE ERROR:", error)
    return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 })
  }
}

```

## File: src/app/api/auth/login/route.ts

```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

// FORCE LOCAL CONNECTION
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_Aw56YZHlVUhO@ep-calm-violet-aggutujf-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
  },
})

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    const body: { email?: string, password?: string } = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email a heslo sú povinné' }, { status: 400 })
    }

    // 1. Načítanie užívateľa spolu s agentúrou
    const user = await prisma.user.findUnique({
      where: { email },
      include: { agency: true } // zabezpečíme prístup k slug
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Užívateľ neexistuje alebo je neaktívny' }, { status: 401 })
    }

    // 2. Overenie hesla
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Nesprávne heslo' }, { status: 401 })
    }

    // 3. Kontrola priradenia k agentúre
    if (!user.agencyId || !user.agency) {
      return NextResponse.json({ error: 'Užívateľ nie je priradený k žiadnej agentúre. Kontaktujte podporu.' }, { status: 403 })
    }

    // 4. Generovanie JWT tokenu
    const token = jwt.sign(
      { userId: user.id, role: user.role, agencyId: user.agencyId },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    // 5. Vrátenie tokenu a základných údajov pre front-end
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        agencySlug: user.agency.slug
      }
    })

  } catch (error: any) {
    console.error('LOGIN ERROR:', error)
    return NextResponse.json({ error: 'Interná chyba servera: ' + error.message }, { status: 500 })
  }
}
```

## File: src/app/api/planner/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const entries = await prisma.plannerEntry.findMany({
      where: { userId: session.userId },
      include: { job: { include: { campaign: { include: { client: true } } } } },
      orderBy: { date: 'asc' }
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error("PLANNER GET ERROR:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { jobId, date, minutes, title } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Chýba názov alebo dátum' }, { status: 400 })
    }

    // Iba ak existuje a nie je 'INTERNAL', uloží ID jobu
    const finalJobId = jobId && jobId !== 'INTERNAL' ? jobId : null

    const entry = await prisma.plannerEntry.create({
      data: {
        userId: session.userId,
        jobId: finalJobId,
        date: new Date(date),
        minutes: minutes ? parseInt(minutes) : 0,
        title: title
      }
    })

    return NextResponse.json(entry)
  } catch (e) {
    console.error("PLANNER POST ERROR:", e)
    return NextResponse.json({ error: 'Chyba servera pri ukladaní plánu.' }, { status: 500 })
  }
}

```

## File: src/app/api/planner/[id]/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function DELETE(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.plannerEntry.deleteMany({
      where: { id: params.id, userId: session.userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PLANNER DELETE ERROR:", error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

// NOVÉ: PATCH (pre úpravu)
export async function PATCH(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { jobId, date, minutes, title } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Chýba názov alebo dátum' }, { status: 400 })
    }

    const finalJobId = jobId && jobId !== 'INTERNAL' ? jobId : null;

    const updated = await prisma.plannerEntry.updateMany({
      where: { id: params.id, userId: session.userId },
      data: {
        jobId: finalJobId,
        date: new Date(date),
        minutes: minutes ? parseInt(minutes) : 0,
        title: title
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PLANNER PATCH ERROR:", error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

```

## File: src/app/api/agency/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession() // ✅ must await
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agency = await prisma.agency.findUnique({
    where: { id: session.agencyId } // konkrétna agentúra
  })
  
  if (!agency) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(agency)
}

export async function PATCH(request: Request) {
  const session = await getSession() // ✅ must await
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const updated = await prisma.agency.update({
    where: { id: session.agencyId }, // iba svoju agentúru
    data: body
  })

  return NextResponse.json(updated)
}
```

## File: src/app/api/agency/users/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // ✅ await session
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const includeJobs = searchParams.get('includeJobs') === 'true'

    const users = await prisma.user.findMany({
      where: { 
        agencyId: session.agencyId,
        active: true 
      },
      orderBy: { email: 'asc' },
      include: {
        assignments: includeJobs ? {
          where: { 
            job: { 
              status: { not: 'DONE' }, 
              archivedAt: null 
            } 
          },
          include: { 
            job: { 
              include: { 
                campaign: { 
                  include: { client: true } 
                } 
              } 
            } 
          }
        } : false
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("GET USERS ERROR:", error)
    return NextResponse.json({ error: 'Chyba pri načítaní dát: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // ✅ await session
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { email, name, password, role, position, hourlyRate, costRate } = body

    if (!email || !password || !role) 
      return NextResponse.json({ error: 'Chýbajú údaje' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) 
      return NextResponse.json({ error: 'Užívateľ s týmto emailom už existuje' }, { status: 400 })

    const passwordHash = await bcrypt.hash(password, 10)
    
    const newUser = await prisma.user.create({
      data: {
        email, 
        name, 
        position, 
        role, 
        passwordHash,
        hourlyRate: parseFloat(hourlyRate || '0'),
        costRate: parseFloat(costRate || '0'),
        agencyId: session.agencyId,
        active: true
      }
    })

    return NextResponse.json(newUser)
  } catch (error: any) {
    console.error("POST USERS ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

```

## File: src/app/api/agency/users/[userId]/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request, 
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession() // ✅ must await
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, position, role, hourlyRate, costRate, active } = body

    // 1. UČIACA SA LOGIKA PRE POZÍCIE
    if (typeof position === 'string' && position.length > 0) {
      const posArray = position.split(',').map(p => p.trim())
      for (const pName of posArray) {
        const exists = await prisma.agencyPosition.findFirst({
          where: { agencyId: session.agencyId, name: pName }
        })
        if (!exists) {
          await prisma.agencyPosition.create({
            data: { agencyId: session.agencyId, name: pName }
          })
        }
      }
    }

    // 2. AKTUALIZÁCIA UŽÍVATEĽA
    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: {
        name,
        position,
        role,
        hourlyRate: parseFloat(hourlyRate || '0'),
        costRate: parseFloat(costRate || '0'),
        active
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("PATCH USER ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE ostáva len na deaktiváciu
export async function DELETE(
  request: Request, 
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession() // ✅ must await
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.user.update({ where: { id: params.userId }, data: { active: false } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("DELETE USER ERROR:", e)
    return NextResponse.json({ error: 'Delete failed: ' + e.message }, { status: 500 })
  }
}

```

## File: src/app/api/agency/positions/route.ts

```typescript
// src/app/api/positions/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Načítame prvú agentúru (prípadne podľa nejakého slug alebo session)
    const agency = await prisma.agency.findFirst()

    if (!agency) {
      // Ak agentúra neexistuje, vrátime prázdne pole
      return NextResponse.json([], { status: 200 })
    }

    // Načítame pozície pre danú agentúru
    const positions = await prisma.agencyPosition.findMany({
      where: { agencyId: agency.id },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(positions)
  } catch (error) {
    console.error("Positions API Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

```

## File: src/app/api/agency/scopes/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const agency = await prisma.agency.findFirst()
    if (!agency) return NextResponse.json([], { status: 200 })

    const scopes = await prisma.agencyScope.findMany({
      where: { agencyId: agency.id },
      orderBy: { name: 'asc' } 
    })

    return NextResponse.json(scopes)
  } catch (error) {
    console.error("Scopes API Error:", error)
    return NextResponse.json({ error: 'Error fetching scopes' }, { status: 500 })
  }
}

```

## File: src/app/api/create-job/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession() // nezabudni await
    if (!session) 
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, deadline, budget, campaignId } = await request.json()

    // Overenie povinných polí
    if (!title || !deadline || !campaignId) {
      return NextResponse.json({ error: 'Názov, termín a kampaň sú povinné' }, { status: 400 })
    }

    const job = await prisma.job.create({
      data: {
        title,
        deadline: new Date(deadline),
        budget: parseFloat(budget || '0'),
        campaignId,
        status: 'TODO',
        createdById: session.userId // odporúčam logovať kto job vytvoril
      }
    })

    return NextResponse.json(job)

  } catch (error: any) {
    console.error("CREATE JOB ERROR:", error)
    return NextResponse.json({ error: error.message || 'Chyba servera pri vytváraní jobu.' }, { status: 500 })
  }
}

```

## File: src/app/api/superadmin/.DS_Store

Error reading file: 'utf-8' codec can't decode byte 0x86 in position 23: invalid start byte

## File: src/app/api/superadmin/agencies/[agencyId]/users/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request, 
  { params }: { params: { agencyId: string } }
) {
  const session = await getSession()
  if (session?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const users = await prisma.user.findMany({
      where: { agencyId: params.agencyId },
      orderBy: { email: 'asc' },
      select: { id: true, email: true, role: true, active: true }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Users GET Error:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request, 
  { params }: { params: { agencyId: string } }
) {
  const session = await getSession()
  if (session?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, role, newPassword } = body

    if (!userId) {
      return NextResponse.json({ error: 'Chýba userId' }, { status: 400 })
    }

    const dataToUpdate: { role?: string; passwordHash?: string } = {}
    if (role) dataToUpdate.role = role
    if (newPassword) dataToUpdate.passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Users PATCH Error:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

```

## File: src/app/api/superadmin/agencies/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .trim()
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, clients: true } } }
    })
    return NextResponse.json(agencies)
  } catch (error: any) {
    console.error("AGENCIES GET ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, adminEmail, adminPassword } = body

    if (!name || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Chýbajú údaje' }, { status: 400 })
    }

    const slug = generateSlug(name)

    // Skontrolujeme, či už neexistuje používateľ s týmto emailom
    const userExists = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (userExists) {
      return NextResponse.json({ error: `Email ${adminEmail} už existuje.` }, { status: 400 })
    }

    const newAgency = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({ data: { name, slug } })
      const hash = await bcrypt.hash(adminPassword, 10)
      await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash: hash,
          role: 'ADMIN',
          agencyId: agency.id,
          active: true
        }
      })
      return agency
    })

    return NextResponse.json(newAgency)
  } catch (error: any) {
    console.error("AGENCY POST ERROR:", error)
    return NextResponse.json({
      error: "Server Error",
      details: error.message,
      code: error.code || null
    }, { status: 500 })
  }
}

```

## File: src/app/api/exports/budget/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET() {
  try {
    const items = await prisma.budgetItem.findMany({
      include: {
        job: {
          include: { 
            campaign: { include: { client: true } } 
          }
        },
        timesheet: {
          include: {
            jobAssignment: { include: { user: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Hlavička CSV
    let csv = "Datum;Klient;Kampan;Job;Kreativec;Hodiny;Sadzba;Suma (EUR)\n"

    items.forEach(item => {
      const date = item.createdAt ? format(new Date(item.createdAt), 'dd.MM.yyyy') : ''
      const client = item.job?.campaign?.client?.name || ''
      const campaign = item.job?.campaign?.name || ''
      const job = item.job?.title || ''
      const user = item.timesheet?.jobAssignment?.user?.name || item.timesheet?.jobAssignment?.user?.email || ''
      const hours = item.hours != null ? item.hours.toFixed(2) : '0.00'
      const rate = item.rate != null ? item.rate.toFixed(2) : '0.00'
      const amount = item.amount != null ? item.amount.toFixed(2) : '0.00'

      csv += `${date};${client};${campaign};${job};${user};${hours};${rate};${amount}\n`
    })

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=rozpocty-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      }
    })

  } catch (error) {
    console.error("BUDGET CSV EXPORT ERROR:", error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

```

## File: src/app/api/campaigns/[campaignId]/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, deadline, budget } = await request.json()

    if (!title || !deadline) {
      return NextResponse.json({ error: 'Názov a termín sú povinné' }, { status: 400 })
    }

    const parsedDeadline = new Date(deadline)
    if (isNaN(parsedDeadline.getTime())) {
      return NextResponse.json({ error: 'Neplatný dátum' }, { status: 400 })
    }

    const parsedBudget = parseFloat(budget)
    const job = await prisma.job.create({
      data: {
        title,
        deadline: parsedDeadline,
        budget: isNaN(parsedBudget) ? 0 : parsedBudget,
        campaignId: params.campaignId,
        status: 'TODO',
        createdById: session.userId,
        agencyId: session.agencyId
      }
    })

    return NextResponse.json(job)
  } catch (error: any) {
    console.error("CREATE JOB ERROR:", error)
    return NextResponse.json({ error: error.message || 'Chyba servera pri vytváraní jobu.' }, { status: 500 })
  }
}
```

## File: src/app/api/jobs/reassign/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || !['ADMIN', 'TRAFFIC', 'SUPERADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
    }

    const body = await request.json()
    const { assignmentId, newUserId } = body

    if (!assignmentId || !newUserId) {
      return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    // Overenie, či priradenie existuje
    const existingAssignment = await prisma.jobAssignment.findUnique({
      where: { id: assignmentId }
    })
    if (!existingAssignment) {
      return NextResponse.json({ error: 'Priradenie neexistuje' }, { status: 404 })
    }

    // Aktualizácia priradenia
    const updated = await prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { userId: newUserId, reassignedBy: session.userId } // pridáme kto zmenil
    })

    return NextResponse.json(updated)
    
  } catch (error: any) {
    console.error("REASSIGN JOB ERROR:", error)
    return NextResponse.json({ error: error.message || 'Chyba pri prehadzovaní jobu' }, { status: 500 })
  }
}

```

## File: src/app/api/jobs/reassign/request/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession() // ✔ správne await
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assignmentId, targetUserId, reason } = body

    // Validácia vstupu
    if (!assignmentId || !targetUserId || !reason) {
      return NextResponse.json({ error: 'Chýbajúce údaje (assignment, cieľ, dôvod)' }, { status: 400 })
    }

    // Overenie, že assignment patrí k používateľovi alebo že je Creative
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } })
    if (!assignment) {
      return NextResponse.json({ error: 'Neplatný assignment' }, { status: 404 })
    }

    // Len Creative môže podávať reassign request (prípadne pridaj logiku pre adminov)
    if (session.role !== 'CREATIVE' && session.role !== 'ADMIN' && session.role !== 'TRAFFIC') {
      return NextResponse.json({ error: 'Nemáte oprávnenie podať žiadosť' }, { status: 403 })
    }

    const newRequest = await prisma.reassignmentRequest.create({
      data: {
        assignmentId,
        targetUserId,
        requestByUserId: session.userId,
        reason,
        status: 'PENDING'
      }
    })

    return NextResponse.json(newRequest)
  } catch (error) {
    console.error("REASSIGN REQUEST ERROR:", error)
    return NextResponse.json({ error: 'Chyba servera pri vytváraní žiadosti' }, { status: 500 })
  }
}

```

## File: src/app/api/jobs/assign/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { jobId, userId, roleOnJob } = body

    if (!jobId || !userId) {
      return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    // Overenie, či užívateľ ešte nie je priradený
    const existing = await prisma.jobAssignment.findFirst({
      where: { jobId, userId }
    })

    if (existing) {
      return NextResponse.json({ message: 'Užívateľ už je priradený' })
    }

    const assignment = await prisma.jobAssignment.create({
      data: {
        jobId,
        userId,
        roleOnJob: roleOnJob?.trim() || 'Contributor',
        assignedBy: session.userId // kto priradil
      }
    })

    return NextResponse.json(assignment)
    
  } catch (error: any) {
    console.error("JOB ASSIGNMENT ERROR:", error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

```

## File: src/app/api/jobs/[jobId]/archive/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: Request, 
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getSession()
    if (!session) 
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, budget, status, deadline } = body

    if (!title && !budget && !status && !deadline) {
      return NextResponse.json({ error: 'Nie sú poskytnuté žiadne údaje na aktualizáciu' }, { status: 400 })
    }

    const updated = await prisma.job.update({
      where: { id: params.jobId },
      data: {
        ...(title !== undefined && { title }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && { deadline: new Date(deadline) })
      }
    })

    return NextResponse.json(updated)

  } catch (error: any) {
    console.error("JOB PATCH ERROR:", error)
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 })
  }
}

```

## File: src/app/api/jobs/[jobId]/files/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getSession()
    if (!session) 
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    let { fileUrl, fileType, name } = body

    if (!fileUrl) 
      return NextResponse.json({ error: 'Chýba URL súboru' }, { status: 400 })

    // Ak link nezačína na http/https, pridáme https
    if (!/^https?:\/\//i.test(fileUrl)) {
      fileUrl = `https://${fileUrl}`
    }

    const file = await prisma.file.create({
      data: {
        jobId: params.jobId,
        name: name?.trim() || 'Odkaz',
        fileUrl: fileUrl.trim(),
        fileType: fileType || 'LINK',
        uploadedBy: session.userId
      }
    })

    return NextResponse.json(file)

  } catch (error: any) {
    console.error("JOB FILE POST ERROR:", error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

```

## File: src/app/api/notifications/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const notes = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return NextResponse.json(notes || [])
  } catch (error) {
    console.error("Notifications GET Error:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function PATCH() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications PATCH Error:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}
```

## File: src/app/fonts/GeistMonoVF.woff

[Binary File]

## File: src/app/fonts/GeistVF.woff

[Binary File]

## File: src/app/page.tsx

```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  // Okamžitý presun na login
  redirect('/login')
}
```

## File: src/app/[slug]/timesheets/page.tsx

```typescript
// app/[slug]/timesheets/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, AlertCircle, BellRing } from 'lucide-react'
import { TimesheetActions } from '@/components/timesheet-actions'
import { NudgeButton } from '@/components/nudge-button'

export const dynamic = 'force-dynamic'

export default async function TimesheetsPage({ params }: { params: { slug: string } }) {
  // ✅ await pre session
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  const timesheets = await prisma.timesheet.findMany({
    where: {
      jobAssignment: {
        userId: isCreative ? session.userId : undefined,
        job: { campaign: { client: { agencyId: agency.id } } }
      }
    },
    orderBy: [
      { isUrgent: 'desc' },
      { startTime: 'desc' }
    ],
    include: {
      jobAssignment: {
        include: {
          user: true,
          job: { include: { campaign: { include: { client: true } } } }
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic">
              {isCreative ? 'Moje výkazy' : 'Schvaľovanie práce'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isCreative ? 'Prehľad vašej odpracovanej práce.' : `Prehľad k schváleniu pre agentúru ${agency.name}.`}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-slate-50 text-[10px] font-black uppercase">
              <TableRow>
                <TableHead className="pl-6">Kedy / Kto</TableHead>
                <TableHead>Projekt</TableHead>
                <TableHead>Trvanie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic text-sm">
                    Zatiaľ žiadne záznamy.
                  </TableCell>
                </TableRow>
              ) : (
                timesheets.map((ts) => {
                  const isRunning = ts.endTime === null
                  return (
                    <TableRow
                      key={ts.id}
                      className={cn(
                        "hover:bg-slate-50/50",
                        ts.isUrgent && ts.status === 'PENDING' ? "bg-red-50/30" : ""
                      )}
                    >
                      <TableCell className="pl-6">
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-slate-700 text-sm">{format(new Date(ts.startTime), 'dd.MM.yyyy')}</div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {ts.jobAssignment.user?.name || ts.jobAssignment.user?.email?.split('@')[0] || 'N/A'}
                          </span>
                          {ts.description && <p className="text-[10px] text-slate-400 italic">"{ts.description}"</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-800">{ts.jobAssignment.job?.title || 'N/A'}</span>
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                            {ts.jobAssignment.job?.campaign?.client?.name || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isRunning ? (
                          <Badge variant="outline" className="animate-pulse border-blue-200 text-blue-700 font-bold">BEŽÍ...</Badge>
                        ) : (
                          <span className="font-mono text-xs font-black text-slate-600 tracking-tighter">
                            {Math.floor((ts.durationMinutes || 0) / 60)}h {(ts.durationMinutes || 0) % 60}m
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {ts.status === 'APPROVED' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold uppercase">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Schválené
                            </Badge>
                          )}
                          {ts.status === 'REJECTED' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase">
                              <XCircle className="h-3 w-3 mr-1" /> Zamietnuté
                            </Badge>
                          )}
                          {ts.status === 'PENDING' && !isRunning && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                ts.isUrgent ? "bg-red-600 text-white border-none animate-pulse" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                              )}
                            >
                              {ts.isUrgent ? <BellRing className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                              {ts.isUrgent ? 'URGENTNÉ' : 'ČAKÁ'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-2">
                          {isCreative && ts.status === 'PENDING' && !isRunning && !ts.isUrgent && (
                            <NudgeButton timesheetId={ts.id} />
                          )}
                          {!isCreative && (
                            <TimesheetActions id={ts.id} status={ts.status} isRunning={isRunning} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

```

## File: src/app/[slug]/traffic/page.tsx

```typescript
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { TrafficWorkloadManager } from '@/components/traffic-workload-manager'

export const dynamic = 'force-dynamic'

export default async function TrafficPage({ params }: { params: { slug: string } }) {
  // ✅ await pre session
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // Načítame základný zoznam užívateľov aktívnych v agentúre
  const users = await prisma.user.findMany({
    where: { agencyId: agency.id, active: true },
    orderBy: { position: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      role: true
    }
  })

  // Skupiny podľa pozície
  const groups: Record<string, typeof users> = {}
  users.forEach(u => {
    const pos = u.position || "Ostatní"
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(u)
  })
  
  // Jednoduchý zoznam pre TrafficWorkloadManager (ID, Name, Email)
  const allUsersSimpleList = users.map(u => ({ id: u.id, name: u.name, email: u.email }))

  return (
    <div className="space-y-8 pb-20">
      {/* Pre každý groupName renderujeme TrafficWorkloadManager */}
      <div className="space-y-12">
        {Object.entries(groups).map(([groupName, members]) => (
          <div key={groupName} className="space-y-4">
            <div className="h-px flex-1 bg-slate-200" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-4 py-1 border rounded-full whitespace-nowrap">
              {groupName} ({members.length})
            </h3>
            <div className="h-px flex-1 bg-slate-200" />

            <TrafficWorkloadManager
              initialUsers={members}
              allUsersList={allUsersSimpleList} // len ID, Name, Email
              role={session.role}
              currentUserId={session.userId}
              slug={params.slug}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

```

## File: src/app/[slug]/clients/[clientId]/page.tsx

```typescript
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Briefcase, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getSession } from '@/lib/session'
import { ContactPersonDialog } from '@/components/contact-person-dialog'
import { ClientFileDialog } from '@/components/client-file-dialog'
import { AddCampaignDialog } from '@/components/add-campaign-dialog'
import { AddJobDialog } from '@/components/add-job-dialog'
import { ClientNewsfeed } from '@/components/client-newsfeed'
import { format } from 'date-fns'

export default async function ClientDetailPage({ params }: { params: { slug: string, clientId: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const isCreative = session.role === 'CREATIVE'

  // Načítať klienta vrátane kampaní, jobov a súborov
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: {
      contacts: true,
      files: { orderBy: { createdAt: 'desc' } },
      notes: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      campaigns: {
        include: {
          jobs: {
            where: {
              archivedAt: null,
              ...(isCreative ? { assignments: { some: { userId: session.userId } } } : {})
            },
            orderBy: { deadline: 'asc' }
          },
          _count: { select: { jobs: true } }
        }
      }
    }
  })

  if (!client) return notFound()

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${params.slug}/clients`}>
            <Button variant="outline" size="icon" className="rounded-full shadow-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-900">{client.name}</h2>
              <Badge variant="outline" className="bg-slate-50">P{client.priority}</Badge>
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">
              {client.scope || "Bez definovaného rozsahu"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* NEWSFEED */}
          <div className="min-h-[400px]">
            <ClientNewsfeed clientId={client.id} initialNotes={client.notes} isReadOnly={isCreative} />
          </div>

          {/* KAMPANE */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-slate-50/30">
              <CardTitle className="text-lg">Kampane a Joby</CardTitle>
              {!isCreative && <AddCampaignDialog clientId={client.id} />}
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {client.campaigns.length === 0 ? (
                <p className="text-sm text-center py-10 text-slate-400 italic">Zatiaľ žiadne kampane.</p>
              ) : (
                client.campaigns.map(campaign => (
                  <div key={campaign.id} className="border rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                        <h4 className="font-bold text-slate-900">{campaign.name}</h4>
                      </div>
                      {!isCreative && <AddJobDialog campaignId={campaign.id} />}
                    </div>
                    <div className="divide-y">
                      {campaign.jobs.length === 0 ? (
                        <p className="text-[10px] text-slate-400 p-4 text-center italic">Žiadne joby.</p>
                      ) : (
                        campaign.jobs.map(job => (
                          <div key={job.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
                            <span className="text-sm font-medium text-slate-700">{job.title}</span>
                            <div className="flex items-center gap-6">
                              <span className="text-xs text-slate-500 font-mono">{format(new Date(job.deadline), 'dd.MM.yyyy')}</span>
                              <Badge variant="secondary" className="text-[10px] font-mono">{job.budget?.toFixed(0)} €</Badge>
                              <Link href={`/${params.slug}/jobs/${job.id}`}>
                                <Button variant="ghost" size="sm" className="text-blue-600 h-7 text-xs">Detail</Button>
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3 bg-slate-50/30">
              <CardTitle className="text-lg">Kontaktné osoby</CardTitle>
              {!isCreative && <ContactPersonDialog clientId={client.id} />}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                {client.contacts.map(contact => (
                  <div key={contact.id} className="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition">
                    <p className="font-bold text-slate-800 text-sm">{contact.name}</p>
                    <p className="text-[10px] text-blue-600 font-bold mb-3 uppercase tracking-tighter">{contact.position || 'Marketing'}</p>
                    <div className="space-y-1 text-xs text-slate-500 font-medium">
                      {contact.email && <div className="flex items-center gap-2">{contact.email}</div>}
                      {contact.phone && <div className="flex items-center gap-2">{contact.phone}</div>}
                    </div>
                  </div>
                ))}
                {client.contacts.length === 0 && <p className="text-xs text-center text-slate-400 italic">Žiadne kontakty.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50/30 py-3">
              <CardTitle className="text-lg text-blue-900">Tendre & Dokumenty</CardTitle>
              {!isCreative && <ClientFileDialog clientId={client.id} />}
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {client.files.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium truncate text-slate-700">{f.fileUrl}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><Download className="h-4 w-4" /></Button>
                </div>
              ))}
              {client.files.length === 0 && <p className="text-xs text-center text-slate-400 italic">Žiadne dokumenty.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

```

## File: src/app/[slug]/clients/page.tsx

```typescript
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { ClientsList } from '@/components/clients-list'

export const dynamic = 'force-dynamic'

export default async function AgencyClientsPage({ params }: { params: { slug: string } }) {
  // 1️⃣ Session (server-side)
  const session = await getSession()
  if (!session) redirect('/login')

  // 2️⃣ Získanie agentúry podľa slug
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // 3️⃣ Zistenie, či je používateľ len na čítanie
  const isReadOnly = session.role === 'CREATIVE'

  // 4️⃣ Posielame role a ID používateľa do komponentu ClientsList, aby vedel filtrovať
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-900 uppercase italic">Klienti</h2>
        <p className="text-muted-foreground text-sm font-medium">
          Prehľad firiem a klientsky newsfeed {isReadOnly ? '(len na čítanie)' : ''}
        </p>
      </div>
      
      <ClientsList 
        role={session.role} 
        userId={session.userId} 
        agencyId={agency.id} 
        readOnly={isReadOnly} 
      />
    </div>
  )
}

```

## File: src/app/[slug]/tenders/api/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request, { params }: { params: { tenderId: string } }) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await request.json()
    const { fileUrl, fileType } = body

    if (!fileUrl) return NextResponse.json({ error: 'Chýba URL' }, { status: 400 })

    const file = await prisma.file.create({
      data: {
        tenderId: params.tenderId, // <--- PRIRADENIE K TENDU
        fileUrl,
        fileType: fileType || 'DOCUMENT',
        uploadedBy: session.userId // Ukladáme ID prihláseného
      }
    })

    return NextResponse.json(file)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}
```

## File: src/app/[slug]/tenders/[tenderId]/page.tsx

```typescript
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Users, FileText, Link2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ConvertTenderButton } from '@/components/convert-tender-button'
import { EditTenderDescription } from '@/components/edit-tender-description'
import { AddTenderFileDialog } from '@/components/add-tender-file-dialog'

export default async function TenderDetailPage({ params }: { params: { slug: string, tenderId: string } }) {
  // 1. Session
  const session = await getSession()
  if (!session) redirect('/login')

  // 2. Načítanie tendra
  const tender = await prisma.tender.findUnique({
    where: { id: params.tenderId },
    include: {
      files: { orderBy: { createdAt: 'desc' } },
      assignments: { include: { user: true } },
      agency: true
    }
  })

  if (!tender || tender.agency.slug !== params.slug) return notFound()

  const canEdit = session.role !== 'CREATIVE'

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href={`/${params.slug}/tenders`}>
            <Button variant="outline" size="icon" className="rounded-full shadow-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{tender.title}</h2>
              {tender.isConverted 
                ? <Badge className="bg-green-600 text-white border-none px-3 font-bold uppercase">Vyhrané</Badge> 
                : <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 font-bold italic px-3">PITCH</Badge>
              }
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">ID: {tender.id.substring(0,8)}</p>
          </div>
        </div>
        {!tender.isConverted && canEdit && <ConvertTenderButton tenderId={tender.id} slug={params.slug} />}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* BRIEF */}
          <Card className="shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50 border-b py-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <CardTitle className="text-xs font-black uppercase tracking-widest">Zadanie / Brief</CardTitle>
              </div>
              {canEdit && <EditTenderDescription tenderId={tender.id} initialDescription={tender.description || ''} />}
            </CardHeader>
            <CardContent className="pt-6 px-8 pb-8 min-h-[150px] text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {tender.description || <p className="text-slate-400 italic text-center py-4">Zatiaľ nebolo pridané žiadne zadanie.</p>}
            </CardContent>
          </Card>

          {/* FILES */}
          <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 py-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-slate-400" />
                <CardTitle className="text-xs font-black uppercase tracking-widest">Podklady</CardTitle>
              </div>
              {canEdit && <AddTenderFileDialog tenderId={tender.id} />}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tender.files.length === 0 ? (
                  <p className="text-xs text-slate-400 py-10 col-span-2 text-center border border-dashed rounded-xl italic">Žiadne linky.</p>
                ) : tender.files.map(f => (
                  <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-xl bg-white group hover:border-blue-400 transition-all shadow-sm">
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate uppercase">{f.name || "Odkaz"}</span>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* TEAM */}
          <Card className="shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="bg-purple-900 text-white py-4 rounded-t-xl">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4" /> Pitch Team
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 px-6">
              {tender.assignments.map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-black uppercase">{(a.user.name || a.user.email).charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-800">{a.user.name || a.user.email.split('@')[0]}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{a.roleOnJob}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* DEADLINE + FEE */}
          <Card className="shadow-xl border-none ring-1 ring-slate-200">
            <CardContent className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] font-black uppercase">Deadline</span>
                <span className="text-sm font-black text-red-600 font-mono">{format(new Date(tender.deadline), 'dd.MM.yyyy')}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] font-black uppercase">Fee</span>
                <span className="text-lg font-black text-slate-900 font-mono">{tender.budget?.toLocaleString()} €</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

```

## File: src/app/[slug]/tenders/page.tsx

```typescript
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: {
    slug: string
  }
}

export default async function JobsPage({ params }: PageProps) {
  /* 1️⃣ SESSION */
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  /* 2️⃣ AGENCY */
  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug },
  })

  if (!agency) {
    notFound()
  }

  /* 3️⃣ ROLE LOGIC */
  const isCreative = session.role === 'CREATIVE'

  /* 4️⃣ FILTER – kreatívec vidí len svoje joby */
  const jobFilter = isCreative
    ? {
        assignments: {
          some: {
            userId: session.userId,
          },
        },
      }
    : {}

  /* 5️⃣ FETCH JOBS */
  const jobs = await prisma.job.findMany({
    where: {
      campaign: {
        client: {
          agencyId: agency.id,
        },
      },
      archivedAt: null,
      ...jobFilter,
    },
    include: {
      assignments: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          files: true,
        },
      },
    },
    orderBy: [
      {
        campaign: {
          client: {
            priority: 'desc',
          },
        },
      },
      {
        deadline: 'asc',
      },
    ],
  })

  /* 6️⃣ RENDER */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase italic">
            Job Pipeline
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Prehľad všetkých aktívnych jobov.
          </p>
        </div>

        {!isCreative && (
          <Link href={`/${params.slug}/jobs/new`}>
            <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2 shadow-md">
              <Plus className="h-4 w-4" /> Nový Job
            </Button>
          </Link>
        )}
      </div>

      {/* TABLE CARD */}
      <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Aktívne joby
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6 text-[10px] font-black uppercase">
                    Názov
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase">
                    Deadline
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase">
                    Status
                  </TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-black uppercase">
                    Akcia
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-20 text-slate-400 italic text-sm"
                    >
                      Žiadne aktívne joby.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {job.title}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {job._count.files} príloh
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm font-medium">
                        {job.deadline ? (
                          <span
                            className={
                              new Date(job.deadline) < new Date()
                                ? 'text-red-600 font-bold'
                                : 'text-slate-600'
                            }
                          >
                            {format(
                              new Date(job.deadline),
                              'dd.MM.yyyy'
                            )}
                          </span>
                        ) : (
                          '–'
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            job.status === 'TODO'
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : job.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-green-100 text-green-700 border-green-200'
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <Link href={`/${params.slug}/jobs/${job.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-bold"
                          >
                            Detail <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

```

## File: src/app/[slug]/.DS_Store

Error reading file: 'utf-8' codec can't decode byte 0x8e in position 1096: invalid start byte

## File: src/app/[slug]/planner/page.tsx

```typescript
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { AddPlannerEntryDialog } from '@/components/add-planner-entry-dialog'
import { PlannerDisplay } from '@/components/planner-display'
import { SubmitPlannerButton } from '@/components/ui/planner-button'

export const dynamic = 'force-dynamic'

export default async function PlannerPage({ params }: { params: { slug: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug }
  })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  const jobs = await prisma.job.findMany({
    where: {
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: { some: { userId: session.userId } }
    },
    include: {
      campaign: { include: { client: true } }
    }
  })

  const entries = await prisma.plannerEntry.findMany({
    where: { userId: session.userId },
    include: { job: { include: { campaign: { include: { client: true } } } } },
    orderBy: { date: 'asc' }
  })

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
          Môj Týždeň
        </h2>

        {isCreative && <SubmitPlannerButton />}

        <AddPlannerEntryDialog allJobs={jobs} />
      </div>

      <PlannerDisplay
        initialEntries={entries}
        allJobs={jobs}
      />
    </div>
  )
}

```

## File: src/app/[slug]/agency/page.tsx

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamList } from "@/components/team-list"
import { AgencySettings } from "@/components/agency-settings"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AgencyPage() {
  const session = await getSession()
  
  if (!session) {
      redirect('/login')
  }

  const isReadOnly = session.role === 'CREATIVE'

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Administrácia</h2>
        <p className="text-muted-foreground text-sm font-medium">
          Správa tímu a nastavení agentúry {isReadOnly ? '(len na čítanie)' : ''}
        </p>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <div className="border-b">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger value="team" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-xs font-bold uppercase tracking-widest transition-all">
                    Tím / Užívatelia
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none pb-2 text-xs font-bold uppercase tracking-widest transition-all">
                    Nastavenia Agentúry
                </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="team" className="space-y-4 outline-none">
           <TeamList readOnly={isReadOnly} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 outline-none">
            <AgencySettings readOnly={isReadOnly} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

```

## File: src/app/[slug]/layout.tsx

```typescript
// src/app/[slug]/layout.tsx
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

export default async function AgencyLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  // ✅ Session await
  const session = await getSession()
  if (!session) redirect('/login')

  // ✅ Načíta agentúru podľa slug
  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug }
  })
  if (!agency) return notFound()

  // ✅ Ochrana rolí: Creative a Traffic môže vidieť len svoj priestor
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    const myAgency = await prisma.agency.findUnique({ where: { id: session.agencyId } })
    if (myAgency) redirect(`/${myAgency.slug}`)
    else redirect('/login')
  }

  return (
    <div className="h-full relative">
      {/* Sidebar pre desktop */}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar slug={params.slug} role={session.role} />
      </div>

      {/* Hlavný obsah */}
      <main className="md:pl-72 min-h-screen bg-slate-50/50">
        <MobileNav slug={params.slug} />
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

```

## File: src/app/[slug]/jobs/[jobId]/page.tsx

```typescript
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Download, Paperclip, Image as ImageIcon, File, ExternalLink, Link2, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { TimerButton } from '@/components/timer-button'
import { CommentsSection } from '@/components/comments-section'
import { AssignUserDialog } from '@/components/assign-user-dialog'
import { AddFileDialog } from '@/components/add-file-dialog'
import { EditCampaignDescription } from '@/components/edit-campaign-description'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getSession } from '@/lib/session'

function getFileIcon(type: string) {
    if (type === 'PDF') return <FileText className="h-4 w-4 text-red-500" />
    if (type === 'IMAGE') return <ImageIcon className="h-4 w-4 text-blue-500" />
    if (type === 'LINK') return <Link2 className="h-4 w-4 text-emerald-500" />
    return <File className="h-4 w-4 text-slate-500" />
}

export default async function JobDetailPage({ params }: { params: { slug: string, jobId: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const job = await prisma.job.findFirst({
    where: { 
        id: params.jobId,
        campaign: { client: { agency: { slug: params.slug } } }
    },
    include: {
      campaign: { include: { client: true } },
      files: { orderBy: { createdAt: 'desc' } },
      comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      assignments: { 
          include: { 
              user: true,
              timesheets: { orderBy: { startTime: 'desc' } }
          } 
      }
    },
  })

  if (!job) return notFound()

  const isCreative = session.role === 'CREATIVE'
  const isAssigned = job.assignments.some(a => a.userId === session.userId)
  if (isCreative && !isAssigned) return notFound()

  let runningStartTime: string | null = null
  let isPaused = false
  let totalPausedMinutes = 0
  let lastPauseStart: string | null = null

  const myAssignment = job.assignments.find(a => a.userId === session.userId)
  if (myAssignment) {
      const activeSheet = myAssignment.timesheets.find(t => t.endTime === null)
      if (activeSheet) {
          runningStartTime = activeSheet.startTime.toISOString()
          isPaused = activeSheet.isPaused
          totalPausedMinutes = activeSheet.totalPausedMinutes
          lastPauseStart = activeSheet.lastPauseStart ? activeSheet.lastPauseStart.toISOString() : null
      }
  }

  const history = job.assignments.flatMap(a => 
    a.timesheets.filter(t => t.endTime !== null).map(t => ({
        ...t, userEmail: a.user.email, userName: a.user.name
    }))
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Link href={`/${params.slug}/jobs`}>
                <Button variant="outline" size="icon" className="rounded-full shadow-sm"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
                    <Badge variant="outline" className="font-bold">{job.status}</Badge>
                </div>
                <p className="text-muted-foreground text-[10px] font-black uppercase mt-1 tracking-widest">
                    {job.campaign.client.name} / {job.campaign.name}
                </p>
            </div>
        </div>
        <TimerButton 
            jobId={job.id} 
            initialStartTime={runningStartTime} 
            initialIsPaused={isPaused}
            initialPausedMinutes={totalPausedMinutes}
            initialLastPauseStart={lastPauseStart}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 items-start">
        <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3 border-b bg-slate-50/30 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">Zadanie / Brief</CardTitle>
                    </div>
                    {!isCreative && (
                        <EditCampaignDescription 
                            campaignId={job.campaignId} 
                            initialDescription={job.campaign.description || ''} 
                        />
                    )}
                </CardHeader>
                <CardContent className="pt-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed min-h-[100px]">
                    {job.campaign.description || <div className="text-slate-400 italic py-4">Zadanie zatiaľ nebolo vyplnené.</div>}
                </CardContent>
            </Card>

            <CommentsSection jobId={job.id} comments={job.comments} currentUserId={session.userId} />
        </div>

        <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-slate-50/30">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Tím na projekte</CardTitle>
                    {!isCreative && <AssignUserDialog jobId={job.id} />}
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    {job.assignments.map(a => (
                        <div key={a.id} className="flex items-center gap-3 text-sm">
                            <Avatar className="h-8 w-8 border">
                                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs uppercase">{(a.user.name || a.user.email).charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{a.user.name || a.user.email.split('@')[0]}</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{a.roleOnJob}</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-slate-50/30">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Paperclip className="h-4 w-4 text-slate-400" /> Súbory a Odkazy</CardTitle>
                    <AddFileDialog jobId={job.id} />
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                    {job.files.length === 0 ? (
                        <p className="text-xs text-center text-slate-400 py-4 italic">Žiadne prílohy.</p>
                    ) : (
                        job.files.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-white hover:bg-slate-50 transition group">
                                <div className="flex items-center gap-2 min-w-0">
                                    {getFileIcon(file.fileType)}
                                    <span className="text-[11px] font-bold truncate text-slate-800 uppercase tracking-tighter">
                                        {file.name || "Bez názvu"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-slate-900 text-white overflow-hidden">
                <CardHeader className="pb-2 border-b border-white/10"><CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-50">Časová os</CardTitle></CardHeader>
                <CardContent className="pt-4 space-y-3">
                    {history.slice(0, 5).map(t => (
                        <div key={t.id} className="flex justify-between items-center text-[11px] border-b border-white/5 pb-2 last:border-0">
                            <div>
                                <div className="font-bold">{t.userName || t.userEmail.split('@')[0]}</div>
                                <div className="opacity-50">{format(new Date(t.startTime), 'd.M. HH:mm')}</div>
                            </div>
                            <Badge variant="secondary" className="font-mono text-[9px] bg-white/10 text-white border-none">{t.durationMinutes} m</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
```

## File: src/app/[slug]/jobs/page.tsx

```typescript
// app/[slug]/jobs/page.tsx
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, ArrowRight, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { JobActions } from '@/components/job-actions'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function JobsPage({ params }: { params: { slug: string } }) {
  // ✅ Správny await
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  // 1️⃣ JOBS
  const jobs = await prisma.job.findMany({
    where: { 
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: {
      campaign: { include: { client: true } },
      assignments: { include: { user: true } },
      budgets: true
    }
  })

  // 2️⃣ TENDERS (ak existuje model)
  const tenders = await prisma.tender?.findMany
    ? await prisma.tender.findMany({
        where: { agencyId: agency.id, isConverted: false },
        orderBy: { deadline: 'asc' }
      })
    : []

  // 3️⃣ MERGE + SORT podľa priority a deadline
  const items = [
      ...jobs.map(j => ({
          id: j.id,
          title: j.title,
          type: 'JOB',
          status: j.status,
          priority: j.campaign?.client?.priority || 0,
          client: j.campaign?.client?.name || 'N/A',
          campaign: j.campaign?.name || '',
          deadline: j.deadline,
          budget: j.budgets?.reduce((acc, b) => acc + b.amount, 0) || 0
      })),
      ...tenders.map(t => ({
          id: t.id,
          title: t.title,
          type: 'TENDER',
          status: t.status,
          priority: 6,
          client: 'PITCH / TENDER',
          campaign: 'New Business',
          deadline: t.deadline,
          budget: t.budget || 0
      }))
  ].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {isCreative ? 'Moje Zadaniá' : 'Aktívna výroba'}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[900px] md:min-w-full">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-20 text-center text-[10px] font-bold uppercase">Prio</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Projekt</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Klient</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Termín</TableHead>
                {!isCreative && <TableHead className="text-[10px] font-bold uppercase">Budget</TableHead>}
                <TableHead className="text-right pr-6 text-[10px] font-bold uppercase">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic text-sm">
                    Žiadne aktívne projekty.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((proj) => (
                  <TableRow key={proj.id} className={`hover:bg-slate-50/50 transition-colors ${proj.type === 'TENDER' ? 'bg-purple-50/20' : ''}`}>
                    <TableCell className="text-center font-bold">
                        {proj.type === 'TENDER' 
                          ? <Badge className="bg-purple-600 text-[9px]">PITCH</Badge> 
                          : <span className={proj.priority >= 4 ? "text-red-600" : "text-slate-400"}>P{proj.priority}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            {proj.type === 'TENDER' 
                              ? <Trophy className="h-3 w-3 text-purple-600" /> 
                              : <ArrowRight className="h-3 w-3 text-blue-500" />}
                            <span className="font-semibold text-slate-800">{proj.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase">{proj.campaign}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600">{proj.client}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">
                        {format(new Date(proj.deadline), 'dd.MM.yyyy')}
                    </TableCell>
                    {!isCreative && <TableCell className="font-mono text-xs font-bold text-slate-600">{proj.budget ? proj.budget.toFixed(0) : '-'} €</TableCell>}
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                          <Link href={proj.type === 'TENDER' ? `/${params.slug}/tenders/${proj.id}` : `/${params.slug}/jobs/${proj.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8">Detail</Button>
                          </Link>
                          {proj.type === 'JOB' && !isCreative && <JobActions jobId={proj.id} />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

```

## File: src/app/[slug]/page.tsx

```typescript
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, addDays } from 'date-fns'
import { Euro, Users, ListChecks, CheckCircle2, Download } from "lucide-react"
import Link from 'next/link'

// Grafy
import { BudgetChart } from "@/components/charts/budget-chart"
import { WorkloadChart } from "@/components/charts/workload-chart"
import { TimesheetStatusChart } from "@/components/charts/timesheet-status-chart"
import { JobStatusChart } from "@/components/charts/job-status-chart"

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  // ✅ Session musí byť await
  const session = await getSession()
  if (!session) redirect('/login')

  // ✅ Získanie agency
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) redirect('/login')

  const isCreative = session.role === 'CREATIVE'
  const now = new Date()
  const criticalThreshold = addDays(now, 7)

  // 1️⃣ NAČÍTANIE JOBOV
  const jobs = await prisma.job.findMany({
    where: {
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: { budgets: true, campaign: { include: { client: true } }, assignments: { include: { user: true } } }
  }) || []

  // 2️⃣ ANALYTIKA: ACTIVE, OVERDUE, WARNING
  const activeCount = jobs.filter(j => j.status !== 'DONE').length
  const overdue = jobs.filter(j => j.status !== 'DONE' && j.deadline && j.deadline < now)
  const warning = jobs.filter(j => j.status !== 'DONE' && j.deadline && j.deadline >= now && j.deadline <= criticalThreshold)

  // 3️⃣ BUDGET DATA
  const budgetData = jobs.filter(j => j.budget != null && Number(j.budget) > 0).slice(0,5).map(j => ({
      id: j.id,
      name: j.title?.substring(0,10) || 'Untitled',
      plan: Number(j.budget || 0),
      real: Number(j.budgets?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0)
  }))

  // 4️⃣ TIMESHEETS
  const pendingCount = await prisma.timesheet.count({
    where: { status: 'PENDING', endTime: { not: null }, jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } }
  })
  const approvedCount = await prisma.timesheet.count({
    where: { status: 'APPROVED', jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } }
  })
  const tsData = [{ name: 'Výkazy', approved: approvedCount, pending: pendingCount }]

  // 5️⃣ WORKLOAD (ADMIN only)
  let workloadData: { name: string, value: number }[] = []
  if (!isCreative) {
    const users = await prisma.user.findMany({
      where: { agencyId: agency.id, active: true },
      include: { _count: { select: { assignments: { where: { job: { status: { not: 'DONE' }, archivedAt: null } } } } } }
    })
    workloadData = users.map(u => ({
      name: u.name || u.email.split('@')[0],
      value: u._count?.assignments || 0
    })).filter(v => v.value > 0)
  }

  // 6️⃣ JOB STATUS
  const statusCounts = {
    TODO: jobs.filter(j => j.status === 'TODO').length,
    IN_PROGRESS: jobs.filter(j => j.status === 'IN_PROGRESS').length,
    DONE: jobs.filter(j => j.status === 'DONE').length
  }
  const jobStatusData = [
    { name: 'TODO', value: statusCounts.TODO },
    { name: 'IN_PROGRESS', value: statusCounts.IN_PROGRESS },
    { name: 'DONE', value: statusCounts.DONE }
  ]

  // 7️⃣ TOTAL SPENT & TEAM COUNT
  const totalSpentAgg = await prisma.budgetItem.aggregate({
    where: { job: { campaign: { client: { agencyId: agency.id } } } },
    _sum: { amount: true }
  })
  const totalSpent = Number(totalSpentAgg._sum?.amount || 0)
  const teamCount = await prisma.user.count({ where: { agencyId: agency.id, active: true } })

  // 8️⃣ CREATIVE TIME DATA
  let creativeTimeData: { name: string, minutes: number }[] = []
  if (isCreative) {
    const myTs = await prisma.timesheet.findMany({
      where: { jobAssignment: { userId: session.userId }, endTime: { not: null } },
      orderBy: { startTime: 'asc' },
      take: 10
    })
    creativeTimeData = myTs.map(t => ({
      name: t.startTime ? format(new Date(t.startTime), 'd.M.') : '—',
      minutes: t.durationMinutes || 0
    }))
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Manažérsky Prehľad</h2>
          <p className="text-slate-500 text-sm font-medium">Agentúra: {agency.name}</p>
        </div>
        {!isCreative && (
          <Link href={`/${params.slug}/timesheets`}>
            <Button variant="outline" className="gap-2 shadow-sm font-bold border-slate-300">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href={`/${params.slug}/jobs`} className="block transform transition hover:scale-105">
          <Card className="bg-slate-900 text-white h-full shadow-lg border-none">
            <CardContent className="pt-4">
              <p className="text-[10px] font-bold uppercase opacity-50">Aktívne Joby</p>
              <div className="text-2xl font-black">{activeCount}</div>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-red-600 text-white shadow-lg border-none">
          <CardContent className="pt-4">
            <p className="text-[10px] font-bold uppercase opacity-80">Mešká</p>
            <div className="text-2xl font-black">{overdue.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500 text-white shadow-lg border-none">
          <CardContent className="pt-4">
            <p className="text-[10px] font-bold uppercase opacity-80">Kritické</p>
            <div className="text-2xl font-black">{warning.length}</div>
          </CardContent>
        </Card>

        <Link href={isCreative ? `/${params.slug}/timesheets` : `/${params.slug}/agency`} className="block transform transition hover:scale-105">
          <Card className="bg-blue-600 text-white h-full shadow-lg border-none">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-bold">
                <span>{isCreative ? 'Môj čas (min)' : 'Tím'}</span>
                <Users className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black mt-1">
                {isCreative ? creativeTimeData.reduce((s,i) => s + i.minutes, 0) : teamCount}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {!isCreative && (
          <Card className="lg:col-span-8 shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50 py-3">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Euro className="h-3 w-3" /> Finančný stav projektov
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <BudgetChart data={budgetData} slug={params.slug} />
            </CardContent>
          </Card>
        )}

        <Card className={`lg:col-span-4 shadow-xl border-none ring-1 ring-slate-200 ${isCreative ? 'lg:col-span-12' : ''}`}>
          <CardHeader className="border-b bg-slate-50/50 py-3">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
              <ListChecks className="h-3 w-3" /> Stav úloh
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <JobStatusChart data={jobStatusData} />
            <div className="grid grid-cols-3 gap-2 w-full text-center mt-6">
              <div className="bg-red-50 p-2 rounded-lg text-red-700 font-black text-xs">{statusCounts.TODO}</div>
              <div className="bg-blue-50 p-2 rounded-lg text-blue-700 font-black">WORK: {statusCounts.IN_PROGRESS}</div>
              <div className="bg-green-50 p-2 rounded-lg text-green-700 font-black">DONE: {statusCounts.DONE}</div>
            </div>
          </CardContent>
        </Card>

        {!isCreative && (
          <>
            <Card className="lg:col-span-6 shadow-xl border-none ring-1 ring-slate-200">
              <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                  <Users className="h-3 w-3" /> Vyťaženosť tímu
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <WorkloadChart data={workloadData} slug={params.slug} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-6 shadow-xl border-none ring-1 ring-slate-200">
              <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                  <CheckCircle2 className="h-3 w-3" /> Schvaľovanie výkazov
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <TimesheetStatusChart data={tsData} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

```

## File: src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}



@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}



@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* --- ZABEZPEČENIE PRE SPRÁVNE ZOBRAZENIE DIALÓGOV NA MOBILE --- */
@layer base {
  /* Fix pre Safari a Chrome, aby dialóg nebol mimo viewport na mobile */
  .dialog-content-fixed-mobile {
    /* Vynútenie správneho centorvania na mobile */
    @apply fixed inset-0 overflow-y-auto !h-auto !w-full max-w-lg translate-y-0 duration-300 sm:max-w-lg sm:translate-y-[-50%] sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%];
  }

  /* Pre zjednodušenie */
  .dialog-content-lg {
    @apply max-w-xl;
  }
}

/* Tvoje Shadcn base a utilities tu musia byť hore */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## File: src/app/login/page.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // register UI state
  const [showRegister, setShowRegister] = useState(false)
  const [regAgency, setRegAgency] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState<string | null>(null)
  const [regError, setRegError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Chyba pri prihlásení')
      }

      // Uloženie tokenu do cookies
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;

      // REDIRECT LOGIKA
      if (data.user.role === 'SUPERADMIN') {
          router.push('/superadmin')
      } else if (data.user.agencySlug) {
          router.push(`/${data.user.agencySlug}`)
      } else {
          router.push('/')
      }
      
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Registration submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)
    setRegSuccess(null)

    // Basic client validation
    if (!regAgency || !regName || !regEmail || !regPassword) {
      setRegError('Vyplňte prosím všetky polia.')
      return
    }

    setRegLoading(true)
    try {
      const res = await fetch('/api/auth/register-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: regAgency,
          fullName: regName,
          email: regEmail,
          password: regPassword
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Chyba pri odoslaní registrácie')
      }
      setRegSuccess('Registrácia odoslaná. Superadmin ťa bude kontaktovať.')
      setRegAgency(''); setRegName(''); setRegEmail(''); setRegPassword('')
      setShowRegister(false)
    } catch (err: any) {
      setRegError(err.message || 'Nepodarilo sa odoslať')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-slate-900 rounded-xl overflow-hidden">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-2xl font-bold italic text-slate-900">AgencyFlow</CardTitle>
          <CardDescription>Vstúpte do svojho agentúrneho prostredia</CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@agentura.sk" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Prihlásiť sa'}
            </Button>

            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-500">Nemáte účet?</span>
              <Button variant="ghost" onClick={() => setShowRegister(v => !v)} className="text-sm">
                {showRegister ? 'Zatvoriť' : 'Registrovať sa'}
              </Button>
            </div>

            {regSuccess && <div className="p-3 text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-md text-center">{regSuccess}</div>}
            {regError && <div className="p-3 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-md text-center">{regError}</div>}

            {showRegister && (
              <form onSubmit={handleRegister} className="space-y-3 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="agency">Názov agentúry</Label>
                  <Input id="agency" value={regAgency} onChange={(e) => setRegAgency(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullname">Meno a priezvisko</Label>
                  <Input id="fullname" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regemail">Prihlasovací email</Label>
                  <Input id="regemail" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regpassword">Heslo</Label>
                  <Input id="regpassword" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" disabled={regLoading}>
                    {regLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Odoslať registráciu'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowRegister(false)}>Zrušiť</Button>
                </div>
              </form>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

```

## File: src/components/ui/tabs.tsx

```typescript
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

```

## File: src/components/ui/card.tsx

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

```

## File: src/components/ui/progress.tsx

```typescript
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

```

## File: src/components/ui/sheet.tsx

```typescript
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

```

## File: src/components/ui/label.tsx

```typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }

```

## File: src/components/ui/planner-button.tsx

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SubmitPlannerButtonProps {
  disabled?: boolean
}

export function SubmitPlannerButton({ disabled }: SubmitPlannerButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/planner/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        setIsDone(true)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (isDone) return null

  return (
    <Button
      onClick={handleSubmit}
      disabled={disabled || loading}
      className="bg-green-600 text-white hover:bg-green-700"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Odosielam…
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Odoslať na schválenie
        </>
      )}
    </Button>
  )
}

```

## File: src/components/ui/avatar.tsx

```typescript
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }

```

## File: src/components/ui/dialog.tsx

```typescript
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

```

## File: src/components/ui/badge.tsx

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

```

## File: src/components/ui/table.tsx

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

```

## File: src/components/ui/separator.tsx

```typescript
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }

```

## File: src/components/ui/button.tsx

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

```

## File: src/components/ui/toggle.tsx

```typescript
"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
```

## File: src/components/ui/checkbox.tsx

```typescript
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

```

## File: src/components/ui/select.tsx

```typescript
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

```

## File: src/components/ui/textarea.tsx

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

```

## File: src/components/ui/input.tsx

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

```

## File: src/components/edit-tender-description.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Loader2 } from 'lucide-react'

export function EditTenderDescription({ tenderId, initialDescription }: { tenderId: string, initialDescription: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState(initialDescription)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tenders/${tenderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })
      if (res.ok) {
        setOpen(false)
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Upraviť zadanie / Brief</DialogTitle></DialogHeader>
        <div className="py-4">
          <Textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Vložte detailné zadanie..."
            className="min-h-[300px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Zrušiť</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Uložiť zmeny"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/comments-section.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Comment {
  id: string
  text: string
  createdAt: Date
  user: {
    email: string
  }
}

interface CommentsSectionProps {
  jobId: string
  comments: Comment[]
  currentUserId: string | null
}

export function CommentsSection({ jobId, comments, currentUserId }: CommentsSectionProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, text }),
      })

      if (res.ok) {
        setText('') 
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm flex flex-col h-full mt-6">
      <CardHeader className="pb-3 border-b bg-slate-50/50">
        <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-slate-500" />
            <CardTitle>Diskusia ({comments.length})</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    Zatiaľ žiadna diskusia.
                </div>
            ) : (
                comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1 border">
                            <AvatarFallback className="bg-white text-xs font-bold text-slate-700">
                                {comment.user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1 max-w-[85%]">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs font-semibold text-slate-900">
                                    {comment.user.email.split('@')[0]}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(comment.createdAt), 'dd.MM HH:mm')}
                                </span>
                            </div>
                            <div className="bg-slate-100 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm text-slate-800">
                                {comment.text}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="mt-auto pt-2 flex gap-2 items-end">
            <Textarea 
                placeholder="Napíšte správu..." 
                className="min-h-[60px] resize-none bg-slate-50"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <Button 
                onClick={handleSubmit} 
                disabled={loading || !text.trim()}
                className="h-[60px] w-[60px] bg-slate-900"
            >
                <Send className="h-5 w-5" />
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## File: src/components/add-tender-dialog.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, // <--- KRITICKÝ IMPORT
  DialogFooter 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export function AddPlannerEntryDialog({ allJobs }: { allJobs: any[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [jobId, setJobId] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [minutes, setMinutes] = useState('60')
  const [title, setTitle] = useState('')

  const handleSave = async () => {
    if (!title || !date) return
    setLoading(true)
    const finalJobId = jobId === 'INTERNAL' ? '' : jobId;

    try {
      const res = await fetch(`/api/planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: finalJobId, 
          date, 
          minutes: minutes,
          title
        })
      })
      if (res.ok) {
        setOpen(false)
        setJobId(''); setDate(format(new Date(), 'yyyy-MM-dd')); setMinutes('60'); setTitle('')
        router.refresh()
      } else {
          alert("Chyba: Nepodarilo sa uložiť plán.")
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"><Plus className="h-4 w-4 mr-2" /> Naplánovať prácu</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nový záznam v Plánovači</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Job / Projekt (Voliteľné)</Label>
            <Select onValueChange={setJobId} value={jobId}>
              <SelectTrigger><SelectValue placeholder="Vyberte job, na ktorom budete pracovať" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL">INTERNÁ PRÁCA / BEZ KLIENTA</SelectItem> 
                {allJobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                        {job.title} ({job.campaign.client.name})
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Popis úlohy</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Napr. Príprava podkladov k tendru..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Dátum</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Odhad minút</Label><Input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading || !title || !date} className="bg-emerald-600 text-white w-full">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Uložiť do plánu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/clients-list.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { Building, Plus, Loader2, ArrowRight, Trash2, RotateCcw, Pencil } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation' // <--- IMPORT usePathname
import Link from 'next/link'

interface Client {
  id: string; name: string; priority: number; scope: string | null; _count: { campaigns: number }
}
interface ScopeOption { id: string; name: string }

export function ClientsList() {
  const router = useRouter()
  const pathname = usePathname()
  // Vytiahneme slug z URL (napr. /super-creative/clients -> super-creative)
  const slug = pathname.split('/')[1] 

  const [clients, setClients] = useState<Client[]>([])
  const [scopesList, setScopesList] = useState<ScopeOption[]>([]) 
  const [loading, setLoading] = useState(true)
  
  // Stavy pre Dialog
  const [open, setOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  
  const [newName, setNewName] = useState('')
  const [newPriority, setNewPriority] = useState('3')
  const [selectedScope, setSelectedScope] = useState<string[]>([]) 
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [customScope, setCustomScope] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const refreshData = async () => {
    setLoading(true)
    try {
        const query = showArchived ? '?archived=true' : ''
        const [cRes, sRes] = await Promise.all([
            fetch(`/api/clients${query}`), 
            fetch('/api/agency/scopes')
        ])
        
        if (cRes.ok) {
            const cData = await cRes.json()
            setClients(Array.isArray(cData) ? cData : [])
        }
        if (sRes.ok) {
            const sData = await sRes.json()
            setScopesList(Array.isArray(sData) ? sData : [])
        }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  useEffect(() => { refreshData() }, [showArchived])

  const openNewDialog = () => {
      setEditingClient(null); setNewName(''); setNewPriority('3'); setSelectedScope([]); setIsOtherSelected(false); setCustomScope(''); setOpen(true)
  }

  const openEditDialog = (client: Client) => {
      setEditingClient(client)
      setNewName(client.name)
      setNewPriority(client.priority.toString())
      const currentScopes = client.scope ? client.scope.split(',').map(s => s.trim()) : []
      const standardScopeNames = scopesList.map(s => s.name)
      const standard = currentScopes.filter(s => standardScopeNames.includes(s))
      const custom = currentScopes.filter(s => !standardScopeNames.includes(s))
      setSelectedScope(standard)
      if (custom.length > 0) { setIsOtherSelected(true); setCustomScope(custom.join(', ')) } 
      else { setIsOtherSelected(false); setCustomScope('') }
      setOpen(true)
  }

  const toggleScope = (scopeName: string) => {
      setSelectedScope(prev => prev.includes(scopeName) ? prev.filter(s => s !== scopeName) : [...prev, scopeName])
  }

  const handleSave = async () => {
    if (!newName.trim()) return
    setSubmitting(true)
    
    let finalScopeList = [...selectedScope]
    if (isOtherSelected && customScope.trim()) {
        const customs = customScope.split(',').map(s => s.trim())
        finalScopeList = [...finalScopeList, ...customs]
    }

    try {
        const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
        const method = editingClient ? 'PATCH' : 'POST'

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, priority: newPriority, scope: finalScopeList })
        })
        
        if (res.ok) {
            setOpen(false)
            if (isOtherSelected) {
                 const sRes = await fetch('/api/agency/scopes')
                 if(sRes.ok) setScopesList(await sRes.json())
            }
            await refreshData()
            router.refresh()
        }
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleArchive = async (id: string, restore = false) => {
      const url = restore ? `/api/clients/${id}/restore` : `/api/clients/${id}/archive`
      if(!confirm(restore ? "Obnoviť?" : "Archivovať?")) return
      try {
          const res = await fetch(url, { method: 'PATCH' })
          if(res.ok) await refreshData()
      } catch(e) { console.error(e) }
  }

  const getPriorityBadge = (p: number) => {
      if (p >= 5) return <Badge className="bg-red-600 hover:bg-red-700">VIP</Badge>
      if (p === 4) return <Badge className="bg-orange-500 hover:bg-orange-600">Vysoká</Badge>
      if (p === 3) return <Badge variant="outline" className="border-blue-500 text-blue-600">Stredná</Badge>
      return <Badge variant="secondary">Nízka</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium text-slate-800">Manažment Klientov</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setShowArchived(false)} className={`px-3 py-1 text-[10px] font-bold rounded-md ${!showArchived ? 'bg-white shadow' : 'text-slate-500'}`}>AKTÍVNI</button>
                <button onClick={() => setShowArchived(true)} className={`px-3 py-1 text-[10px] font-bold rounded-md ${showArchived ? 'bg-white shadow' : 'text-slate-500'}`}>ARCHÍV</button>
            </div>
        </div>
        {!showArchived && (
            <Button onClick={openNewDialog} className="bg-slate-900 text-white"><Plus className="mr-2 h-4 w-4" /> Nový Klient</Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{editingClient ? 'Upraviť Klienta' : 'Nový Klient'}</DialogTitle>
                <DialogDescription>Zadajte údaje o klientovi.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-4">
                <div className="grid gap-2"><Label>Názov</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Priorita</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="1">1 - Nízka</SelectItem><SelectItem value="3">3 - Stredná</SelectItem><SelectItem value="5">5 - VIP</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2"><Label>Rozsah</Label>
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50/50 max-h-[180px] overflow-y-auto">
                        {scopesList.map(s => (<div key={s.id} className="flex items-center space-x-2"><Checkbox checked={selectedScope.includes(s.name)} onCheckedChange={() => toggleScope(s.name)} /><label className="text-xs">{s.name}</label></div>))}
                        <div className="col-span-2 pt-2 border-t"><Checkbox checked={isOtherSelected} onCheckedChange={(c) => setIsOtherSelected(!!c)} /><label className="ml-2 text-xs font-bold text-blue-700">+ Iné</label></div>
                    </div>
                    {isOtherSelected && <Input value={customScope} onChange={e => setCustomScope(e.target.value)} className="mt-2 bg-blue-50" placeholder="Zadajte..." />}
                </div>
            </div>
            <DialogFooter><Button onClick={handleSave} disabled={submitting || !newName} className="bg-slate-900 text-white">{submitting ? <Loader2 className="animate-spin" /> : "Uložiť"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-slate-50"><TableRow><TableHead>Klient</TableHead><TableHead>Priorita</TableHead><TableHead>Rozsah</TableHead><TableHead className="text-right">Akcia</TableHead></TableRow></TableHeader>
            <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="text-center h-24">Načítavam...</TableCell></TableRow> : 
                 clients.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">{showArchived ? "Archív je prázdny." : "Žiadni klienti."}</TableCell></TableRow> : 
                 clients.map(client => (
                    <TableRow key={client.id} className={showArchived ? "bg-slate-50 opacity-75" : "hover:bg-slate-50/50"}>
                        <TableCell className="font-semibold text-slate-700 flex gap-2"><Building className="h-4 w-4 text-slate-400" />{client.name}</TableCell>
                        <TableCell>{getPriorityBadge(client.priority)}</TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{client.scope?.split(',').map(s => <span key={s} className="text-[10px] bg-slate-100 px-1 rounded">{s.trim()}</span>)}</div></TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                                {showArchived ? (
                                    <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleArchive(client.id, true)}><RotateCcw className="h-4 w-4 mr-1" /> Obnoviť</Button>
                                ) : (
                                    <>
                                        {/* OPRAVENÝ LINK NA DETAIL */}
                                        <Link href={`/${slug}/clients/${client.id}`}><Button variant="ghost" size="sm" className="text-blue-600 font-bold text-xs h-7">DETAIL</Button></Link>
                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(client)} className="h-7 w-7 p-0"><Pencil className="h-3.5 w-3.5 text-slate-400" /></Button>
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 h-7 w-7 p-0" onClick={() => handleArchive(client.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

## File: src/components/edit-campaign-description.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Loader2 } from 'lucide-react'

export function EditCampaignDescription({ campaignId, initialDescription }: { campaignId: string, initialDescription: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState(initialDescription)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })
      if (res.ok) {
        setOpen(false)
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Upraviť zadanie kampane</DialogTitle></DialogHeader>
        <div className="py-4">
          <Textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Vložte detailný brief pre celý tím..."
            className="min-h-[300px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Zrušiť</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Aktualizovať Brief"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/add-file-dialog.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

export function AddFileDialog({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [fileUrl, setFileUrl] = useState('')

  const handleUpload = async () => {
    if (!fileUrl || !name) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, name, fileType: 'LINK' })
      })
      if (res.ok) {
        setOpen(false); setFileUrl(''); setName('');
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
            <Plus className="h-4 w-4 text-slate-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Pridať odkaz</DialogTitle>
            <DialogDescription>Zadajte názov a URL adresu podkladov.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov (čo to je?)</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Napr. Dropbox s podkladmi" />
          </div>
          <div className="grid gap-2">
            <Label>Odkaz (URL)</Label>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="www.dropbox.com/..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={loading || !fileUrl || !name} className="bg-slate-900 text-white w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Uložiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/job-actions.tsx

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function JobActions({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleArchive = async () => {
    if (!confirm('Naozaj chcete archivovať tento job? Zmizne zo zoznamu aktívnych.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/archive`, { method: 'PATCH' })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Chyba pri archivácii')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleArchive} 
      disabled={loading}
      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
      title="Archivovať job"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
```

## File: src/components/charts/workload-chart.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useRouter } from "next/navigation"

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export function WorkloadChart({ data, slug }: { data: any[], slug: string }) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="h-[300px] bg-slate-50 animate-pulse rounded-lg" />

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm border-2 border-dashed rounded-lg">
        Tím nemá priradenú prácu.
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push(`/${slug}/agency`)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## File: src/components/charts/budget-chart.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { useRouter } from "next/navigation"

export function BudgetChart({ data, slug }: { data: any[], slug: string }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />

  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400 italic text-sm">Zatiaľ žiadne finančné dáta.</div>
  }

  return (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} />
          <Tooltip 
            cursor={{fill: '#f8fafc'}} 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold' }} />
          <Bar dataKey="plan" name="Plán" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
          <Bar 
            dataKey="real" 
            name="Realita" 
            fill="#0f172a" 
            radius={[4, 4, 0, 0]} 
            style={{ cursor: 'pointer' }}
            onClick={(d) => router.push(`/${slug}/jobs/${d.id}`)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## File: src/components/charts/personal-time-chart.tsx

```typescript
'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function PersonalTimeChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" fontSize={10} hide />
          <YAxis fontSize={10} axisLine={false} tickLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="minutes" name="Minúty" stroke="#6366f1" fillOpacity={1} fill="url(#colorTime)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## File: src/components/charts/job-status-chart.tsx

```typescript
'use client'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = { TODO: '#f43f5e', IN_PROGRESS: '#3b82f6', DONE: '#10b981', VYHRANÉ: '#10b981' }

export function JobStatusChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-[200px] w-full bg-slate-50 animate-pulse rounded-full mx-auto max-w-[200px]" />

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
            {data.map((entry: any) => (
                <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] || '#cbd5e1'} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## File: src/components/charts/timesheet-status-chart.tsx

```typescript
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function TimesheetStatusChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: -20 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" fontSize={10} width={80} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '10px' }} />
          <Legend iconType="circle" />
          <Bar dataKey="approved" name="Schválené" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="pending" name="Na schválenie" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## File: src/components/contact-person-dialog.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

export function ContactPersonDialog({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')

  const handleCreate = async () => {
    if (!name) return
    setLoading(true)
    try {
        const res = await fetch('/api/clients/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, name, email, phone, position })
        })
        if (res.ok) {
            setOpen(false)
            setName(''); setEmail(''); setPhone(''); setPosition('')
            router.refresh()
        }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Plus className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nová Kontaktná Osoba</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>Meno a Priezvisko</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jozef Novák" />
            </div>
            <div className="grid gap-2">
                <Label>Pozícia</Label>
                <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="Marketing Manager" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="@" />
                </div>
                <div className="grid gap-2">
                    <Label>Telefón</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+421..." />
                </div>
            </div>
        </div>
        <DialogFooter>
            <Button onClick={handleCreate} disabled={loading || !name} className="bg-slate-900 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Uložiť
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/notifications-popover.tsx

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react"; // Predpokladám, že máš lucide-react ikony

type Notification = {
  id: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // 1. Načítanie notifikácií
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Tip: Tu by sa dal nastaviť interval (polling) každých 30 sekúnd na refresh
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 2. Kliknutie na notifikáciu
  const handleNotificationClick = async (notification: Notification) => {
    // Označiť ako prečítané na backend
    if (!notification.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id: notification.id }),
      });
      
      // Lokálny update stavu
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }

    // Presmerovanie
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Tlačidlo Zvonček */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Rozbaľovacie okno (Popover) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b bg-gray-50 font-semibold text-sm">
            Notifikácie
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Žiadne nové notifikácie
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition ${
                    !n.isRead ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-800">
                    {n.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{n.message}</div>
                  <div className="text-[10px] text-gray-400 mt-2 text-right">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Overlay na zatvorenie pri kliknutí mimo */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}
```

## File: src/components/team-list.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { UserPlus, Loader2, Edit2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserMember {
  id: string; email: string; name: string | null; position: string | null; role: string; hourlyRate: number; costRate: number; active: boolean;
}

interface Position {
    id: string
    name: string
    category: string | null
}

export function TeamList() {
  const router = useRouter()
  const [users, setUsers] = useState<UserMember[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserMember | null>(null)
  
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('CREATIVE')
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [customPos, setCustomPos] = useState('')
  const [hourlyRate, setHourlyRate] = useState('50')
  const [costRate, setCostRate] = useState('30')
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [uRes, pRes] = await Promise.all([fetch('/api/agency/users'), fetch('/api/agency/positions')])
      const uData = await uRes.json()
      const pData = await pRes.json()
      if (Array.isArray(uData)) setUsers(uData)
      if (Array.isArray(pData)) setPositions(pData)
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleEditClick = (user: UserMember) => {
    setEditingUser(user)
    setEmail(user.email); setName(user.name || ''); 
    setSelectedPositions(user.position ? user.position.split(',').map(p => p.trim()) : [])
    setRole(user.role); setHourlyRate(user.hourlyRate.toString()); 
    setCostRate(user.costRate.toString()); setActive(user.active);
    setIsOtherSelected(false); setCustomPos('');
    setOpen(true)
  }

  const togglePos = (name: string) => {
      setSelectedPositions(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name])
  }

  const handleSave = async () => {
    setSubmitting(true)
    const url = editingUser ? `/api/agency/users/${editingUser.id}` : '/api/agency/users'
    const method = editingUser ? 'PATCH' : 'POST'
    
    let finalPositions = [...selectedPositions]
    if (isOtherSelected && customPos.trim()) finalPositions.push(customPos.trim())

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, position: finalPositions.join(', '), hourlyRate, costRate, active, password: 'password123' })
      })
      if (res.ok) {
        setOpen(false)
        await fetchData()
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setSubmitting(false) }
  }

  // Zoskupenie pozícií pre zobrazenie
  const groupedPositions: Record<string, Position[]> = {}
  positions.forEach(p => {
    const cat = p.category || "Ostatné"
    if (!groupedPositions[cat]) groupedPositions[cat] = []
    groupedPositions[cat].push(p)
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Tímový adresár</h3>
        <Button onClick={() => { setEditingUser(null); setOpen(true); setSelectedPositions([]); setName(''); setEmail(''); }} className="bg-slate-900 text-white">
            <UserPlus className="mr-2 h-4 w-4" /> Pridať člena
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{editingUser ? 'Upraviť údaje' : 'Nový kolega'}</DialogTitle>
            <DialogDescription>Nastavte meno a pracovné zaradenie.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
            <div className="space-y-4">
                <div className="grid gap-2"><Label>Celé meno</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Peter Novák" /></div>
                {!editingUser && <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@agentura.sk" /></div>}
                
                <div className="grid gap-2">
                    <Label>Rola v systéme</Label>
                    <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ADMIN">ADMIN (Plný prístup)</SelectItem>
                        <SelectItem value="TRAFFIC">TRAFFIC (Riadenie)</SelectItem>
                        <SelectItem value="ACCOUNT">ACCOUNT (Schvaľovanie)</SelectItem>
                        <SelectItem value="CREATIVE">CREATIVE (Stopky)</SelectItem>
                    </SelectContent></Select>
                </div>

                <div className="space-y-3">
                    <Label>Pracovné pozície</Label>
                    <div className="border rounded-lg bg-slate-50/50 p-4 space-y-6">
                        {Object.entries(groupedPositions).sort().map(([category, items]) => (
                            <div key={category} className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-1">{category}</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {items.map(p => (
                                        <div key={p.id} className="flex items-center space-x-3">
                                            <Checkbox id={p.id} checked={selectedPositions.includes(p.name)} onCheckedChange={() => togglePos(p.name)} />
                                            <label htmlFor={p.id} className="text-xs font-medium cursor-pointer text-slate-700">{p.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="pt-2 border-t flex items-center space-x-3">
                            <Checkbox id="other" checked={isOtherSelected} onCheckedChange={(c) => setIsOtherSelected(!!c)} />
                            <label htmlFor="other" className="text-xs font-bold text-blue-700 cursor-pointer">+ Pridať vlastnú pozíciu</label>
                        </div>
                        {isOtherSelected && <Input value={customPos} onChange={e => setCustomPos(e.target.value)} placeholder="Názov pozície..." className="bg-white border-blue-200" />}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Billable (€/h)</Label><Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Cost (€/h)</Label><Input type="number" value={costRate} onChange={e => setCostRate(e.target.value)} /></div>
                </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-2 bg-slate-50 border-t">
            <Button onClick={handleSave} disabled={submitting} className="w-full bg-slate-900 text-white h-11">
              {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Uložiť a zavrieť"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow><TableHead className="pl-6">Meno / Pozícia</TableHead><TableHead>Rola</TableHead><TableHead>Sadzba</TableHead><TableHead className="text-right pr-6">Akcia</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse font-bold text-slate-300 uppercase tracking-widest">Sťahujem tím...</TableCell></TableRow> : 
              users.map(u => (
                <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase border border-slate-200">{(u.name || u.email).charAt(0)}</div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{u.name || u.email.split('@')[0]}</span>
                            <span className="text-[10px] text-blue-600 font-black uppercase tracking-tight truncate max-w-[200px]">{u.position || "Bez pozície"}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-bold uppercase">{u.role}</Badge></TableCell>
                  <TableCell className="text-[10px] font-mono font-bold text-slate-500">{u.hourlyRate}€</TableCell>
                  <TableCell className="text-right pr-6"><Button variant="ghost" size="sm" onClick={() => handleEditClick(u)} className="h-8 w-8 p-0 border hover:bg-white shadow-sm"><Edit2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

## File: src/components/add-campaign-dialog.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from 'lucide-react'

export function AddCampaignDialog({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })
      if (res.ok) {
        setOpen(false); setName(''); setDescription('');
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Nová kampaň</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Vytvoriť kampaň</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov kampane</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Napr. Letný výpredaj 2025" />
          </div>
          <div className="grid gap-2">
            <Label>Popis (Brief)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Zadanie pre kampaň..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading || !name} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="animate-spin" /> : "Vytvoriť"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/client-newsfeed.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Pin, Send, Loader2, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Toggle } from "@/components/ui/toggle"

export function ClientNewsfeed({ clientId, initialNotes }: { clientId: string, initialNotes: any[] }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddNote = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, isPinned })
      })
      if (res.ok) {
        setText('')
        setIsPinned(false)
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  // Rozdelíme poznámky na Pripnuté (Hore) a Ostatné
  const pinnedNotes = initialNotes.filter(n => n.isPinned)
  const normalNotes = initialNotes.filter(n => !n.isPinned)

  return (
    <Card className="shadow-md border-blue-100 h-full flex flex-col">
      <CardHeader className="bg-blue-50/50 border-b py-3">
        <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-900">
                Klientsky Denník & Prístupy
            </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4 min-h-[400px]">
        {/* INPUT OBLASŤ */}
        <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border shadow-sm">
            <Textarea 
                placeholder="Zápis zo stretka, nové heslá alebo dôležité info..." 
                value={text} 
                onChange={e => setText(e.target.value)}
                className="min-h-[80px] border-0 focus-visible:ring-0 resize-none p-0 text-sm"
            />
            <div className="flex justify-between items-center pt-2 border-t mt-2">
                <Toggle 
                    pressed={isPinned} 
                    onPressedChange={setIsPinned} 
                    size="sm" 
                    variant="outline"
                    className="gap-2 text-xs font-bold data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 data-[state=on]:border-orange-200"
                >
                    <Pin className="h-3 w-3" /> {isPinned ? 'Pripnuté (Dôležité)' : 'Pripnúť'}
                </Toggle>
                <Button size="sm" onClick={handleAddNote} disabled={loading || !text.trim()} className="bg-blue-600 hover:bg-blue-700 h-8">
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
            </div>
        </div>

        {/* ZOZNAM POZNÁMOK */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            
            {/* PRIPNUTÉ (Dôležité) */}
            {pinnedNotes.length > 0 && (
                <div className="space-y-2 mb-4">
                    <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest pl-1">Dôležité / Prístupy</p>
                    {pinnedNotes.map(note => (
                        <div key={note.id} className="p-3 bg-orange-50/80 border border-orange-200 rounded-lg text-sm relative group">
                            <Pin className="h-3 w-3 text-orange-400 absolute top-3 right-3" />
                            <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px] bg-white">{note.user.email.charAt(0)}</AvatarFallback></Avatar>
                                <span className="text-[10px] font-bold text-orange-800">{note.user.name || note.user.email}</span>
                                <span className="text-[10px] text-orange-400">{format(new Date(note.createdAt), 'dd.MM.yyyy')}</span>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap font-medium">{note.text}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* OSTATNÉ (Chronologické) */}
            {normalNotes.map(note => (
                <div key={note.id} className="flex gap-3">
                     <Avatar className="h-8 w-8 mt-1 border shadow-sm">
                        <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-600">
                            {(note.user.name || note.user.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-slate-800">{note.user.name || note.user.email.split('@')[0]}</span>
                            <span className="text-[10px] text-slate-400">{format(new Date(note.createdAt), 'dd.MM HH:mm')}</span>
                        </div>
                        <div className="bg-white p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border text-sm text-slate-600 whitespace-pre-wrap shadow-sm">
                            {note.text}
                        </div>
                    </div>
                </div>
            ))}
            
            {initialNotes.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-xs text-slate-400 italic">Zatiaľ žiadne záznamy. Pridajte prvý zápis.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
```

## File: src/components/convert-tender-button.tsx

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ConvertTenderButton({ tenderId, slug }: { tenderId: string, slug: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleConvert = async () => {
    if (!confirm("GRATULUJEME K VÝHRE! Chcete tento tender preklopiť na reálneho klienta a spustiť job?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/tenders/${tenderId}/convert`, { method: 'POST' })
      if (res.ok) {
        alert("Úžasné! Tender bol úspešne skonvertovaný na Klienta. Nájdete ho v sekcii Agentúra.")
        router.push(`/${slug}/agency`) // Presmerujeme na zoznam klientov
        router.refresh()
      } else {
        alert("Chyba pri konverzii.")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleConvert} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 shadow-xl animate-bounce-slow">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
      VYHRALI SME TENDER!
    </Button>
  )
}
```

## File: src/components/traffic-workload-manager.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRightLeft, Calendar, MessageSquareShare } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

export function TrafficWorkloadManager({ 
    initialUsers, 
    allUsersList = [], 
    role, 
    currentUserId,
    slug
}: { 
    initialUsers: any[], 
    allUsersList: any[], 
    role: string, 
    currentUserId: string,
    slug: string
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  const [requestOpen, setRequestOpen] = useState(false)
  const [activeAssign, setActiveAssign] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [targetUserId, setTargetUserId] = useState('')

  const isManager = ['ADMIN', 'TRAFFIC', 'ACCOUNT', 'SUPERADMIN'].includes(role)
  
  // Na tomto komponente je len UI render (fetches sa presunuli do TrafficPage alebo nad neho)

  const handleDirectReassign = async (assignmentId: string, newUserId: string) => {
    setLoadingId(assignmentId)
    try {
      const res = await fetch('/api/jobs/reassign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, newUserId })
      })
      if (res.ok) router.refresh()
    } catch (e) { 
        console.error(e) 
    } finally { 
        setLoadingId(null) 
    }
  }

  const handleRequestSend = async () => {
    if (!targetUserId || !reason || !activeAssign) return
    setLoadingId('request')
    try {
      const res = await fetch('/api/jobs/reassign/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: activeAssign.id, targetUserId, reason })
      })
      if (res.ok) {
        alert("Žiadosť o presun práce bola odoslaná.")
        setRequestOpen(false)
        setReason('')
        setTargetUserId('')
        router.refresh()
      }
    } catch (e) { 
        console.error(e) 
    } finally { 
        setLoadingId(null) 
    }
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {initialUsers.map((user: any) => (
        <Card key={user.id} className="shadow-sm border-slate-200 overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b py-3 px-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-8 w-8 border shadow-sm">
                <AvatarFallback className="text-[10px] font-bold bg-white text-slate-600 uppercase">
                    {(user.name || user.email).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-xs font-bold text-slate-800">
                    {user.name || user.email.split('@')[0]}
                </CardTitle>
              </div>
              <Badge variant="secondary" className="ml-auto text-[9px] font-bold uppercase">
                {(user.assignments || []).length} ÚLOHY
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {(!user.assignments || user.assignments.length === 0) ? (
                  <div className="p-6 text-center text-[10px] text-slate-400 italic uppercase tracking-widest">
                      Bez aktívnych priradení.
                  </div>
              ) : (
                user.assignments.map((assign: any) => (
                    <div key={assign.id} className="p-3 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                      <div className="min-w-0 pr-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                            {assign.job?.campaign?.client?.name || 'Interný Projekt'}
                        </p>
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                            {assign.job?.title}
                        </h4>
                      </div>
    
                      {isManager ? (
                        <Select onValueChange={(val) => handleDirectReassign(assign.id, val)} disabled={loadingId === assign.id}>
                          <SelectTrigger className="h-7 text-[8px] w-28 font-bold uppercase tracking-tighter bg-white shadow-sm">
                              <SelectValue placeholder="PREHODIŤ" />
                          </SelectTrigger>
                          <SelectContent>
                            {allUsersList.filter(u => u.id !== user.id).map((other: any) => (
                              <SelectItem key={other.id} value={other.id} className="text-xs">
                                {other.name || other.email.split('@')[0]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        assign.userId === currentUserId && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase" 
                                onClick={() => { setActiveAssign(assign); setRequestOpen(true) }}
                            >
                                <MessageSquareShare className="h-3 w-3 mr-1" /> Žiadať presun
                            </Button>
                        )
                      )}
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle className="text-lg">Žiadosť o presun práce</DialogTitle></DialogHeader>
              <div className="grid gap-6 py-4">
                  <div className="grid gap-2"><Label>Kolega na prevzatie</Label>
                      <Select onValueChange={setTargetUserId} value={targetUserId}>
                          <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Vyberte kolegu..." /></SelectTrigger>
                          <SelectContent>{allUsersList.filter(u => u.id !== currentUserId).map(u => (<SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>))}</SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-2"><Label>Dôvod</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Preťaženie, dovolenka..." className="min-h-[100px] bg-slate-50 border-slate-200" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setRequestOpen(false)}>Zrušiť</Button>
                  <Button onClick={handleRequestSend} disabled={loadingId === 'request' || !targetUserId || !reason} className="bg-slate-900 text-white">Odoslať žiadost</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  )
}
```

## File: src/components/timesheet-actions.tsx

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TimesheetActionsProps {
  id: string
  status: string
  isRunning: boolean
}

export function TimesheetActions({ id, status, isRunning }: TimesheetActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleReview = async (newStatus: 'APPROVED' | 'REJECTED') => {
    setLoading(true)
    try {
      const res = await fetch('/api/timesheets/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timesheetId: id, status: newStatus }),
      })
      
      if (res.ok) {
        setIsDone(true) // Okamžite skryť
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (status !== 'PENDING' || isRunning || isDone) {
    return null
  }

  return (
    <div className="flex gap-1 justify-end">
      <Button 
        onClick={() => handleReview('APPROVED')} 
        size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 border-green-200" disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button 
        onClick={() => handleReview('REJECTED')} 
        size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 border-red-200" disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      </Button>
    </div>
  )
}
```

## File: src/components/notifications-bell.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { format } from 'date-fns'

export function NotificationsBell() {
  const [notes, setNotes] = useState<any[]>([])
  const unreadCount = notes.filter(n => !n.isRead).length

  const fetchNotes = () => {
    fetch('/api/notifications').then(r => r.json()).then(setNotes)
  }

  useEffect(() => {
    fetchNotes()
    const interval = setInterval(fetchNotes, 30000) // Kontrola každých 30s
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    fetchNotes()
  }

  return (
    <Dialog onOpenChange={(open) => open && markAsRead()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Upozornenia</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400">Žiadne nové správy.</p>
          ) : (
            notes.map(n => (
              <div key={n.id} className={`p-3 rounded-lg border ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-100'}`}>
                <p className="text-xs font-bold">{n.title}</p>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                <p className="text-[9px] text-slate-400 mt-2">{format(new Date(n.createdAt), 'dd.MM HH:mm')}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/timer-button.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, Pause, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface TimerButtonProps {
  jobId: string
  initialStartTime?: string | null 
  initialIsPaused?: boolean
  initialPausedMinutes?: number
  initialLastPauseStart?: string | null
}

export function TimerButton({ 
    jobId, 
    initialStartTime, 
    initialIsPaused = false,
    initialPausedMinutes = 0,
    initialLastPauseStart
}: TimerButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [description, setDescription] = useState('')
  
  const [startTime, setStartTime] = useState<Date | null>(initialStartTime ? new Date(initialStartTime) : null)
  const [isPaused, setIsPaused] = useState(initialIsPaused)
  const [pausedMinutes, setPausedMinutes] = useState(initialPausedMinutes)
  
  const [elapsed, setElapsed] = useState('00:00:00')

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (startTime && !isPaused) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = now.getTime() - startTime.getTime() - (pausedMinutes * 60 * 1000)
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [startTime, isPaused, pausedMinutes])

  // Funkcia na volanie API
  const callApi = async (body: any) => {
    setLoading(true)
    try {
        console.log("Odosielam:", body) // Debug
        const res = await fetch('/api/timesheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        
        const data = await res.json()
        
        if (!res.ok) {
            alert(`Chyba: ${data.error || 'Neznáma chyba servera'}`)
            return null
        }
        return data
    } catch (e) { 
        console.error(e)
        alert("Nepodarilo sa spojiť so serverom.")
        return null
    } finally { 
        setLoading(false) 
    }
  }

  const handleTogglePause = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const data = await callApi({ jobId, action: 'TOGGLE_PAUSE' })
    if (data) {
        setIsPaused(data.status === 'paused')
        if (data.status === 'resumed') {
            setPausedMinutes(data.data.totalPausedMinutes)
        }
        router.refresh()
    }
  }

  const handleStopClick = () => {
    setShowStopDialog(true)
  }

  const sendStopRequest = async () => {
    const data = await callApi({ jobId, description })
    if (data) {
        setStartTime(null); setIsPaused(false); setPausedMinutes(0);
        setShowStopDialog(false); setDescription('');
        router.refresh()
    }
  }

  const startTimer = async () => {
    const data = await callApi({ jobId }) // Štart (bez akcie)
    if (data) {
        setStartTime(new Date(data.data.startTime))
        router.refresh()
    }
  }

  if (startTime) {
    return (
      <div className="flex items-center gap-2">
        <Button 
            onClick={handleStopClick}
            variant="destructive" 
            className={`${!isPaused ? 'animate-pulse' : ''} font-mono min-w-[120px] shadow-md`} 
            disabled={loading}
        >
            <Square className="mr-2 h-4 w-4 fill-current" />
            {elapsed}
        </Button>

        <Button
            onClick={handleTogglePause}
            variant="outline"
            className={`w-10 px-0 ${isPaused ? 'bg-amber-100 text-amber-700 border-amber-300' : 'text-slate-500'}`}
            disabled={loading}
            title={isPaused ? "Pokračovať" : "Pauza"}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
        </Button>

        <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Ukončiť prácu</DialogTitle>
                <DialogDescription>Popíšte vykonanú prácu.</DialogDescription>
            </DialogHeader>
            <div className="py-4"><Textarea placeholder="Napr. Úprava loga..." value={description} onChange={e => setDescription(e.target.value)} /></div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowStopDialog(false)}>Zrušiť</Button>
                <Button onClick={sendStopRequest} disabled={!description.trim() || loading} className="bg-slate-900 text-white">Uložiť</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <Button onClick={startTimer} className="bg-green-600 hover:bg-green-700 text-white shadow-md min-w-[140px]" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
        Štart Práce
    </Button>
  )
}
```

## File: src/components/add-tender-file-dialog.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

export function AddTenderFileDialog({ tenderId }: { tenderId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [fileUrl, setFileUrl] = useState('')

  const handleAdd = async () => {
    if (!fileUrl || !name) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tenders/${tenderId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, name, fileType: 'LINK' })
      })
      if (res.ok) {
        setOpen(false); setFileUrl(''); setName('');
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
            <Plus className="h-4 w-4 text-slate-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Pridať odkaz k tendru</DialogTitle>
            <DialogDescription>Zadajte názov a URL adresu (Dropbox, Drive...)</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Napr. Tendrové podklady" />
          </div>
          <div className="grid gap-2">
            <Label>Link (URL)</Label>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="www.google.com/drive/..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={loading || !fileUrl || !name} className="bg-slate-900 text-white w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Uložiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/traffic-requests-inbox.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2, ArrowRightLeft, MessageCircleWarning } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface RequestItem {
  id: string
  reason: string
  createdAt: string
  requestByUser: { name: string | null; email: string }
  targetUser: { name: string | null; email: string }
  assignment: {
    job: {
      title: string
      campaign: { client: { name: string } }
    }
  }
}

export function TrafficRequestsInbox() {
  const router = useRouter()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/traffic/requests')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setRequests(data)
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(requestId)
    try {
        const res = await fetch('/api/traffic/requests', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, status })
        })
        if (res.ok) {
            await fetchRequests() // Obnoví zoznam
            router.refresh()      // Obnoví celú stránku (aby sa prehodili joby v grafoch)
        }
    } catch (e) { console.error(e) }
    finally { setProcessingId(null) }
  }

  if (loading) return null // Nechceme blikať, ak načítavame
  if (requests.length === 0) return null // Ak nie sú žiadosti, nezobrazujeme nič

  return (
    <Card className="border-l-4 border-l-orange-500 shadow-md mb-8 bg-orange-50/30">
        <CardHeader className="py-3 border-b bg-orange-100/50">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-orange-800 flex items-center gap-2">
                <MessageCircleWarning className="h-4 w-4" /> Čakajúce žiadosti o presun ({requests.length})
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y divide-orange-100">
                {requests.map(req => (
                    <div key={req.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-slate-700">{req.requestByUser.name || req.requestByUser.email}</span>
                                <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                                <span className="font-bold text-slate-700">{req.targetUser.name || req.targetUser.email}</span>
                                <span className="text-slate-400 ml-2">({format(new Date(req.createdAt), 'dd.MM HH:mm')})</span>
                            </div>
                            <p className="font-black text-sm text-slate-900">
                                {req.assignment.job.title} <span className="font-normal text-slate-500">({req.assignment.job.campaign.client.name})</span>
                            </p>
                            <p className="text-xs text-slate-600 italic bg-white border px-2 py-1 rounded inline-block">
                                " {req.reason} "
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                onClick={() => handleAction(req.id, 'APPROVED')} 
                                disabled={!!processingId}
                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                            >
                                {processingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                                Schváliť
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAction(req.id, 'REJECTED')} 
                                disabled={!!processingId}
                                className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                            >
                                Zamietnuť
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
  )
}
```

## File: src/components/agency-settings.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Save, Building, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AgencySettings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    companyId: '',
    vatId: '',
    address: '',
    email: ''
  })

  useEffect(() => {
    fetch('/api/agency')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setForm({
            name: data.name || '',
            logoUrl: data.logoUrl || '',
            companyId: data.companyId || '',
            vatId: data.vatId || '',
            address: data.address || '',
            email: data.email || ''
          })
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/agency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        alert("Nastavenia úspešne uložené!")
        router.refresh()
      }
    } catch (e) { 
      console.error(e) 
      alert("Chyba pri ukladaní")
    } finally { 
      setSaving(false) 
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Načítavam nastavenia agentúry...</div>

  return (
    <div className="grid gap-6">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Profil Agentúry</CardTitle>
          </div>
          <CardDescription>Základná identita vášho AgencyFlow.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="agency-name">Názov agentúry</Label>
              <Input id="agency-name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo-url">Logo URL (odkaz na obrázok)</Label>
              <Input id="logo-url" placeholder="https://..." value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-lg">Fakturačné údaje</CardTitle>
          </div>
          <CardDescription>Údaje potrebné pre internú administratívu.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="company-id">IČO</Label>
                <Input id="company-id" value={form.companyId} onChange={e => setForm({...form, companyId: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vat-id">DIČ / IČ DPH</Label>
                <Input id="vat-id" value={form.vatId} onChange={e => setForm({...form, vatId: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Sídlo / Adresa</Label>
              <Input id="address" placeholder="Ulica, Mesto, PSČ" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agency-email">Oficiálny kontaktný Email</Label>
              <Input id="agency-email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white min-w-[180px] h-11">
          {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Uložiť všetky zmeny
        </Button>
      </div>
    </div>
  )
}
```

## File: src/components/sidebar.tsx

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Clock, Users, LogOut, TrendingUp, Trophy, Building2, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Sidebar({ slug, role }: { slug: string; role: string }) {
  const pathname = usePathname()

  const routes = [
    { label: 'Dashboard', icon: LayoutDashboard, href: `/${slug}`, color: 'text-sky-500' },
    { label: 'Plánovač', icon: CalendarDays, href: `/${slug}/planner`, color: 'text-emerald-500' },
    { label: 'Klienti', icon: Building2, href: `/${slug}/clients`, color: 'text-blue-500' },
    { label: 'Joby & Kampane', icon: Briefcase, href: `/${slug}/jobs`, color: 'text-violet-500' },
    { label: 'Traffic / Kapacita', icon: TrendingUp, href: `/${slug}/traffic`, color: 'text-orange-500' },
    { label: 'Timesheety', icon: Clock, href: `/${slug}/timesheets`, color: 'text-pink-700' },
  ]

  // ADMIN VIEW: ADMIN, ACCOUNT, TRAFFIC a SUPERADMIN vidia viac možností
  if (role !== 'CREATIVE') {
    routes.push({ label: 'Tendre & Pitching', icon: Trophy, href: `/${slug}/tenders`, color: 'text-yellow-400' })
    routes.push({ label: 'Administrácia', icon: Users, href: `/${slug}/agency`, color: 'text-slate-400' })
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white border-r border-white/10 shadow-xl">
      <div className="px-3 py-2 flex-1">
        <Link href={`/${slug}`} className="flex items-center pl-3 mb-10 hover:opacity-80 transition">
          <h1 className="text-xl font-bold italic">
            Agency<span className="text-blue-500 text-2xl">.</span>Flow
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => {
            const isActive = pathname === route.href || pathname.startsWith(route.href + '/');

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'text-sm group flex p-3 w-full justify-start font-bold cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition-all',
                  isActive ? 'text-white bg-white/20 shadow-sm' : 'text-zinc-400'
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn('h-5 w-5 mr-3', route.color)} />
                  {route.label}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="px-3 py-4 border-t border-white/10">
        <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10 group"
            onClick={() => {
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
                window.location.href = "/login"
            }}>
            <LogOut className="h-5 w-5 mr-3 group-hover:text-red-400 transition-colors" /> Odhlásiť sa
        </Button>
      </div>
    </div>
  )
}
```

## File: src/components/nudge-button.tsx

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BellRing, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function NudgeButton({ timesheetId }: { timesheetId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleNudge = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/timesheets/${timesheetId}/nudge`, { method: 'PATCH' })
      if (res.ok) router.refresh()
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Button 
      onClick={handleNudge} 
      variant="ghost" 
      size="sm" 
      disabled={loading}
      className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <BellRing className="h-3 w-3 mr-1" />}
      URGOVAŤ
    </Button>
  )
}
```

## File: src/components/mobile-nav.tsx

```typescript
'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Sidebar } from '@/components/sidebar'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function MobileNav({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Keď užívateľ klikne na link a zmení sa adresa, zavrieme menu
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="md:hidden flex items-center p-4 border-b bg-white sticky top-0 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-slate-900 w-72">
          <Sidebar slug={slug} />
        </SheetContent>
      </Sheet>
      <div className="ml-4 font-bold text-lg tracking-tight">
        Agency<span className="text-blue-500">Flow</span>
      </div>
    </div>
  )
}
```

## File: src/components/add-planner-entry-dialog.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export function AddPlannerEntryDialog({ allJobs }: { allJobs: any[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [jobId, setJobId] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [minutes, setMinutes] = useState('60')
  const [title, setTitle] = useState('')

  const handleSave = async () => {
    if (!title || !date) return
    setLoading(true)
    const finalJobId = jobId === 'INTERNAL' ? '' : jobId;

    try {
      const res = await fetch(`/api/planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: finalJobId, 
          date, 
          minutes: minutes,
          title
        })
      })
      if (res.ok) {
        setOpen(false)
        setJobId('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
        setMinutes('60')
        setTitle('')
        
        // ZMENA: Použijeme tvrdý reload, aby to bolo 100% spoľahlivé ako pri Delete/Edit
        window.location.reload() 
      } else {
          alert("Chyba: Nepodarilo sa uložiť plán.")
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
            <Plus className="h-4 w-4 mr-2" /> Naplánovať prácu
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog-content-fixed-mobile">
        <DialogHeader>
            <DialogTitle>Nový záznam v Plánovači</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Job / Projekt (Voliteľné)</Label>
            <Select onValueChange={setJobId} value={jobId}>
              <SelectTrigger><SelectValue placeholder="Vyberte job, na ktorom budete pracovať" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL">INTERNÁ PRÁCA / BEZ KLIENTA</SelectItem> 
                {allJobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                        {job.title} ({job.campaign.client.name})
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Popis úlohy</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Napr. Príprava podkladov k tendru..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Dátum</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Odhad minút</Label><Input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading || !title || !date} className="bg-emerald-600 text-white w-full">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Uložiť do plánu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/client-file-dialog.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Paperclip } from 'lucide-react'

export function ClientFileDialog({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('TENDER')

  const handleUpload = async () => {
    if (!fileUrl) return
    setLoading(true)
    try {
      const res = await fetch('/api/clients/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, fileUrl, fileType })
      })
      if (res.ok) {
        setOpen(false)
        setFileUrl('')
        router.refresh()
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
            <Plus className="h-3.5 w-3.5" /> Pridať dokument
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Pridať dokument ku klientovi</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov / URL súboru</Label>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="Napr. tendrove-zadanie-v1.pdf" />
          </div>
          <div className="grid gap-2">
            <Label>Typ dokumentu</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TENDER">Tendrové zadanie</SelectItem>
                <SelectItem value="PROPOSAL">Vypracovanie / Prezentácia</SelectItem>
                <SelectItem value="CONTRACT">Zmluva / Právne</SelectItem>
                <SelectItem value="MANUAL">Brand manuál</SelectItem>
                <SelectItem value="OTHER">Iné</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={loading || !fileUrl} className="bg-slate-900 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Uložiť do archívu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/assign-user-dialog.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

export function AssignUserDialog({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([]) // Inicializované ako prázdne pole
  
  const [selectedUser, setSelectedUser] = useState('')
  const [roleOnJob, setRoleOnJob] = useState('')

  // Načítanie užívateľov pri otvorení okna
  useEffect(() => {
    if (open) {
        fetch('/api/agency/users')
            .then(res => res.json())
            .then(data => {
                // KRITICKÁ KONTROLA: Ak dáta nie sú pole, nastavíme prázdne pole
                if (Array.isArray(data)) {
                    setUsers(data)
                } else {
                    console.error("API nevrátilo pole užívateľov:", data)
                    setUsers([])
                }
            })
            .catch(err => {
                console.error("Chyba pri načítaní užívateľov:", err)
                setUsers([])
            })
    }
  }, [open])

  const handleAssign = async () => {
    if (!selectedUser) return
    setLoading(true)
    
    try {
        const res = await fetch('/api/jobs/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                jobId, 
                userId: selectedUser, 
                roleOnJob: roleOnJob || 'Člen tímu' 
            })
        })
        
        if (res.ok) {
            setOpen(false)
            setRoleOnJob('')
            setSelectedUser('')
            router.refresh()
        }
    } catch (e) {
        console.error(e)
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto hover:bg-slate-100">
            <Plus className="h-4 w-4 text-slate-600" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pridať kolegu na projekt</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label>Vybrať užívateľa</Label>
            <Select onValueChange={setSelectedUser} value={selectedUser}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Načítavam..." : "Vyberte kolegu..."} />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                    <div className="p-2 text-xs text-center text-muted-foreground">Žiadni užívatelia k dispozícii</div>
                ) : (
                    users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                            {u.name || u.email} ({u.role})
                        </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Rola na tomto jobe</Label>
            <Input 
                placeholder="Napr. Art Director, Copywriter..." 
                value={roleOnJob}
                onChange={(e) => setRoleOnJob(e.target.value)}
            />
          </div>

        </div>
        <DialogFooter>
            <Button onClick={handleAssign} disabled={loading || !selectedUser} className="bg-slate-900 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Priradiť na job
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/components/planner-display.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isValid } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Clock, Pencil, Loader2 } from 'lucide-react'
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts' 
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger, 
    DialogFooter 
} from "@/components/ui/dialog"


// TLAČIDLO PRE DELETE (s auto-refreshom)
const DeleteButton = ({ entryId }: { entryId: string }) => {
    // Odstránil som router.refresh() a používam window.location.reload()
    const [loading, setLoading] = useState(false)
    
    const handleDelete = async () => {
        if(!confirm("Naozaj vymazať túto naplánovanú položku?")) return
        setLoading(true)
        try {
            const res = await fetch(`/api/planner/${entryId}`, { method: 'DELETE' })
            if (res.ok) window.location.reload() // <--- SILNÝ REFRESH
        } catch(e) { console.error(e) } finally { setLoading(false) }
    }
    return (
        <div className="flex items-center">
            {loading ? <Loader2 className="h-3 w-3 animate-spin text-red-500" /> : (
                <Trash2 
                    className="h-3 w-3 text-red-400 cursor-pointer hover:text-red-600" 
                    onClick={handleDelete}
                />
            )}
        </div>
    )
}

// DIALÓG PRE EDITÁCIU
const EditDialog = ({ entry, allJobs, onSave }: { entry: any, allJobs: any[], onSave: () => void }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    
    const [jobId, setJobId] = useState(entry.jobId || 'INTERNAL')
    const [date, setDate] = useState(format(new Date(entry.date), 'yyyy-MM-dd'))
    const [minutes, setMinutes] = useState(entry.minutes.toString())
    const [title, setTitle] = useState(entry.title || '')

    const handleSave = async () => {
        setLoading(true)
        const finalJobId = jobId === 'INTERNAL' ? null : jobId;
        try {
            const res = await fetch(`/api/planner/${entry.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: finalJobId, date, minutes, title })
            })
            if (res.ok) {
                setOpen(false)
                onSave() // Volá refresh
            } else {
                alert("Chyba pri úprave.")
            }
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600">
                    <Pencil className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Upraviť záznam</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label>Job</Label>
                        <Select onValueChange={setJobId} value={jobId}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INTERNAL">INTERNÁ PRÁCA</SelectItem> 
                                {allJobs.map(job => (<SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2"><Label>Popis</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Dátum</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Minúty</Label><Input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} /></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white w-full">Uložiť zmeny</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function PlannerDisplay({ initialEntries, allJobs }: { initialEntries: any[], allJobs: any[] }) {
    const router = useRouter() // Musíme importovať router kvôli onSave v EditDialog
    const [entries] = useState(initialEntries)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    // LOGIKA GRAFU
    const plannedHoursData = days.map(day => {
      const totalMinutes = entries
        .filter(e => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
        .reduce((sum, e) => sum + e.minutes, 0)
      
      return { name: format(day, 'E'), hodiny: totalMinutes / 60, minutes: totalMinutes }
    })
    
    if (!isMounted) return <div className="h-[250px] w-full bg-slate-50 animate-pulse rounded-xl" />


    return (
        <div className="space-y-6">
            <Card className="shadow-lg border-none ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Clock className="h-4 w-4" /> Naplánovaná Kapacita</CardTitle>
                    <Badge variant="secondary" className="bg-white/10 text-white font-bold text-xs">{Math.floor(plannedHoursData.reduce((s,i) => s + i.minutes, 0) / 60)}h</Badge>
                </CardHeader>
                <CardContent className="pt-4 h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={plannedHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="hodiny" name="Hodiny" fill="#34d399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>


            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {days.map(day => {
                const dayEntries = entries.filter(e => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

                return (
                    <Card key={day.toString()} className={`min-h-[250px] shadow-md ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardHeader className="p-3 border-b bg-slate-50/50">
                        <p className="text-[10px] font-black uppercase text-slate-400">{format(day, 'EEEE')}</p>
                        <p className="text-sm font-bold">{format(day, 'd. MMMM')}</p>
                    </CardHeader>
                    <CardContent className="p-2 space-y-2">
                        {dayEntries.length === 0 ? (
                            <p className="text-center py-6 text-slate-400 text-xs italic">Voľný deň.</p>
                        ) : (
                            dayEntries.map(e => (
                                <div key={e.id} className="p-2 bg-white border rounded text-[10px] shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-blue-600 uppercase">{e.job?.campaign?.client?.name || 'Interná práca'}</p>
                                        <p className="font-medium truncate">{e.title}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-[8px] h-4 mb-1">{e.minutes}m</Badge>
                                        <EditDialog entry={e} allJobs={allJobs} onSave={() => window.location.reload()} />
                                        <DeleteButton entryId={e.id} />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                    </Card>
                )
                })}
            </div>
        </div>
    )
}
```

## File: src/components/add-job-dialog.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from 'lucide-react'

export function AddJobDialog({ campaignId }: { campaignId: string }) { // <-- Potrebujeme campaignId
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('0')

  const handleCreate = async () => {
    if (!title || !deadline) return
    setLoading(true)

    try {
      // API volanie volá novú, statickú adresu a posiela campaignId v body
      const res = await fetch(`/api/create-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title, 
            deadline, 
            budget,
            campaignId: campaignId // <--- POSIELAME CAMPAIGN ID
        })
      })
      
      if (res.ok) {
        setOpen(false)
        setTitle('')
        setDeadline('')
        setBudget('0')
        router.refresh() // Po úspechu refreshni, aby sa job objavil
      } else {
        const err = await res.json()
        alert("Chyba: " + (err.error || "Neznáma chyba"))
      }
    } catch (e) { 
        console.error(e)
        alert("Nepodarilo sa spojiť so serverom.")
    } finally { 
        setLoading(false) 
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold uppercase tracking-wider">
            + Nový job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pridať Job do kampane</DialogTitle>
          <DialogDescription>Vytvorte novú úlohu pre tím.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Názov jobu</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Napr. Produkcia TV spotu" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Deadline</Label>
                <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label>Budget (€)</Label>
                <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading || !title || !deadline} className="bg-slate-900 text-white w-full sm:w-auto">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Vytvoriť Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## File: src/lib/prisma.ts

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

console.log("DEBUG: process.env.DATABASE_URL =", process.env.DATABASE_URL);
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_Aw56YZHlVUhO@ep-calm-violet-aggutujf-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## File: src/lib/notifications.ts

```typescript
import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        isRead: false,
      },
    });
    return notification;
  } catch (error) {
    console.error("Chyba pri vytváraní notifikácie:", error);
  }
}
```

## File: src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

## File: src/lib/session.ts

```typescript
import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export interface Session {
  userId: string
  agencyId: string
  role: string
}

export function getSession(): Session | null {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: decoded.userId,
      agencyId: decoded.agencyId,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}
```

## File: prisma/migrations/20251223154735_add_agency_billing_details/migration.sql

```sql
-- AlterTable
ALTER TABLE "Agency" ADD COLUMN     "address" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "vatId" TEXT;

```

## File: prisma/migrations/migration_lock.toml

```toml
# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "postgresql"
```

## File: prisma/migrations/20251223152837_sync_user_details/migration.sql

```sql
/*
  Warnings:

  - A unique constraint covering the columns `[agencyId,name]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT,
ADD COLUMN     "position" TEXT;

-- CreateTable
CREATE TABLE "AgencyPosition" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AgencyPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyPosition_agencyId_name_key" ON "AgencyPosition"("agencyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Client_agencyId_name_key" ON "Client"("agencyId", "name");

-- AddForeignKey
ALTER TABLE "AgencyPosition" ADD CONSTRAINT "AgencyPosition_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

```

## File: prisma/migrations/20251224154529_add_agency_slug/migration.sql

```sql
/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Agency` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Agency` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agency" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

```

## File: prisma/migrations/20251223125710_sync_db_fix/migration.sql

```sql
-- AlterTable
ALTER TABLE "Timesheet" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "costRate" DOUBLE PRECISION DEFAULT 0,
ALTER COLUMN "hourlyRate" SET DEFAULT 0;

```

## File: prisma/migrations/20251223135328_client_updates/migration.sql

```sql
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_jobId_fkey";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "scope" TEXT;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "clientId" TEXT,
ALTER COLUMN "jobId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ContactPerson" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT,

    CONSTRAINT "ContactPerson_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContactPerson" ADD CONSTRAINT "ContactPerson_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

```

## File: prisma/migrations/20251224071706_add_timer_pausing/migration.sql

```sql
-- AlterTable
ALTER TABLE "Timesheet" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPauseStart" TIMESTAMP(3),
ADD COLUMN     "totalPausedMinutes" INTEGER NOT NULL DEFAULT 0;

```

## File: prisma/migrations/20251223111031_init/migration.sql

```sql
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'ACCOUNT', 'CREATIVE', 'TRAFFIC');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "role" "Role" NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'TODO',
    "deadline" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleOnJob" TEXT NOT NULL,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL,
    "jobAssignmentId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItem_timesheetId_key" ON "BudgetItem"("timesheetId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_jobAssignmentId_fkey" FOREIGN KEY ("jobAssignmentId") REFERENCES "JobAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

```

## File: prisma/migrations/20251223132201_add_budget/migration.sql

```sql
-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "budget" DOUBLE PRECISION DEFAULT 0;

```

## File: prisma/migrations/20251223140444_final_schema_update/migration.sql

```sql
-- CreateTable
CREATE TABLE "AgencyScope" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AgencyScope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyScope_agencyId_name_key" ON "AgencyScope"("agencyId", "name");

-- AddForeignKey
ALTER TABLE "AgencyScope" ADD CONSTRAINT "AgencyScope_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

```

## File: prisma/migrations/20251225052352_tender_final_cleanup/migration.sql

```sql
-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'TENDER';

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_jobId_fkey";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "jobAssignmentId" TEXT,
ADD COLUMN     "tenderId" TEXT,
ALTER COLUMN "jobId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "tenderId" TEXT;

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'TODO',
    "deadline" TIMESTAMP(3) NOT NULL,
    "budget" DOUBLE PRECISION DEFAULT 0,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderAssignment" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleOnJob" TEXT NOT NULL,
    "jobAssignmentId" TEXT,

    CONSTRAINT "TenderAssignment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_jobAssignmentId_fkey" FOREIGN KEY ("jobAssignmentId") REFERENCES "JobAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderAssignment" ADD CONSTRAINT "TenderAssignment_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderAssignment" ADD CONSTRAINT "TenderAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderAssignment" ADD CONSTRAINT "TenderAssignment_jobAssignmentId_fkey" FOREIGN KEY ("jobAssignmentId") REFERENCES "JobAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

```

## File: prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- ENUMS ---

enum Role {
  SUPERADMIN
  ADMIN
  ACCOUNT
  CREATIVE
  TRAFFIC
}

enum JobStatus {
  TODO
  IN_PROGRESS
  DONE
  TENDER
}

enum TimesheetStatus {
  PENDING
  APPROVED
  REJECTED
}

// --- MODELS ---

model Agency {
  id         String   @id @default(uuid())
  name       String
  slug       String   @unique 
  logoUrl    String?
  
  // Fakturačné údaje
  companyId  String?  // IČO
  vatId      String?  // DIČ / IČ DPH
  address    String?  
  email      String?  
  
  users      User[]
  clients    Client[]
  scopes     AgencyScope[]
  positions  AgencyPosition[]
  tenders    Tender[]
  createdAt  DateTime @default(now())
}

// Učiaci sa zoznam rozsahov (Digital, ATL...)
model AgencyScope {
  id        String   @id @default(uuid())
  agencyId  String
  agency    Agency   @relation(fields: [agencyId], references: [id])
  name      String   
  @@unique([agencyId, name])
}

// Učiaci sa zoznam pozícií (Art Director, Copywriter...)
model AgencyPosition {
  id        String   @id @default(uuid())
  agencyId  String
  agency    Agency   @relation(fields: [agencyId], references: [id])
  name      String   
  category  String?  @default("Ostatné")
  @@unique([agencyId, name])
}

model User {
  id           String   @id @default(uuid())
  agencyId     String?
  agency       Agency?  @relation(fields: [agencyId], references: [id])
  role         Role
  name         String?
  position     String?
  email        String   @unique
  passwordHash String
  
  // Sadzby
  hourlyRate   Float?   @default(0) 
  costRate     Float?   @default(0) 
  active       Boolean  @default(true)
  
  // Vzťahy
  assignments      JobAssignment[]
  comments         Comment[]
  tenderAssignments TenderAssignment[]
  plannerEntries   PlannerEntry[]
  notifications    Notification[]
  clientNotes      ClientNote[]
  
  // Traffic žiadosti
  requestsSent     ReassignmentRequest[] @relation("RequestBy")
  requestsReceived ReassignmentRequest[] @relation("TargetUser")
}

model Client {
  id         String   @id @default(uuid())
  agencyId   String
  agency     Agency   @relation(fields: [agencyId], references: [id])
  name       String
  priority   Int 
  scope      String?  
  
  contacts   ContactPerson[]
  files      File[]
  campaigns  Campaign[]
  notes      ClientNote[] // Newsfeed
  
  archivedAt DateTime?
  createdAt  DateTime @default(now())
  @@unique([agencyId, name])
}

model ClientNote {
  id        String   @id @default(uuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  text      String
  isPinned  Boolean  @default(false)
  createdAt DateTime @default(now())
}

model ContactPerson {
  id        String  @id @default(uuid())
  clientId  String
  client    Client  @relation(fields: [clientId], references: [id])
  name      String
  email     String?
  phone     String?
  position  String?
}

model Campaign {
  id          String   @id @default(uuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  name        String
  description String?
  jobs        Job[]
  archivedAt  DateTime?
}

model Job {
  id          String   @id @default(uuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  title       String
  status      JobStatus @default(TODO)
  deadline    DateTime
  budget      Float?   @default(0)
  
  assignments JobAssignment[]
  comments    Comment[]
  files       File[]
  budgets     BudgetItem[]
  plannerEntries PlannerEntry[]
  
  archivedAt  DateTime?
  createdAt   DateTime @default(now())
}

model JobAssignment {
  id          String   @id @default(uuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  roleOnJob   String   
  
  timesheets  Timesheet[]
  comments    Comment[] 
  tenderAssignments TenderAssignment[]
  reassignmentRequests ReassignmentRequest[]
}

model ReassignmentRequest {
  id              String   @id @default(uuid())
  assignmentId    String
  assignment      JobAssignment @relation(fields: [assignmentId], references: [id])
  
  requestByUserId String
  requestByUser   User     @relation("RequestBy", fields: [requestByUserId], references: [id])
  
  targetUserId    String
  targetUser      User     @relation("TargetUser", fields: [targetUserId], references: [id])
  
  reason          String
  status          String   @default("PENDING")
  createdAt       DateTime @default(now())
}

model PlannerEntry {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  jobId     String?  // Voliteľné pre internú prácu
  job       Job?     @relation(fields: [jobId], references: [id])
  
  date      DateTime
  minutes   Int      @default(60)
  title     String?
  isDone    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  message   String
  link      String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Timesheet {
  id              String          @id @default(uuid())
  jobAssignmentId String
  jobAssignment   JobAssignment   @relation(fields: [jobAssignmentId], references: [id])
  startTime       DateTime
  endTime         DateTime?       
  durationMinutes Int?
  description     String?         
  status          TimesheetStatus @default(PENDING)
  approvedBy      String?         
  approvedAt      DateTime?
  budgetItem      BudgetItem?
  
  // Stopky a urgencia
  isPaused           Boolean   @default(false)
  lastPauseStart     DateTime?
  totalPausedMinutes Int       @default(0)
  isUrgent           Boolean   @default(false)
}

model BudgetItem {
  id          String   @id @default(uuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id])
  timesheetId String   @unique 
  timesheet   Timesheet @relation(fields: [timesheetId], references: [id])
  hours       Float
  rate        Float
  amount      Float    
  createdAt   DateTime @default(now())
}

model Comment {
  id        String   @id @default(uuid())
  
  // Väzba na Job
  jobId     String?
  job       Job?     @relation(fields: [jobId], references: [id])
  
  // Väzba na JobAssignment
  jobAssignmentId String?
  jobAssignment   JobAssignment? @relation(fields: [jobAssignmentId], references: [id])

  // Väzba na Tender
  tenderId  String?
  tender    Tender?  @relation(fields: [tenderId], references: [id], onDelete: Cascade) 
  
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  text      String
  createdAt DateTime @default(now())
}

model File {
  id         String   @id @default(uuid())
  name       String?  @default("")
  
  jobId      String?  
  job        Job?     @relation(fields: [jobId], references: [id])
  
  clientId   String?
  client     Client?  @relation(fields: [clientId], references: [id])
  
  tenderId   String?
  tender     Tender?  @relation(fields: [tenderId], references: [id], onDelete: Cascade) 
  
  uploadedBy String
  fileUrl    String
  fileType   String
  createdAt  DateTime @default(now())
}

model Tender {
  id          String    @id @default(uuid())
  agencyId    String
  agency      Agency    @relation(fields: [agencyId], references: [id])
  title       String
  description String?   // Brief
  status      JobStatus @default(TODO) 
  deadline    DateTime
  budget      Float?    @default(0)
  isConverted Boolean   @default(false)
  
  assignments TenderAssignment[]
  comments    Comment[]
  files       File[]
  createdAt   DateTime  @default(now())
}

model TenderAssignment {
    id          String   @id @default(uuid())
    tenderId    String
    tender      Tender    @relation(fields: [tenderId], references: [id], onDelete: Cascade)
    
    userId      String
    user        User     @relation(fields: [userId], references: [id])
    
    roleOnJob   String

    jobAssignmentId String? 
    jobAssignment   JobAssignment? @relation(fields: [jobAssignmentId], references: [id])
}
```

## File: prisma/seed.ts

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const STRUCTURED_POSITIONS = [
  { category: "1. Vedenie agentúry", roles: ["Managing Director / CEO", "Executive Director", "Operations Director", "Finance Director / CFO"] },
  { category: "2. Client Service / Account", roles: ["Account Executive", "Account Manager", "Senior Account Manager", "Account Director", "Group Account Director", "Traffic Manager", "Project Manager"] },
  { category: "3. Strategy / Planning", roles: ["Strategic Planner", "Digital Strategist", "Media Strategist", "Brand Strategist"] },
  { category: "4. Creative oddelenie", roles: ["Creative Director (CD)", "Associate Creative Director (ACD)", "Art Director (AD)", "Copywriter", "Graphic Designer", "Motion Designer", "Content Creator"] },
  { category: "5. Digital / Performance", roles: ["PPC Specialist", "Performance Marketing Manager", "Media Buyer", "SEO Specialist", "Social Media Manager", "Community Manager", "CRM Specialist", "Data Specialist"] },
  { category: "6. Production / Delivery", roles: ["Producer", "Digital Producer", "Project Manager Delivery", "Traffic Manager Production"] },
  { category: "7. Tech / Development", roles: ["Frontend Developer", "Backend Developer", "Full-stack Developer", "UX Designer", "UI Designer", "UX Researcher", "QA / Tester", "Tech Lead"] },
  { category: "8. Podporné oddelenia", roles: ["HR Manager", "Office Manager", "Finance / Accounting", "Legal / Compliance", "IT Support"] }
]

async function main() {
  console.log('--- ŠTART ŠTRUKTÚROVANÉHO SEEDU ---')
  
  const agencies = await prisma.agency.findMany()
  
  for (const agency of agencies) {
    console.log(`Dopĺňam pozície pre agentúru: ${agency.name}`)
    
    for (const group of STRUCTURED_POSITIONS) {
      for (const roleName of group.roles) {
        await prisma.agencyPosition.upsert({
          where: { agencyId_name: { agencyId: agency.id, name: roleName } },
          update: { category: group.category },
          create: { agencyId: agency.id, name: roleName, category: group.category }
        })
      }
    }
  }
  console.log('--- HOTOVO ---')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
```

## File: package.json

```json
{
  "name": "agency-flow",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toggle": "^1.1.10",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.6.0",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.350.0",
    "next": "^14.2.23",
    "next-auth": "^4.24.13",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^3.6.0",
    "resend": "^6.6.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.2.23",
    "postcss": "^8.4.35",
    "prisma": "^6.0.0",
    "tailwindcss": "^3.4.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}

```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

## File: tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

```

## File: next.config.mjs

```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Vercel nebude kontrolovať ESLint chyby pri builde
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vercel nebude kontrolovať TypeScript chyby pri builde
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

## File: .env

```
DATABASE_URL='postgresql://neondb_owner:npg_Aw56YZHlVUhO@ep-calm-violet-aggutujf-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
JWT_SECRET="super-tajne-heslo-123"

```

## File: .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

/src/generated/prisma

```

## File: README.md

```md
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

## File: components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}

```

## File: postcss.config.mjs

```mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;

```

