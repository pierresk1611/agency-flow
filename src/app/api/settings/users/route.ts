
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin/Superadmin can create users
    if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { email, password, name, role, position, agencyId, hourlyRate, costRate } = body;

        if (!email || !password || !agencyId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name,
                role: (role === "SUPERADMIN" && session.role !== "SUPERADMIN") ? "ADMIN" : (role || "CREATIVE"),
                position,
                agencyId: session.role === "SUPERADMIN" ? (agencyId || session.agencyId) : session.agencyId,
                hourlyRate: parseFloat(hourlyRate || "0"),
                costRate: parseFloat(costRate || "0"),
                active: true,
            },
        });

        // Remove sensitive data
        const { passwordHash, ...userWithoutPassword } = newUser;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, name, role, position, hourlyRate, costRate, password, active } = body;

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Verify user belongs to same agency
        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser || (targetUser.agencyId !== session.agencyId && session.role !== "SUPERADMIN")) {
            return NextResponse.json({ error: "User not found or access denied" }, { status: 404 });
        }

        const updates: any = {
            name,
            role: (role === "SUPERADMIN" && session.role !== "SUPERADMIN") ? undefined : role, // Don't allow non-superadmins to promote to superadmin
            position,
            hourlyRate: parseFloat(hourlyRate),
            costRate: parseFloat(costRate),
            active
        };

        if (password) {
            updates.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updates,
        });

        const { passwordHash, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);

    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        // Verify user belongs to same agency
        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser || (targetUser.agencyId !== session.agencyId && session.role !== "SUPERADMIN")) {
            return NextResponse.json({ error: "User not found or access denied" }, { status: 404 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
