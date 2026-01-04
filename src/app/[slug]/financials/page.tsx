
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FinancialsTable } from "@/components/financials-table";

export default async function FinancialsPage({ params }: { params: { slug: string } }) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const agency = await prisma.agency.findUnique({
        where: { slug: params.slug },
    });

    if (!agency) return <div>Agency not found</div>;

    // Authorization: ADMIN, ACCOUNT, SUPERADMIN
    const allowedRoles = ["ADMIN", "ACCOUNT", "SUPERADMIN"];
    if (!allowedRoles.includes(session.role)) {
        return <div className="p-8">Nemáte oprávnenie na prehľad financií.</div>;
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Finančný prehľad</h1>
                <p className="text-muted-foreground">
                    Prehľad nákladov a budgetov z jobs a timesheetov.
                </p>
            </div>

            <div className="rounded-lg border p-4 bg-card text-card-foreground shadow-sm">
                <FinancialsTable agencyId={agency.id} />
            </div>
        </div>
    );
}
