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
import { TenderTabs } from '@/components/tender-tabs'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: {
    slug: string
  }
}

export default async function TendersPage({ params }: PageProps) {
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

  /* 2.1 SECURITY CHECK - Agency Isolation */
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id && !session.godMode) {
    redirect('/login')
  }

  /* 3️⃣ ROLE LOGIC */
  const isCreative = session.role === 'CREATIVE'

  /* 4️⃣ FILTER – kreatívec vidí len svoje tendre */
  const tenderFilter = isCreative
    ? {
      assignments: {
        some: {
          userId: session.userId,
        },
      },
    }
    : {}

  /* 5️⃣ FETCH TENDERS */
  const allTenders = await prisma.tender.findMany({
    where: {
      agencyId: agency.id,
      // We fetch ALL tenders now, filtering happens in JS or we could do 2 queries. 
      // 2 queries is cleaner but finding all and filtering is fine for small datasets.
      // Let's filter in query for efficiency? No, easier to filter arrays here.
      ...tenderFilter,
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
        deadline: 'asc',
      },
    ],
  })

  const activeTenders = allTenders.filter(t => !t.isConverted && t.status !== 'DONE')
  const archivedTenders = allTenders.filter(t => t.isConverted || t.status === 'DONE')

  /* 6️⃣ RENDER */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase italic">
            Tendre Pipeline
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Prehľad súťaží a tendrov.
          </p>
        </div>

        {!isCreative && (
          <Link href={`/${params.slug}/tenders/new`}>
            <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2 shadow-md">
              <Plus className="h-4 w-4" /> Nový Tender
            </Button>
          </Link>
        )}
      </div>

      <TenderTabs
        activeTenders={activeTenders}
        archivedTenders={archivedTenders}
        slug={params.slug}
        isCreative={isCreative}
      />
    </div>
  )
}
