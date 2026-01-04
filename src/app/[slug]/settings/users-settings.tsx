
"use client";

import { useState } from "react";
import { User, AgencyPosition } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

interface UsersSettingsProps {
    users: User[];
    positions: AgencyPosition[];
    agencyId: string;
}

export function UsersSettings({ users, positions, agencyId }: UsersSettingsProps) {
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "CREATIVE",
        position: "",
        hourlyRate: "0",
        costRate: "0",
        active: true,
    });

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "CREATIVE",
            position: "",
            hourlyRate: "0",
            costRate: "0",
            active: true,
        });
        setEditingUser(null);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name || "",
            email: user.email,
            password: "", // Leave blank usually
            role: user.role,
            position: user.position || "",
            hourlyRate: user.hourlyRate?.toString() || "0",
            costRate: user.costRate?.toString() || "0",
            active: user.active
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Naozaj chcete vymazať tohto užívateľa?")) return;

        try {
            const res = await fetch(`/api/settings/users?id=${userId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete");
            router.refresh();
        } catch (e) {
            console.error(e);
            alert("Chyba pri mazaní (užívateľ môže mať priradené úlohy)");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = "/api/settings/users";
            const method = editingUser ? "PATCH" : "POST";
            const body = {
                ...formData,
                id: editingUser?.id,
                agencyId,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Error saving user");
            }

            setIsDialogOpen(false);
            resetForm();
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Užívatelia a prístupy</h3>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>Pridať užívateľa</Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "Upraviť užívateľa" : "Pridať nového užívateľa"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Meno</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={!!editingUser}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Heslo {editingUser && "(Nevyplňujte pre ponechanie)"}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="role">Rola</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="CREATIVE">Creative</option>
                                    <option value="ACCOUNT">Account</option>
                                    <option value="TRAFFIC">Traffic</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPERADMIN">Superadmin</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="position">Pozícia</Label>
                                <select
                                    id="position"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                >
                                    <option value="">-- Vyberte --</option>
                                    {positions.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="hourlyRate">Hodinová sadzba (€)</Label>
                                <Input
                                    id="hourlyRate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.hourlyRate}
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="costRate">Nákladová sadzba (€)</Label>
                                <Input
                                    id="costRate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.costRate}
                                    onChange={(e) => setFormData({ ...formData, costRate: e.target.value })}
                                />
                            </div>
                        </div>

                        {editingUser && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
                                />
                                <Label htmlFor="active">Aktívny účet</Label>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Ukladám..." : (editingUser ? "Uložiť zmeny" : "Vytvoriť užívateľa")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase">
                        <tr>
                            <th className="px-4 py-3">Meno</th>
                            <th className="px-4 py-3">Rola</th>
                            <th className="px-4 py-3">Pozícia</th>
                            <th className="px-4 py-3">Stav</th>
                            <th className="px-4 py-3 text-right">Akcie</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-muted/50">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                </td>
                                <td className="px-4 py-3">{user.role}</td>
                                <td className="px-4 py-3">{user.position || "-"}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                        {user.active ? "Aktívny" : "Neaktívny"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>Upraviť</Button>
                                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(user.id)}>Zmazať</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
