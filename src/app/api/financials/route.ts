
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
            const totalCost = job.budgets.reduce((sum, item) => sum + item.amount, 0);
            const totalHours = job.budgets.reduce((sum, item) => sum + item.hours, 0);
            const budget = job.budget || 0;
            const difference = budget - totalCost;

            // Profitability: if budget is 0 (T&M or unset), maybe 0% or 100%?
            // If budget > 0, (budget - cost) / budget * 100
            let profitability = 0;
            if (budget > 0) {
                profitability = ((budget - totalCost) / budget) * 100;
            } else if (totalCost > 0) {
                // No budget but costs? Technically profit margin depends on internal cost vs billable,
                // but here we only have 'amount' which is usually billable amount.
                // Let's assume 'profitability' in the screenshot implies remaining budget %.
                profitability = -100; // Over budget if budget is 0?
            } else {
                profitability = 0;
            }


            return {
                id: job.id,
                clientName: job.campaign.client.name,
                campaignName: job.campaign.name,
                jobTitle: job.title,
                jobStatus: job.status,
                deadline: job.deadline,
                budget: budget,
                actualCost: totalCost,
                totalHours: totalHours,
                difference: difference,
                profitability: profitability,
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
