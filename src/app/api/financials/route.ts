
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "ACCOUNT" && session.role !== "SUPERADMIN" && !session.godMode) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
        return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // Verify access to agency
    if (session.role !== "SUPERADMIN" && session.agencyId !== agencyId && !session.godMode) {
        return NextResponse.json({ error: "Forbidden Agency Access" }, { status: 403 });
    }

    try {
        // Fetch JOBS instead of budgetItems directly
        const jobs = await prisma.job.findMany({
            where: {
                campaign: {
                    client: {
                        agencyId: agencyId
                    }
                },
                archivedAt: null // Only active jobs usually
            },
            include: {
                campaign: {
                    include: {
                        client: {
                            select: { name: true }
                        }
                    }
                },
                budgets: true // All budget items (costs)
            },
            orderBy: { createdAt: 'desc' }
        });

        const data = jobs.map(job => {
            const totalBilling = job.budgets.reduce((sum, item) => sum + (item.amount || 0), 0);
            const totalInternalCost = job.budgets.reduce((sum, item) => sum + ((item as any).internalAmount || 0), 0);
            const totalHours = job.budgets.reduce((sum, item) => sum + item.hours, 0);

            const estimatedBudget = job.budget || 0;
            const profit = totalBilling - totalInternalCost;

            // Profitability margin (Profit / Billing)
            let margin = 0;
            if (totalBilling > 0) {
                margin = (profit / totalBilling) * 100;
            }

            return {
                id: job.id,
                clientName: job.campaign.client.name,
                campaignName: job.campaign.name,
                jobTitle: job.title,
                jobStatus: job.status,
                deadline: job.deadline,
                budget: estimatedBudget, // Keeping estimated budget separate
                actualBilling: totalBilling,
                actualCost: totalInternalCost,
                totalHours: totalHours,
                difference: profit, // Repurposing as profit for now
                profitability: margin,
                createdAt: job.createdAt
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching financials:", error);
        return NextResponse.json(
            { error: "Failed to fetch financials" },
            { status: 500 }
        );
    }
}
