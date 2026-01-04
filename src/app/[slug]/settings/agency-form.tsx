
"use client";

import { useState } from "react";
import { Agency, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown } from "lucide-react";

interface AgencyFormProps {
    agency: Agency & { internalApprovers?: User[] };
    users: User[]; // All users in agency to select as internal account
}

export function AgencyForm({ agency, users }: AgencyFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: agency.name || "",
        contactName: agency.contactName || "",
        companyId: agency.companyId || "",
        vatId: agency.vatId || "",
        address: agency.address || "",
        email: agency.email || "",
        internalApproverIds: agency.internalApprovers?.map(u => u.id) || [],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleApprover = (userId: string) => {
        setFormData(prev => {
            const current = prev.internalApproverIds;
            if (current.includes(userId)) {
                return { ...prev, internalApproverIds: current.filter(id => id !== userId) };
            } else {
                return { ...prev, internalApproverIds: [...current, userId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/settings/agency", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: agency.id,
                    ...formData,
                }),
            });

            if (!res.ok) throw new Error("Failed to update");

            router.refresh();
            // You might want to show a toast here
        } catch (error) {
            console.error(error);
            alert("Chyba pri ukladaní");
        } finally {
            setLoading(false);
        }
    };

    const selectedApproversText = formData.internalApproverIds.length > 0
        ? users.filter(u => formData.internalApproverIds.includes(u.id)).map(u => u.name).join(", ")
        : "Vyberte schvaľovateľov";

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">

            {/* SECTION: Internal Work Approval */}
            <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
                <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                            <rect width="8" height="18" x="3" y="3" rx="1" />
                            <path d="M7 3v18" />
                            <path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Schvaľovanie Interných Prác</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Kto schvaľuje interné joby a výkazy? Ak nie je vybraný nikto, notifikácie chodia Traffic manažérom.
                        </p>
                    </div>
                </div>

                <div className="space-y-2 max-w-md">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Zodpovedný Account Manager</Label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between font-normal bg-slate-50 border-slate-200">
                                <span className={formData.internalApproverIds.length === 0 ? "text-red-500 font-medium" : "text-slate-900"}>
                                    {formData.internalApproverIds.length === 0 ? "🚫 Nikto (Len Traffic)" : selectedApproversText}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[400px]">
                            <DropdownMenuLabel>Vyberte schvaľovateľov</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {users.map((u) => (
                                <DropdownMenuCheckboxItem
                                    key={u.id}
                                    checked={formData.internalApproverIds.includes(u.id)}
                                    onCheckedChange={() => toggleApprover(u.id)}
                                >
                                    {u.name} <span className="text-xs text-muted-foreground ml-2">({u.email})</span>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* SECTION: Profile */}
            <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
                <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" x2="22" y1="12" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Profil Agentúry</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Základná identita vášho AgencyFlow.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-semibold uppercase text-slate-500">Názov agentúry</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="bg-slate-50 border-slate-200" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactName" className="text-xs font-semibold uppercase text-slate-500">Logo URL (odkaz na obrázok)</Label>
                        <Input id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} placeholder="https://..." className="bg-slate-50 border-slate-200" />
                    </div>
                </div>
            </div>

            {/* SECTION: Invoicing */}
            <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
                <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Fakturačné údaje</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Údaje potrebné pre internú administratívu.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="companyId" className="text-xs font-semibold uppercase text-slate-500">IČO</Label>
                        <Input id="companyId" name="companyId" value={formData.companyId} onChange={handleChange} className="bg-slate-50 border-slate-200" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vatId" className="text-xs font-semibold uppercase text-slate-500">DIČ / IČ DPH</Label>
                        <Input id="vatId" name="vatId" value={formData.vatId} onChange={handleChange} className="bg-slate-50 border-slate-200" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-semibold uppercase text-slate-500">Fakturačný Email</Label>
                        <Input id="email" name="email" value={formData.email} onChange={handleChange} className="bg-slate-50 border-slate-200" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-xs font-semibold uppercase text-slate-500">Adresa</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleChange} className="bg-slate-50 border-slate-200" />
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full md:w-auto">
                {loading ? "Ukladám..." : "Uložiť nastavenia"}
            </Button>
        </form>
    );
}

