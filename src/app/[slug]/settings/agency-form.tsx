
"use client";

import { useState } from "react";
import { Agency, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface AgencyFormProps {
    agency: Agency & { internalAccount?: User | null };
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
        internalAccountId: agency.internalAccountId || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div>
                <h3 className="text-lg font-medium">Základné údaje</h3>
                <p className="text-sm text-muted-foreground">
                    Názov agentúry a kontaktná osoba.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Názov agentúry</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactName">Kontaktná osoba</Label>
                    <Input id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} />
                </div>
            </div>

            <Separator />

            <div>
                <h3 className="text-lg font-medium">Fakturačné údaje</h3>
                <p className="text-sm text-muted-foreground">
                    Fakturačné údaje pre zobrazenie na faktúrach a v exportoch.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="companyId">IČO</Label>
                    <Input id="companyId" name="companyId" value={formData.companyId} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vatId">DIČ / IČ DPH</Label>
                    <Input id="vatId" name="vatId" value={formData.vatId} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Fakturačný Email</Label>
                    <Input id="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="internalAccountId">Interný schvaľovateľ</Label>
                    <select
                        id="internalAccountId"
                        name="internalAccountId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.internalAccountId}
                        onChange={handleChange}
                    >
                        <option value="">-- Vyberte užívateľa --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Adresa</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? "Ukladám..." : "Uložiť zmeny"}
            </Button>
        </form>
    );
}
