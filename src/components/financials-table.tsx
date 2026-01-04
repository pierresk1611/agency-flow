
"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, TrendingUp, TrendingDown, Clock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

interface JobFinancials {
    id: string;
    clientName: string;
    campaignName: string;
    jobTitle: string;
    jobStatus: string;
    deadline: string;
    budget: number;
    actualCost: number;
    totalHours: number;
    difference: number;
    profitability: number;
    createdAt: string;
}

export function FinancialsTable({ agencyId }: { agencyId: string }) {
    const [data, setData] = useState<JobFinancials[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"ALL" | "OVER" | "UNDER">("ALL");
    const router = useRouter();
    const pathname = usePathname();
    // Extract slug from pathname (e.g. /agency-slug/financials -> agency-slug)
    const slug = pathname.split('/')[1];

    useEffect(() => {
        fetch(`/api/financials?agencyId=${agencyId}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setData(data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [agencyId]);

    const filteredData = data.filter(item => {
        const matchesSearch =
            item.clientName.toLowerCase().includes(search.toLowerCase()) ||
            item.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
            item.campaignName.toLowerCase().includes(search.toLowerCase());

        if (filter === "OVER") return matchesSearch && item.actualCost > item.budget;
        if (filter === "UNDER") return matchesSearch && item.actualCost <= item.budget;
        return matchesSearch;
    });

    const totalBudget = filteredData.reduce((sum, item) => sum + item.budget, 0);
    const totalActual = filteredData.reduce((sum, item) => sum + item.actualCost, 0);
    const totalDiff = totalBudget - totalActual;
    const totalHours = filteredData.reduce((sum, item) => sum + item.totalHours, 0);

    const handleRowClick = (jobId: string) => {
        router.push(`/${slug}/jobs/${jobId}`);
    };

    if (loading) return <div>Načítavam dáta...</div>;

    return (
        <div className="space-y-8">
            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                        <p className="text-xs font-medium uppercase tracking-wider opacity-70">Celkový Plán</p>
                        <h3 className="text-3xl font-bold mt-2">{totalBudget.toLocaleString()} €</h3>
                    </CardContent>
                </Card>
                <Card className="bg-blue-600 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                        <p className="text-xs font-medium uppercase tracking-wider opacity-70">Skutočnosť</p>
                        <h3 className="text-3xl font-bold mt-2">{totalActual.toLocaleString()} €</h3>
                    </CardContent>
                </Card>
                <Card className={`${totalDiff >= 0 ? "bg-emerald-500" : "bg-red-500"} text-white border-0 shadow-lg`}>
                    <CardContent className="p-6">
                        <p className="text-xs font-medium uppercase tracking-wider opacity-70">Rozdiel</p>
                        <h3 className="text-3xl font-bold mt-2 flex items-center gap-2">
                            {totalDiff >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                            {totalDiff.toLocaleString()} €
                        </h3>
                    </CardContent>
                </Card>
                <Card className="bg-orange-500 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                        <p className="text-xs font-medium uppercase tracking-wider opacity-70">Celkové Hodiny</p>
                        <h3 className="text-3xl font-bold mt-2 flex items-center gap-2">
                            <Clock className="h-6 w-6" />
                            {totalHours.toFixed(1)} h
                        </h3>
                    </CardContent>
                </Card>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2">
                    <Button
                        variant={filter === "ALL" ? "default" : "outline"}
                        onClick={() => setFilter("ALL")}
                        className="text-xs"
                    >
                        Všetky ({data.length})
                    </Button>
                    <Button
                        variant={filter === "OVER" ? "destructive" : "outline"}
                        onClick={() => setFilter("OVER")}
                        className="text-xs"
                    >
                        Nad rozpočtom ({data.filter(i => i.actualCost > i.budget).length})
                    </Button>
                    <Button
                        variant={filter === "UNDER" ? "secondary" : "outline"}
                        onClick={() => setFilter("UNDER")}
                        className="text-xs"
                    >
                        Pod rozpočtom ({data.filter(i => i.actualCost <= i.budget).length})
                    </Button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Hľadať klienta, kampaň..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="uppercase text-[10px] font-bold tracking-wider">Klient</TableHead>
                            <TableHead className="uppercase text-[10px] font-bold tracking-wider">Job</TableHead>
                            <TableHead className="uppercase text-[10px] font-bold tracking-wider">Deadline</TableHead>
                            <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right">Plán</TableHead>
                            <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right">Realita</TableHead>
                            <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right">Rozdiel</TableHead>
                            <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right">Ziskovosť</TableHead>
                            <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((item) => (
                            <TableRow
                                key={item.id}
                                className="cursor-pointer hover:bg-slate-50 transition-colors group"
                                onClick={() => handleRowClick(item.id)}
                            >
                                <TableCell className="font-bold text-slate-700">
                                    {item.clientName}
                                    <div className="text-[10px] font-normal text-slate-500 truncate max-w-[120px]">{item.campaignName}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{item.jobTitle}</div>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">
                                    {format(new Date(item.deadline), "dd.MM.yyyy")}
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-700">
                                    {item.budget.toFixed(0)} €
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-bold text-blue-600">{item.actualCost.toFixed(0)} €</span>
                                    <div className="text-[10px] text-slate-400">{item.totalHours.toFixed(1)} h</div>
                                </TableCell>
                                <TableCell className={`text-right font-bold ${item.difference >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {item.difference > 0 ? "+" : ""}{item.difference.toFixed(0)} €
                                </TableCell>
                                <TableCell className={`text-right font-bold ${item.profitability >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                    {item.profitability.toFixed(1)} %
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge className={item.actualCost <= item.budget ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}>
                                        {item.actualCost <= item.budget ? "Pod" : "Nad"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
