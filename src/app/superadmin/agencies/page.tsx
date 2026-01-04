import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Lock, Unlock, AlertTriangle } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { AgencyActions } from './agency-actions'

export default async function AgenciesPage() {
    // Fetch all agencies
    const agencies = await prisma.agency.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            users: {
                where: { role: 'ADMIN' },
                take: 1
            }
        }
    })

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Správa Agentúr</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Zoznam všetkých agentúr</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 font-medium">Názov agentúry</th>
                                    <th className="p-4 font-medium">Kontakt (Admin)</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Trial Končí</th>
                                    <th className="p-4 font-medium">Akcie</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agencies.map((agency) => (
                                    <tr key={agency.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="p-4 font-medium">
                                            {agency.name}
                                            <div className="text-xs text-slate-500 font-normal">{agency.slug}</div>
                                        </td>
                                        <td className="p-4">
                                            {agency.contactName}
                                            <div className="text-xs text-slate-500">{agency.users[0]?.email || 'No Email'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Badge variant={
                                                    agency.isSuspended ? 'destructive' :
                                                        agency.status === 'ACTIVE' ? 'default' :
                                                            agency.status === 'PENDING' ? 'secondary' : 'outline'
                                                }>
                                                    {agency.isSuspended ? 'SUSPENDED' : agency.status}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {agency.trialEndsAt ? (
                                                <span className={new Date(agency.trialEndsAt) < new Date() ? 'text-red-500 font-bold' : ''}>
                                                    {format(new Date(agency.trialEndsAt), 'dd.MM.yyyy')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <form action={async () => {
                                                    'use server'
                                                    await prisma.agency.update({
                                                        where: { id: agency.id },
                                                        data: { isSuspended: !agency.isSuspended }
                                                    })
                                                    revalidatePath('/superadmin/agencies')
                                                }}>
                                                    <Button
                                                        size="sm"
                                                        variant={agency.isSuspended ? "default" : "secondary"}
                                                        className="h-8 w-8 p-0"
                                                        title={agency.isSuspended ? "Odblokovať" : "Blokovať"}
                                                    >
                                                        {agency.isSuspended ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                    </Button>
                                                </form>

                                                <AgencyActions agency={agency} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
