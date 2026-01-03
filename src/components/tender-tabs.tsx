'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, ArrowRight, FolderArchive, FileText } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function TenderTabs({
    activeTenders,
    archivedTenders,
    slug,
    isCreative
}: {
    activeTenders: any[],
    archivedTenders: any[],
    slug: string,
    isCreative: boolean
}) {
    return (
        <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="active">Aktívne ({activeTenders.length})</TabsTrigger>
                <TabsTrigger value="archive">Archív / Vyhrané ({archivedTenders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
                <TendersTable tenders={activeTenders} slug={slug} isArchive={false} />
            </TabsContent>

            <TabsContent value="archive">
                <ArchivedTendersView tenders={archivedTenders} slug={slug} />
            </TabsContent>
        </Tabs>
    )
}

function ArchivedTendersView({ tenders, slug }: { tenders: any[], slug: string }) {
    if (tenders.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400 italic bg-white border rounded-xl shadow-sm">
                Žiadne archivované tendre.
            </div>
        )
    }

    // Since we don't have a direct Client relation on Tender, and usually a Tender = Potential Client,
    // we can group by Title (as the 'Client Name') or just show them in a list.
    // The user requested "group by client". For Tenders, the Title IS often the client name.
    // Let's try to infer if we can group them. 
    // If not, we just show one table.

    // For now, let's display a single table but with the same clean, fixed-width styling.
    // If we simply consider the "Title" as the Project/Client, grouping might be redundant if there's only 1 tender per "Client".

    return (
        <div className="space-y-6">
            <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-900 text-white py-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <FolderArchive className="h-4 w-4 text-slate-400" />
                        Vyhrané / Ukončené Tendre
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto w-full">
                        <TendersTable tenders={tenders} slug={slug} isArchive={true} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function TendersTable({ tenders, slug, isArchive }: { tenders: any[], slug: string, isArchive: boolean }) {
    return (
        <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    {/* FIXED WIDTHS */}
                    <TableHead className="pl-6 w-[300px] text-[10px] font-black uppercase">Názov</TableHead>
                    <TableHead className="w-[150px] text-[10px] font-black uppercase">Deadline</TableHead>
                    <TableHead className="w-[150px] text-[10px] font-black uppercase">Status</TableHead>
                    <TableHead className="text-right pr-6 w-[100px] text-[10px] font-black uppercase">Akcia</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {tenders.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-slate-400 italic text-sm">
                            {isArchive ? 'Žiadne archivované tendre.' : 'Žiadne aktívne tendre.'}
                        </TableCell>
                    </TableRow>
                ) : (
                    tenders.map((tender) => (
                        <TableRow key={tender.id} className="hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="pl-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-800">{tender.title}</span>
                                    <span className="text-[9px] text-slate-500">{tender._count.files} príloh</span>
                                </div>
                            </TableCell>

                            <TableCell className="text-sm font-medium">
                                {tender.deadline ? (
                                    <span className={cn(
                                        !isArchive && new Date(tender.deadline) < new Date() ? "text-red-600 font-bold" : "text-slate-600"
                                    )}>
                                        {format(new Date(tender.deadline), 'dd.MM.yyyy')}
                                    </span>
                                ) : '–'}
                            </TableCell>

                            <TableCell>
                                {tender.isConverted ? (
                                    <Badge className="bg-green-600 text-white border-none px-2 font-bold uppercase text-[10px]">Vyhrané</Badge>
                                ) : (
                                    <Badge className={cn(
                                        "text-[10px] font-bold uppercase",
                                        tender.status === 'TODO' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                            tender.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                'bg-green-100 text-green-700 border-green-200'
                                    )}>
                                        {tender.status}
                                    </Badge>
                                )}
                            </TableCell>

                            <TableCell className="text-right pr-6">
                                <Link href={`/${slug}/tenders/${tender.id}`}>
                                    <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-bold">
                                        Detail <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}
