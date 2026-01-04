
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

interface FinancialRecord {
    id: string;
    clientName: string;
    campaignName: string;
    jobTitle: string;
    jobStatus: string;
    hours: number;
    rate: number;
    amount: number;
    createdAt: string;
}

export function FinancialsTable({ agencyId }: { agencyId: string }) {
    const [data, setData] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div>Načítavam dáta...</div>;
    if (!data.length) return <div>Žiadne finančné záznamy.</div>;

    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                <span className="font-medium">Celkový objem (zobrazené):</span>
                <span className="text-xl font-bold">{totalAmount.toFixed(2)} €</span>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Dátum</TableHead>
                            <TableHead>Klient</TableHead>
                            <TableHead>Kampaň / Job</TableHead>
                            <TableHead className="text-right">Hodiny</TableHead>
                            <TableHead className="text-right">Sadzba</TableHead>
                            <TableHead className="text-right">Suma</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{format(new Date(item.createdAt), "dd.MM.yyyy")}</TableCell>
                                <TableCell>{item.clientName}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{item.jobTitle}</div>
                                    <div className="text-xs text-muted-foreground">{item.campaignName}</div>
                                </TableCell>
                                <TableCell className="text-right">{item.hours.toFixed(1)} h</TableCell>
                                <TableCell className="text-right">{item.rate.toFixed(1)} €/h</TableCell>
                                <TableCell className="text-right font-medium">{item.amount.toFixed(2)} €</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
