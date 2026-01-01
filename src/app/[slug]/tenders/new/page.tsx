import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export default async function NewTenderPage({ params }: { params: { slug: string } }) {
    const session = await getSession()
    if (!session) redirect('/login')

    const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
    if (!agency) redirect('/login')

    async function createTender(formData: FormData) {
        'use server'
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const deadline = formData.get('deadline') as string
        const budget = formData.get('budget') as string

        if (!title || !deadline) return

        await prisma.tender.create({
            data: {
                agencyId: agency!.id,
                title,
                description,
                deadline: new Date(deadline),
                budget: parseFloat(budget || '0'),
                status: 'TODO'
            }
        })

        revalidatePath(`/${params.slug}/tenders`)
        redirect(`/${params.slug}/tenders`)
    }

    return (
        <div className="max-w-2xl mx-auto p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/${params.slug}/tenders`}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Nový Tender</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Vytvoriť nový tender</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createTender} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Názov Tendra</Label>
                            <Input name="title" placeholder="Napr. Kampaň pre Slovnaft" required />
                        </div>

                        <div className="space-y-2">
                            <Label>Popis / Brief</Label>
                            <Textarea name="description" placeholder="Stručný popis zadania..." />
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
                            Vytvoriť Tender
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
