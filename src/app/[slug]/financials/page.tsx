
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
                <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-black italic tracking-tight uppercase">Finančný Prehľad</h1>
                </div>
                <p className="text-slate-500 font-medium">
                    Rozpočty a ziskovosť projektov
                </p>
            </div>

            <div className="rounded-lg border p-4 bg-card text-card-foreground shadow-sm">
                <FinancialsTable agencyId={agency.id} />
            </div>
        </div>
    );
}
