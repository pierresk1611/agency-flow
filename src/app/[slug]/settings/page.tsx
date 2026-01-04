
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgencyForm } from "./agency-form";
import { UsersSettings } from "./users-settings";

export default async function SettingsPage({ params }: { params: { slug: string } }) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const agency = await prisma.agency.findUnique({
        where: { slug: params.slug },
        include: {
            internalAccount: true,
            internalApprovers: true
        }
    });

    if (!agency) return <div>Agency not found</div>;

    // Authorization: Only Admin/Superadmin
    if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
        return <div className="p-8">Nemáte oprávnenie na prístup k nastaveniam.</div>;
    }

    const users = await prisma.user.findMany({
        where: { agencyId: agency.id },
        orderBy: { name: 'asc' }
    });

    const positions = await prisma.agencyPosition.findMany({
        where: { agencyId: agency.id },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nastavenia</h1>
                <p className="text-muted-foreground">
                    Správa agentúry, užívateľov a konfigurácie.
                </p>
            </div>

            <Tabs defaultValue="agency" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="agency">Detail Agentúry</TabsTrigger>
                    <TabsTrigger value="users">Užívatelia</TabsTrigger>
                </TabsList>
                <TabsContent value="agency" className="space-y-4">
                    <div className="rounded-lg border p-4 bg-card text-card-foreground shadow-sm">
                        <AgencyForm agency={agency} users={users} />
                    </div>
                </TabsContent>
                <TabsContent value="users" className="space-y-4">
                    <div className="rounded-lg border p-4 bg-card text-card-foreground shadow-sm">
                        <UsersSettings users={users} positions={positions} agencyId={agency.id} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
