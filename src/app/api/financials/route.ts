
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "ACCOUNT" && session.role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
        return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // Verify access to agency
    if (session.role !== "SUPERADMIN" && session.agencyId !== agencyId) {
        return NextResponse.json({ error: "Forbidden Agency Access" }, { status: 403 });
    }

    try {
        const budgetItems = await prisma.budgetItem.findMany({
            where: {
                job: {
                    campaign: {
                        client: {
                            agencyId: agencyId
                        }
                    }
                }
            },
            include: {
                job: {
                    select: {
                        title: true,
                        status: true,
                        campaign: {
                            select: {
                                name: true,
                                client: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit for performance
        });

        const data = budgetItems.map(item => ({
            id: item.id,
            clientName: item.job.campaign.client.name,
            campaignName: item.job.campaign.name,
            jobTitle: item.job.title,
            jobStatus: item.job.status,
            hours: item.hours,
            rate: item.rate,
            amount: item.amount,
            createdAt: item.createdAt
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching financials:", error);
        return NextResponse.json(
            { error: "Failed to fetch financials" },
            { status: 500 }
        );
    }
}
