
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
        id,
        name,
        contactName,
        companyId,
        vatId,
        address,
        email,
        internalApproverIds,
        trialEndsAt,
        isSuspended,
    } = await req.json();

    if (!id) {
        return NextResponse.json({ error: "Missing Agency ID" }, { status: 400 });
    }

    // Permission check: Only Admin/Superadmin can update agency settings
    const canUpdate =
        session.role === "ADMIN" ||
        session.role === "SUPERADMIN";

    if (!canUpdate) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure user belongs to the agency they are trying to update (unless Superadmin)
    if (session.role !== "SUPERADMIN" && session.agencyId !== id) {
        return NextResponse.json({ error: "Forbidden Agency Access" }, { status: 403 });
    }

    try {
        const updatedAgency = await prisma.agency.update({
            where: { id },
            data: {
                name,
                contactName,
                companyId,
                vatId,
                address,
                email,
                internalApprovers: {
                    set: [], // Clear existing relations
                    connect: internalApproverIds?.map((id: string) => ({ id })) || [],
                },
                // Only Superadmin can change trial/suspension status usually, but we'll allow it generally for now based on requirements or if passed
                ...(session.role === "SUPERADMIN" && {
                    trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : undefined,
                    isSuspended: isSuspended,
                }),
            },
        });

        return NextResponse.json(updatedAgency);
    } catch (error) {
        console.error("Error updating agency:", error);
        return NextResponse.json(
            { error: "Failed to update agency" },
            { status: 500 }
        );
    }
}
