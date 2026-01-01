import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export default async function NewJobPage({ params }: { params: { slug: string } }) {
    const session = await getSession()
    if (!session) redirect('/login')

    const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
    if (!agency) redirect('/login')

    // Fetch campaigns for dropdown
    const campaigns = await prisma.campaign.findMany({
        where: { client: { agencyId: agency.id }, archivedAt: null },
        include: { client: true }
    })

    async function createJob(formData: FormData) {
        'use server'
        const title = formData.get('title') as string
        const campaignId = formData.get('campaignId') as string
        const deadline = formData.get('deadline') as string
        const budget = formData.get('budget') as string

        if (!title || !campaignId || !deadline) return

        await prisma.job.create({
            data: {
                title,
                campaignId,
                deadline: new Date(deadline),
                budget: parseFloat(budget || '0'),
                status: 'TODO'
            }
        })

        revalidatePath(`/${params.slug}/jobs`)
        redirect(`/${params.slug}/jobs`)
    }

    return (
        <div className="max-w-2xl mx-auto p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/${params.slug}/jobs`}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Nový Job</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Vytvoriť nový job</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createJob} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Názov Jobu</Label>
                            <Input name="title" placeholder="Napr. Redizajn webu" required />
                        </div>

                        <div className="space-y-2">
                            <Label>Kampaň / Klient</Label>
                            <select
                                name="campaignId"
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                                required
                            >
                                <option value="">Vyberte kampaň...</option>
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.client.name} - {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Deadline</Label>
                                <Input name="deadline" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Budget (€)</Label>
                                <Input name="budget" type="number" step="0.01" min="0" />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-slate-900 text-white font-bold mt-4">
                            Vytvoriť Job
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
